from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
import csv, io, platform, os, secrets

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    StudentProfileSerializer,
    TeacherProfileSerializer,
    ParentProfileSerializer,
    AdminProfileSerializer,
)
from .permissions import IsAdmin, IsSelfOrAdmin
from apps.courses.models import Course
from apps.assessments.models import Attendance, BehaviorLog, House, Submission, Assignment

User = get_user_model()


class CustomTokenObtainPairView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone']

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class AdminAnalyticsView(APIView):
    """
    Real-time admin analytics endpoint.
    Returns system health, user stats, financials, and predictive insights.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        now = timezone.now()
        today = now.date()

        # --- User Stats ---
        total_users = User.objects.count()
        role_breakdown = dict(
            User.objects.values_list('role').annotate(count=Count('role'))
        )

        # --- Course Stats ---
        active_courses = Course.objects.filter(is_active=True).count()

        # --- Attendance ---
        today_attendance = Attendance.objects.filter(date=today).count()
        present_today = Attendance.objects.filter(date=today, status='present').count()

        # --- Behavior Points ---
        positive_logs = BehaviorLog.objects.filter(category='positive').count()

        # --- Pending Submissions ---
        pending_grading = Submission.objects.filter(grade__isnull=True).count()

        # --- House Points ---
        houses = list(
            House.objects.values('name', 'points', 'color').order_by('-points')
        )

        # --- System Health (simulated for local dev) ---
        system_health = {
            'server_load_percent': 18.4,
            'memory_usage_mb': 512,
            'api_response_time_ms': 42,
            'error_rate_percent': 0.02,
            'uptime_percent': 99.98,
            'python_version': platform.python_version(),
            'django_version': '5.0.14',
            'database': 'SQLite3 (Dev) / PostgreSQL (Prod)',
            'api_version': 'v1.0.0',
        }

        # --- Revenue (simulated for demo) ---
        revenue = {
            'today_revenue': 125000,
            'month_revenue': 4850000,
            'overdue_payments': 320000,
            'collection_rate_percent': 87.4,
            'currency': 'NGN',
        }

        # --- Predictive Analytics (simulated) ---
        predictive = {
            'at_risk_students': 3,
            'retention_probability_percent': 94.2,
            'dropout_risk_high': 2,
            'teacher_avg_effectiveness_score': 88.6,
        }

        # --- Enrollment Trend (last 7 days simulated) ---
        enrollment_trend = [
            {'date': '2026-07-17', 'new_enrollments': 2},
            {'date': '2026-07-18', 'new_enrollments': 0},
            {'date': '2026-07-19', 'new_enrollments': 1},
            {'date': '2026-07-20', 'new_enrollments': 4},
            {'date': '2026-07-21', 'new_enrollments': 3},
            {'date': '2026-07-22', 'new_enrollments': 1},
            {'date': '2026-07-23', 'new_enrollments': 2},
        ]

        return Response({
            'user_stats': {
                'total_users': total_users,
                'role_breakdown': role_breakdown,
                'active_courses': active_courses,
                'today_attendance': today_attendance,
                'present_today': present_today,
                'pending_grading': pending_grading,
                'positive_behavior_logs': positive_logs,
            },
            'system_health': system_health,
            'revenue': revenue,
            'predictive': predictive,
            'houses': houses,
            'enrollment_trend': enrollment_trend,
        })


class BulkUserImportView(APIView):
    """
    Bulk import students/teachers from CSV upload.
    Expected CSV columns: email, first_name, last_name, role, grade_level, phone
    """
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'error': 'No CSV file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if not csv_file.name.endswith('.csv'):
            return Response({'error': 'File must be a .csv file.'}, status=status.HTTP_400_BAD_REQUEST)

        decoded = csv_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

        required_cols = {'email', 'first_name', 'last_name', 'role'}
        if not required_cols.issubset(set(reader.fieldnames or [])):
            return Response(
                {'error': f'CSV must have columns: {", ".join(required_cols)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created, skipped, errors = [], [], []

        for row in reader:
            email = row.get('email', '').strip().lower()
            if not email:
                errors.append({'row': row, 'reason': 'Missing email'})
                continue

            if User.objects.filter(email=email).exists():
                skipped.append(email)
                continue

            try:
                # Generate a unique, cryptographically random temp password per user.
                # The admin receives these in the response to distribute securely.
                # Users should be required to change their password on first login.
                temp_password = secrets.token_urlsafe(16)
                user = User.objects.create_user(
                    email=email,
                    password=temp_password,
                    first_name=row.get('first_name', '').strip(),
                    last_name=row.get('last_name', '').strip(),
                    role=row.get('role', 'STUDENT').strip().upper(),
                )
                created.append({'email': email, 'temp_password': temp_password})
            except Exception as e:
                errors.append({'email': email, 'reason': str(e)})

        return Response({
            'created_count': len(created),
            'skipped_count': len(skipped),
            'error_count': len(errors),
            'created': created,   # contains {email, temp_password} — handle securely
            'skipped': skipped,
            'errors': errors,
        }, status=status.HTTP_200_OK)


class SystemAuditLogView(APIView):
    """
    Returns a simulated audit log for system activity.
    In production, integrate with django-auditlog or custom AuditLog model.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        audit_logs = [
            {'id': 1, 'user': 'admin@tarepet.edu.ng', 'action': 'LOGIN', 'target': 'Auth System', 'ip': '127.0.0.1', 'timestamp': '2026-07-24T07:00:12Z', 'status': 'SUCCESS'},
            {'id': 2, 'user': 'admin@tarepet.edu.ng', 'action': 'BULK_IMPORT', 'target': 'Users (4 created)', 'ip': '127.0.0.1', 'timestamp': '2026-07-24T07:02:48Z', 'status': 'SUCCESS'},
            {'id': 3, 'user': 'teacher@tarepet.edu.ng', 'action': 'GRADE_SUBMISSION', 'target': 'Submission #3 (Emeka Amadi)', 'ip': '192.168.1.20', 'timestamp': '2026-07-24T07:15:33Z', 'status': 'SUCCESS'},
            {'id': 4, 'user': 'teacher@tarepet.edu.ng', 'action': 'MARK_ATTENDANCE', 'target': 'MTH-101 Class (24 students)', 'ip': '192.168.1.20', 'timestamp': '2026-07-24T08:05:00Z', 'status': 'SUCCESS'},
            {'id': 5, 'user': 'unknown@invalid.com', 'action': 'LOGIN_ATTEMPT', 'target': 'Auth System', 'ip': '45.33.32.156', 'timestamp': '2026-07-24T08:23:11Z', 'status': 'FAILED'},
            {'id': 6, 'user': 'admin@tarepet.edu.ng', 'action': 'AWARD_HOUSE_POINTS', 'target': 'Blue House Eagle (+25 pts)', 'ip': '127.0.0.1', 'timestamp': '2026-07-24T09:10:02Z', 'status': 'SUCCESS'},
            {'id': 7, 'user': 'admin@tarepet.edu.ng', 'action': 'UPDATE_SETTINGS', 'target': 'School Config (Grading Schema)', 'ip': '127.0.0.1', 'timestamp': '2026-07-24T09:45:00Z', 'status': 'SUCCESS'},
        ]
        return Response({'count': len(audit_logs), 'results': audit_logs})

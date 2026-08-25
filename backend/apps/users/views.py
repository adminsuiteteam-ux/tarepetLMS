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
    SystemSettingsSerializer,
)
from .permissions import IsAdmin, IsSelfOrAdmin
# pyrefly: ignore [missing-import]
from apps.courses.models import Course
# pyrefly: ignore [missing-import]
from apps.assessments.models import Attendance, BehaviorLog, House, Submission, Assignment

from .models import CustomUser, StudentProfile, TeacherProfile, ParentProfile, AdminProfile, LoginActivityLog, OTPVerification, SystemSettings
from .email_service import send_otp_email, mask_email
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip or '127.0.0.1'


class CustomTokenObtainPairView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            user_data = data.get('user', {})
            email = request.data.get('email', user_data.get('email', ''))
            role = user_data.get('role', 'UNKNOWN')
            ip = get_client_ip(request)
            ua = request.META.get('HTTP_USER_AGENT', 'Unknown')

            # Fetch authoritative user instance
            user_obj = User.objects.filter(email__iexact=email).first()

            # Enforce 2FA Email OTP ONLY for TEACHER and ADMIN roles
            if user_obj and user_obj.role in [CustomUser.Role.TEACHER, CustomUser.Role.ADMIN]:
                raw_code, temp_token, otp_obj = OTPVerification.create_otp(
                    user=user_obj,
                    purpose=OTPVerification.Purpose.LOGIN_2FA,
                    validity_minutes=5
                )
                send_otp_email(user_obj, raw_code, validity_minutes=5)

                LoginActivityLog.objects.create(
                    email=email,
                    role=role,
                    ip_address=ip,
                    user_agent=ua,
                    device_info=ua[:150] if ua else 'Unknown Browser/Device',
                    status='PENDING_OTP'
                )

                return Response({
                    'requires_otp': True,
                    'temp_token': temp_token,
                    'role': user_obj.role,
                    'email': user_obj.email,
                    'email_masked': mask_email(user_obj.email),
                    'detail': f'A 6-digit authentication code has been sent to your email ({mask_email(user_obj.email)}).'
                }, status=status.HTTP_200_OK)

            # Direct login for STUDENT and PARENT roles
            LoginActivityLog.objects.create(
                email=email,
                role=role,
                ip_address=ip,
                user_agent=ua,
                device_info=ua[:150] if ua else 'Unknown Browser/Device',
                status='SUCCESS'
            )
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            email = request.data.get('email', '')
            ip = get_client_ip(request)
            ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
            LoginActivityLog.objects.create(
                email=email,
                role='UNKNOWN',
                ip_address=ip,
                user_agent=ua,
                device_info=ua[:150] if ua else 'Unknown Browser/Device',
                status='FAILED_ATTEMPT'
            )
            raise e


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        temp_token = request.data.get('temp_token', '').strip()
        otp_code = request.data.get('otp_code', '').strip()

        if not temp_token or not otp_code:
            return Response({'detail': 'Both temp_token and 6-digit otp_code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_record = OTPVerification.objects.filter(temp_token=temp_token).first()
        if not otp_record:
            return Response({'detail': 'Invalid or expired authentication session. Please sign in again.'}, status=status.HTTP_400_BAD_REQUEST)

        is_valid, msg = otp_record.verify(otp_code)
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', 'Unknown')

        if not is_valid:
            LoginActivityLog.objects.create(
                email=otp_record.user.email,
                role=otp_record.user.role,
                ip_address=ip,
                user_agent=ua,
                device_info=ua[:150] if ua else 'Unknown Browser/Device',
                status='OTP_FAILED'
            )
            return Response({'detail': msg}, status=status.HTTP_400_BAD_REQUEST)

        user = otp_record.user
        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['role'] = user.role
        refresh['name'] = user.get_full_name() or user.email

        LoginActivityLog.objects.create(
            email=user.email,
            role=user.role,
            ip_address=ip,
            user_agent=ua,
            device_info=ua[:150] if ua else 'Unknown Browser/Device',
            status='SUCCESS'
        )

        user_serializer = UserSerializer(user, context={'request': request})
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data,
            'detail': 'Authentication successful.'
        }, status=status.HTTP_200_OK)


class OTPResendView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        temp_token = request.data.get('temp_token', '').strip()
        if not temp_token:
            return Response({'detail': 'temp_token is required to resend OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        old_otp = OTPVerification.objects.filter(temp_token=temp_token).first()
        if not old_otp:
            return Response({'detail': 'Authentication session not found. Please sign in again.'}, status=status.HTTP_400_BAD_REQUEST)

        user = old_otp.user
        # Rate limit: minimum 30 seconds between resends
        seconds_since = (timezone.now() - old_otp.created_at).total_seconds()
        if seconds_since < 30:
            remaining_secs = int(30 - seconds_since)
            return Response({'detail': f'Please wait {remaining_secs} seconds before requesting a new code.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        raw_code, new_temp_token, _ = OTPVerification.create_otp(
            user=user,
            purpose=OTPVerification.Purpose.LOGIN_2FA,
            validity_minutes=5
        )
        send_otp_email(user, raw_code, validity_minutes=5)

        return Response({
            'success': True,
            'temp_token': new_temp_token,
            'email_masked': mask_email(user.email),
            'detail': f'A new 6-digit authentication code was sent to {mask_email(user.email)}.'
        }, status=status.HTTP_200_OK)


class LoginActivityLogView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def get(self, request):
        logs = LoginActivityLog.objects.all()[:100]
        data = [{
            'id': l.id,
            'email': l.email,
            'role': l.role,
            'ip_address': l.ip_address,
            'user_agent': l.user_agent,
            'device_info': l.device_info,
            'status': l.status,
            'timestamp': l.timestamp.isoformat()
        } for l in logs]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        data = request.data
        email = data.get('email', 'Unknown')
        role = data.get('role', 'UNKNOWN')
        ip = data.get('ip_address', get_client_ip(request))
        ua = data.get('user_agent', request.META.get('HTTP_USER_AGENT', ''))
        device_info = data.get('device_info', ua[:150] if ua else 'Client Browser')
        status_val = data.get('status', 'SUCCESS')

        log = LoginActivityLog.objects.create(
            email=email,
            role=role,
            ip_address=ip,
            user_agent=ua,
            device_info=device_info,
            status=status_val
        )
        return Response({'status': 'logged', 'id': log.id}, status=status.HTTP_201_CREATED)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


from rest_framework.pagination import PageNumberPagination


class UserPagination(PageNumberPagination):
    page_size = 200
    page_size_query_param = 'page_size'
    max_page_size = 1000


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    pagination_class = UserPagination
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        read_serializer = UserSerializer(user)
        headers = self.get_success_headers(serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        
        if lookup_value:
            if str(lookup_value).isdigit():
                user = User.objects.filter(pk=int(lookup_value)).first()
                if user:
                    self.check_object_permissions(self.request, user)
                    return user
            
            q_filter = Q(email__iexact=lookup_value) | Q(username__iexact=lookup_value) | Q(student_profile__student_id__iexact=lookup_value) | Q(teacher_profile__teacher_id__iexact=lookup_value)
            user = User.objects.filter(q_filter).first()
            if user:
                self.check_object_permissions(self.request, user)
                return user
                
        return super().get_object()


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

        # --- Enrollment Trend (Real query for past 7 days) ---
        from datetime import timedelta
        enrollment_trend = []
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            count = User.objects.filter(date_joined__date=day_date).count()
            enrollment_trend.append({
                'date': day_date.strftime('%Y-%m-%d'),
                'new_enrollments': count
            })

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

        required_cols = {'first_name', 'last_name', 'role'}
        if not required_cols.issubset(set(reader.fieldnames or [])):
            return Response(
                {'error': f'CSV must have columns: {", ".join(required_cols)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created, skipped, errors = [], [], []

        from .models import StudentProfile, TeacherProfile, ParentProfile, AdminProfile

        for row in reader:
            first_name = row.get('first_name', '').strip()
            last_name = row.get('last_name', '').strip()
            role = row.get('role', 'STUDENT').strip().upper()
            email = row.get('email', '').strip().lower()

            if not email:
                if first_name and last_name:
                    fn = first_name.lower().replace(' ', '')
                    ln = last_name.lower().replace(' ', '')
                    email = f"{fn}.{ln}@tarepet.com"
                else:
                    errors.append({'row': row, 'reason': 'Missing first_name or last_name for email generation'})
                    continue

            if User.objects.filter(email=email).exists():
                skipped.append(email)
                continue

            try:
                user_id_val = None
                if role == 'STUDENT':
                    user_id_val = row.get('student_id', '').strip() or f"TP-STU-{StudentProfile.objects.count() + 1:03d}"
                    password = user_id_val
                elif role == 'TEACHER':
                    user_id_val = row.get('teacher_id', '').strip() or f"TMS/TCH/{TeacherProfile.objects.count() + 1:04d}"
                    password = user_id_val
                else:
                    password = row.get('password', '').strip() or secrets.token_urlsafe(12)

                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                )

                if role == 'STUDENT':
                    StudentProfile.objects.update_or_create(user=user, defaults={'student_id': user_id_val, 'grade_level': row.get('grade_level', 'Primary 1')})
                elif role == 'TEACHER':
                    TeacherProfile.objects.update_or_create(user=user, defaults={'teacher_id': user_id_val})
                elif role == 'PARENT':
                    ParentProfile.objects.get_or_create(user=user)
                elif role == 'ADMIN':
                    AdminProfile.objects.get_or_create(user=user)

                created.append({'email': email, 'user_id': user_id_val, 'role': role})
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


class SystemSettingsView(APIView):
    """
    GET: Retrieve system and school configuration settings.
    PUT/PATCH: Update institutional system settings (Admin only).
    """
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'POST']:
            return [IsAdmin()]
        return [permissions.AllowAny()]

    def get(self, request):
        settings_obj = SystemSettings.get_settings()
        serializer = SystemSettingsSerializer(settings_obj)
        res_data = {
            **serializer.data,
            **(settings_obj.settings_data or {})
        }
        return Response(res_data, status=status.HTTP_200_OK)

    def put(self, request):
        return self.patch(request)

    def patch(self, request):
        settings_obj = SystemSettings.get_settings()
        data = request.data if isinstance(request.data, dict) else {}

        # Merge with existing settings_data
        existing_data = settings_obj.settings_data or {}
        merged_data = {**existing_data, **data}
        settings_obj.settings_data = merged_data

        # Update specific model fields if present
        field_map = {
            'enforce2FA': 'enforce_2fa',
            'enforce_2fa': 'enforce_2fa',
            'otpChannels': 'otp_channels',
            'otpExpiryMinutes': 'otp_expiry_minutes',
            'maxOtpAttempts': 'max_otp_attempts',
            'sendWelcomeEmailWithCredentials': 'send_welcome_email_with_credentials',
            'allowDirectStudentPinLogin': 'allow_direct_student_pin_login',
            'minPasswordLength': 'min_password_length',
            'requireSpecialChar': 'require_special_char',
            'requireNumber': 'require_number',
            'passwordExpiryMonths': 'password_expiry_months',
            'failedLoginLockoutAttempts': 'failed_login_lockout_attempts',
            'schoolName': 'school_name',
            'shortName': 'short_name',
            'motto': 'motto',
            'officialEmail': 'official_email',
            'phone': 'phone',
            'address': 'address',
            'ministryRegNo': 'ministry_reg_no',
            'proprietress': 'proprietress',
            'principal': 'principal',
            'vicePrincipal': 'vice_principal',
            'session': 'session',
            'term': 'term',
            'termStart': 'term_start',
            'termEnd': 'term_end',
            'minPassMark': 'min_pass_mark',
            'ca1Weight': 'ca1_weight',
            'ca2Weight': 'ca2_weight',
            'examWeight': 'exam_weight',
            'sessionTimeoutMinutes': 'session_timeout_minutes',
            'singleSessionPerUser': 'single_session_per_user',
            'smsProvider': 'sms_provider',
            'smsSenderId': 'sms_sender_id',
            'smsBalance': 'sms_balance',
            'notifyResultsSMS': 'notify_results_sms',
            'notifyAttendanceSMS': 'notify_attendance_sms',
            'notifyFeesSMS': 'notify_fees_sms',
            'notifyCBTExams': 'notify_cbt_exams',
            'lateFeePenalty': 'late_fee_penalty',
            'scholarshipSlots': 'scholarship_slots',
            'portalLanguage': 'portal_language',
            'colorScheme': 'color_scheme',
            'dateFormat': 'date_format',
            'currency': 'currency',
        }

        for key, field_name in field_map.items():
            if key in data:
                val = data[key]
                if hasattr(settings_obj, field_name):
                    setattr(settings_obj, field_name, val)

        settings_obj.save()
        serializer = SystemSettingsSerializer(settings_obj)
        return Response({
            **serializer.data,
            **(settings_obj.settings_data or {})
        }, status=status.HTTP_200_OK)

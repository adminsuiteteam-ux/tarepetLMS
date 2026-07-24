from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Assignment, Submission, Gradebook, Attendance, BehaviorLog, House
from .serializers import (
    AssignmentSerializer,
    SubmissionSerializer,
    GradebookSerializer,
    AttendanceSerializer,
    BehaviorLogSerializer,
    HouseSerializer,
)
from apps.users.permissions import IsTeacher, IsStudent, IsAdmin


class HouseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = House.objects.all().order_by('-points')
    serializer_class = HouseSerializer
    permission_classes = [permissions.IsAuthenticated]


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-due_date')
    serializer_class = AssignmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_student and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        elif user.is_parent and hasattr(user, 'parent_profile'):
            # Parents see their children's submissions
            queryset = queryset.filter(student__parents=user.parent_profile)

        assignment_id = self.request.query_params.get('assignment_id', None)
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'student_profile'):
            serializer.save(student=user.student_profile)
        else:
            serializer.save()

    @action(detail=True, methods=['put'], permission_classes=[IsTeacher])
    def grade(self, request, pk=None):
        submission = self.get_object()
        score = request.data.get('grade', None)
        feedback = request.data.get('feedback', '')

        if score is None:
            return Response({'detail': 'Grade score is required.'}, status=status.HTTP_400_BAD_REQUEST)

        submission.grade = float(score)
        submission.feedback = feedback
        submission.graded_at = timezone.now()
        submission.save()

        # Sync or create Gradebook entry
        Gradebook.objects.update_or_create(
            student=submission.student,
            course=submission.assignment.course,
            assignment=submission.assignment,
            defaults={
                'score': submission.grade,
                'feedback': submission.feedback,
                'category': 'Assignment',
            }
        )

        return Response(SubmissionSerializer(submission).data, status=status.HTTP_200_OK)


class GradebookViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gradebook.objects.all()
    serializer_class = GradebookSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_student and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        elif user.is_parent and hasattr(user, 'parent_profile'):
            queryset = queryset.filter(student__parents=user.parent_profile)

        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_mark']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_student and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        elif user.is_parent and hasattr(user, 'parent_profile'):
            queryset = queryset.filter(student__parents=user.parent_profile)

        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsTeacher])
    def bulk_mark(self, request):
        records = request.data.get('records', [])
        course_id = request.data.get('course_id')
        date_str = request.data.get('date', timezone.now().strftime('%Y-%m-%d'))

        if not course_id or not records:
            return Response({'detail': 'course_id and records list are required.'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        for rec in records:
            student_id = rec.get('student_id')
            status_val = rec.get('status', 'present')
            remarks = rec.get('remarks', '')

            Attendance.objects.update_or_create(
                student_id=student_id,
                course_id=course_id,
                date=date_str,
                defaults={'status': status_val, 'remarks': remarks}
            )
            created_count += 1

        return Response({'detail': f'Successfully updated {created_count} attendance records.'}, status=status.HTTP_200_OK)


class BehaviorLogViewSet(viewsets.ModelViewSet):
    queryset = BehaviorLog.objects.all().order_by('-date')
    serializer_class = BehaviorLogSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        teacher = getattr(user, 'teacher_profile', None)
        log = serializer.save(teacher=teacher)

        # Award House points if positive behavior
        if log.student and log.student.house and log.points:
            House.objects.filter(name=log.student.house).update(
                points=models.F('points') + log.points
            )

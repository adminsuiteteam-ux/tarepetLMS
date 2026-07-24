from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Course, Module, Lesson, Quiz, Question
from .serializers import (
    CourseSerializer,
    ModuleSerializer,
    LessonSerializer,
    QuizSerializer,
    QuestionSerializer,
)
from apps.users.permissions import IsTeacher, IsAdmin, IsStudent
from apps.users.models import StudentProfile


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().order_by('-start_date')
    serializer_class = CourseSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # Filter by active status for students
        if user.is_student:
            queryset = queryset.filter(is_active=True)
        elif user.is_teacher and hasattr(user, 'teacher_profile'):
            # Show courses taught by teacher or all courses if admin
            if not user.is_admin:
                queryset = queryset.filter(teacher=user.teacher_profile)

        grade_level = self.request.query_params.get('grade_level', None)
        if grade_level:
            queryset = queryset.filter(grade_level=grade_level)

        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def enroll(self, request, id=None):
        course = self.get_object()
        user = request.user

        if not hasattr(user, 'student_profile'):
            return Response(
                {'detail': 'Only students can enroll in courses.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_profile = user.student_profile
        if course.students.filter(id=student_profile.id).exists():
            return Response(
                {'detail': 'Student is already enrolled in this course.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if course.enrollment_count >= course.enrollment_limit:
            return Response(
                {'detail': 'Course enrollment limit reached.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        course.students.add(student_profile)
        return Response({'detail': 'Successfully enrolled in course.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unenroll(self, request, id=None):
        course = self.get_object()
        user = request.user

        if not hasattr(user, 'student_profile'):
            return Response(
                {'detail': 'Invalid operation.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student_profile = user.student_profile
        course.students.remove(student_profile)
        return Response({'detail': 'Successfully unenrolled from course.'}, status=status.HTTP_200_OK)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all().order_by('order')
    serializer_class = ModuleSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all().order_by('order')
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        module_id = self.request.query_params.get('module_id', None)
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset


class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by('order')
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacher]

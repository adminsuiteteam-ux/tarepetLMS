from rest_framework import serializers
from .models import Course, Module, Lesson, Quiz, Question
from apps.users.serializers import TeacherProfileSerializer, StudentProfileSerializer


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'options', 'correct_answer', 'points', 'order']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'time_limit', 'max_attempts', 'passing_score', 'shuffle_questions', 'questions']


class LessonSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer(read_only=True)

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'content_type', 'content_url', 'text_content', 'is_required', 'estimated_time', 'order', 'quiz']


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'is_published', 'release_date', 'lessons']


class CourseSerializer(serializers.ModelSerializer):
    teacher_detail = TeacherProfileSerializer(source='teacher', read_only=True)
    enrollment_count = serializers.IntegerField(read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'slug', 'code', 'description', 'teacher', 'teacher_detail',
            'grade_level', 'start_date', 'end_date', 'enrollment_limit', 'is_active',
            'thumbnail', 'enrollment_count', 'modules'
        ]
        read_only_fields = ['id', 'slug']

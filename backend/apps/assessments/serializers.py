from rest_framework import serializers
from .models import Assignment, Submission, Gradebook, Attendance, BehaviorLog, House
from apps.users.serializers import StudentProfileSerializer, TeacherProfileSerializer


class HouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = House
        fields = ['id', 'name', 'color', 'motto', 'points', 'head_of_house']


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'course', 'title', 'description', 'instructions', 'due_date', 'max_score', 'allowed_file_types']


class SubmissionSerializer(serializers.ModelSerializer):
    student_detail = StudentProfileSerializer(source='student', read_only=True)
    is_late = serializers.BooleanField(read_only=True)
    grade_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'assignment', 'student', 'student_detail', 'submitted_at',
            'file_url', 'text_answer', 'grade', 'feedback', 'graded_at',
            'is_late', 'grade_percentage'
        ]
        read_only_fields = ['id', 'submitted_at', 'graded_at']


class GradebookSerializer(serializers.ModelSerializer):
    student_detail = StudentProfileSerializer(source='student', read_only=True)

    class Meta:
        model = Gradebook
        fields = ['id', 'student', 'student_detail', 'course', 'assignment', 'category', 'score', 'weight', 'grade_letter', 'feedback']


class AttendanceSerializer(serializers.ModelSerializer):
    student_detail = StudentProfileSerializer(source='student', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_detail', 'course', 'date', 'status', 'remarks']


class BehaviorLogSerializer(serializers.ModelSerializer):
    student_detail = StudentProfileSerializer(source='student', read_only=True)
    teacher_detail = TeacherProfileSerializer(source='teacher', read_only=True)

    class Meta:
        model = BehaviorLog
        fields = ['id', 'student', 'student_detail', 'teacher', 'teacher_detail', 'date', 'category', 'description', 'points']

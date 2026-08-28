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


# CBT Serializers
from .models import CBTExam, CBTQuestion, CBTStudentAttempt, CBTStudentAnswer, CBTNotification
from apps.courses.serializers import CourseSerializer


class CBTQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CBTQuestion
        fields = ['id', 'exam', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'points', 'explanation', 'image_url', 'order']


class CBTQuestionStudentSerializer(serializers.ModelSerializer):
    """Question serializer for students taking exam — hides correct_option."""
    class Meta:
        model = CBTQuestion
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'points', 'image_url', 'order']


class CBTExamSerializer(serializers.ModelSerializer):
    course_detail = CourseSerializer(source='course', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)
    questions = CBTQuestionSerializer(many=True, required=False)

    class Meta:
        model = CBTExam
        fields = [
            'id', 'title', 'description', 'instructions', 'course', 'course_detail',
            'teacher', 'teacher_name', 'class_name', 'stream', 'assessment_type', 'term', 'duration_minutes',
            'questions_per_page', 'status', 'results_released', 'rejection_reason', 'approved_by',
            'questions_count', 'questions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'teacher', 'approved_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        exam = CBTExam.objects.create(**validated_data)
        for idx, q_data in enumerate(questions_data, start=1):
            q_data['order'] = q_data.get('order', idx)
            CBTQuestion.objects.create(exam=exam, **q_data)
        return exam

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if questions_data is not None:
            instance.questions.all().delete()
            for idx, q_data in enumerate(questions_data, start=1):
                q_data['order'] = q_data.get('order', idx)
                CBTQuestion.objects.create(exam=instance, **q_data)
        return instance


class CBTStudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CBTStudentAnswer
        fields = ['id', 'attempt', 'question', 'selected_option', 'is_correct', 'points_awarded']


class CBTStudentAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model = CBTStudentAttempt
        fields = [
            'id', 'exam', 'exam_title', 'student', 'student_name', 'started_at',
            'submitted_at', 'is_submitted', 'auto_submitted', 'score',
            'total_possible', 'percentage', 'gradebook_synced'
        ]
        read_only_fields = ['id', 'started_at', 'submitted_at', 'score', 'total_possible', 'percentage']


class CBTNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CBTNotification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'exam', 'is_read', 'created_at']


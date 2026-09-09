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


def is_privileged_cbt_user(user):
    """Check if the user is authorized to view exam answer keys (teachers, admins, staff)."""
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    return bool(
        getattr(user, 'is_admin', False) or
        getattr(user, 'is_teacher', False) or
        getattr(user, 'role', '') in ('ADMIN', 'TEACHER') or
        getattr(user, 'is_staff', False) or
        getattr(user, 'is_superuser', False)
    )


class CBTQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CBTQuestion
        fields = ['id', 'exam', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'points', 'explanation', 'image_url', 'order']
        extra_kwargs = {
            'exam': {'required': False, 'allow_null': True}
        }

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not is_privileged_cbt_user(user):
            ret.pop('correct_option', None)
            ret.pop('explanation', None)
        return ret


class CBTQuestionStudentSerializer(serializers.ModelSerializer):
    """Question serializer for students taking exam — hides correct_option."""
    class Meta:
        model = CBTQuestion
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'points', 'image_url', 'order']


class CBTExamSerializer(serializers.ModelSerializer):
    course_detail = CourseSerializer(source='course', read_only=True)
    teacher_name = serializers.CharField(required=False, allow_blank=True, default='Assigned Educator')
    course_name = serializers.CharField(required=False, allow_blank=True, default='General Assessment')
    course_code = serializers.CharField(required=False, allow_blank=True, default='GEN-101')
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)
    questions = CBTQuestionSerializer(many=True, required=False)

    class Meta:
        model = CBTExam
        fields = [
            'id', 'title', 'description', 'instructions', 'course', 'course_detail',
            'course_name', 'course_code',
            'teacher', 'teacher_name', 'class_name', 'stream', 'assessment_type', 'term', 'duration_minutes',
            'questions_per_page', 'status', 'results_released', 'rejection_reason', 'approved_by',
            'questions_count', 'questions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'teacher', 'approved_by', 'created_at', 'updated_at']
        extra_kwargs = {
            'course': {'required': False, 'allow_null': True},
        }

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        else:
            data = dict(data)

        # Normalize term
        if 'term' in data and data['term']:
            val = str(data['term']).upper().strip()
            if '1' in val:
                data['term'] = '1ST_TERM'
            elif '2' in val:
                data['term'] = '2ND_TERM'
            elif '3' in val:
                data['term'] = '3RD_TERM'

        # Normalize assessment_type
        if 'assessment_type' in data and data['assessment_type']:
            val = str(data['assessment_type']).upper().strip()
            if 'EXAM' in val:
                data['assessment_type'] = 'EXAM'
            else:
                data['assessment_type'] = 'TEST'

        # Normalize status
        if 'status' in data and data['status']:
            val = str(data['status']).upper().strip()
            if 'PEND' in val:
                data['status'] = 'PENDING'
            elif 'APPROV' in val:
                data['status'] = 'APPROVED'
            elif 'REJECT' in val:
                data['status'] = 'REJECTED'
            elif 'ACTIV' in val:
                data['status'] = 'ACTIVE'
            elif 'DRAFT' in val:
                data['status'] = 'DRAFT'
            elif 'COMPLET' in val:
                data['status'] = 'COMPLETED'

        return super().to_internal_value(data)

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

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not is_privileged_cbt_user(user):
            if 'questions' in ret and isinstance(ret['questions'], list):
                for q in ret['questions']:
                    if isinstance(q, dict):
                        q.pop('correct_option', None)
                        q.pop('explanation', None)
        return ret


class CBTStudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CBTStudentAnswer
        fields = ['id', 'attempt', 'question', 'selected_option', 'is_correct', 'points_awarded']


class CBTStudentAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_email = serializers.CharField(source='student.user.email', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    course_code = serializers.CharField(source='exam.course_code', read_only=True)
    course_name = serializers.CharField(source='exam.course_name', read_only=True)
    class_name = serializers.CharField(source='exam.class_name', read_only=True)
    stream = serializers.CharField(source='exam.stream', read_only=True)

    class Meta:
        model = CBTStudentAttempt
        fields = [
            'id', 'exam', 'exam_title', 'course_code', 'course_name',
            'class_name', 'stream', 'student', 'student_id', 'student_email',
            'student_name', 'started_at', 'submitted_at', 'is_submitted',
            'auto_submitted', 'score', 'total_possible', 'percentage',
            'gradebook_synced'
        ]
        read_only_fields = ['id', 'started_at', 'submitted_at', 'score', 'total_possible', 'percentage']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not is_privileged_cbt_user(user):
            exam = getattr(instance, 'exam', None)
            if exam and not getattr(exam, 'results_released', False):
                ret['score'] = None
                ret['percentage'] = None
        return ret


class CBTNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CBTNotification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'exam', 'is_read', 'created_at']


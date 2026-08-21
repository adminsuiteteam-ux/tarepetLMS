from rest_framework import serializers
from .models import BroadsheetScore, PromotionRecord, ClassAttendanceRecord


class BroadsheetScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = BroadsheetScore
        fields = [
            'id', 'student_identifier', 'course_code', 'course_name',
            'ca1', 'ca2', 'cbt_score', 'exam', 'total', 'grade',
            'teacher_remark', 'term', 'session', 'updated_at'
        ]


class PromotionRecordSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source='student_code', required=False)
    studentName = serializers.CharField(source='student_name', required=False)
    studentCode = serializers.CharField(source='student_code', required=False)
    fromClass = serializers.CharField(source='from_class', required=False)
    toClass = serializers.CharField(source='to_class', required=False)
    academicSession = serializers.CharField(source='academic_session', required=False)
    promotedBy = serializers.CharField(source='promoted_by', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = PromotionRecord
        fields = [
            'id', 'studentId', 'studentName', 'studentCode',
            'fromClass', 'toClass', 'academicSession', 'term',
            'promotedBy', 'date', 'created_at'
        ]


class ClassAttendanceRecordSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source='student_identifier', required=False)
    studentName = serializers.CharField(source='student_name', required=False)
    className = serializers.CharField(source='class_name', required=False)
    examId = serializers.IntegerField(source='exam_id', required=False, allow_null=True)
    markedBy = serializers.CharField(source='marked_by', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = ClassAttendanceRecord
        fields = [
            'id', 'studentId', 'studentName', 'className',
            'stream', 'examId', 'status', 'date', 'markedBy', 'created_at'
        ]

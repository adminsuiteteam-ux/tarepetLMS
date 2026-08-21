from django.contrib import admin
from .models import BroadsheetScore, PromotionRecord, ClassAttendanceRecord

@admin.register(BroadsheetScore)
class BroadsheetScoreAdmin(admin.ModelAdmin):
    list_display = ('student_identifier', 'course_code', 'ca1', 'ca2', 'cbt_score', 'exam', 'total', 'grade', 'term', 'session')
    search_fields = ('student_identifier', 'course_code', 'course_name')
    list_filter = ('term', 'session', 'course_code')

@admin.register(PromotionRecord)
class PromotionRecordAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'student_code', 'from_class', 'to_class', 'academic_session', 'term', 'promoted_by', 'date')
    search_fields = ('student_name', 'student_code', 'from_class', 'to_class')
    list_filter = ('academic_session', 'from_class', 'to_class')

@admin.register(ClassAttendanceRecord)
class ClassAttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('student_name', 'class_name', 'status', 'date', 'marked_by')
    search_fields = ('student_name', 'student_identifier', 'class_name')
    list_filter = ('class_name', 'status', 'date')

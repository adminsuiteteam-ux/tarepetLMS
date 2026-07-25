from django.contrib import admin
from .models import Assignment, Submission, Gradebook, Attendance, BehaviorLog, House

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'points', 'head_of_house')
    ordering = ('-points',)

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'due_date', 'max_score')
    list_filter = ('course', 'due_date')
    search_fields = ('title', 'description')

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'student', 'submitted_at', 'grade', 'is_late')
    list_filter = ('submitted_at', 'assignment__course')

admin.site.register(Gradebook)
admin.site.register(Attendance)
admin.site.register(BehaviorLog)


# CBT Admin Registration
from .models import CBTExam, CBTQuestion, CBTStudentAttempt, CBTStudentAnswer, CBTNotification


class CBTQuestionInline(admin.TabularInline):
    model = CBTQuestion
    extra = 0


@admin.register(CBTExam)
class CBTExamAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'teacher', 'assessment_type', 'term', 'status', 'duration_minutes', 'created_at')
    list_filter = ('status', 'assessment_type', 'term')
    search_fields = ('title',)
    inlines = [CBTQuestionInline]


@admin.register(CBTStudentAttempt)
class CBTStudentAttemptAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'score', 'total_possible', 'percentage', 'is_submitted', 'auto_submitted')
    list_filter = ('is_submitted', 'auto_submitted')


admin.site.register(CBTQuestion)
admin.site.register(CBTStudentAnswer)
admin.site.register(CBTNotification)


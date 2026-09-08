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
    fields = ('order', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'points')


@admin.register(CBTExam)
class CBTExamAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'class_name',
        'stream',
        'course_name',
        'assessment_type',
        'term',
        'status',
        'questions_count',
        'teacher_name',
        'created_at'
    )
    list_filter = ('class_name', 'stream', 'status', 'assessment_type', 'term')
    search_fields = ('title', 'course_name', 'course_code', 'teacher_name')
    ordering = ('class_name', 'stream', '-created_at')
    inlines = [CBTQuestionInline]

    def questions_count(self, obj):
        return obj.questions.count()
    questions_count.short_description = 'Questions'


@admin.register(CBTQuestion)
class CBTQuestionAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'exam_title',
        'exam_class',
        'exam_stream',
        'order',
        'question_preview',
        'correct_option',
        'points'
    )
    list_filter = ('exam__class_name', 'exam__stream', 'exam__status', 'correct_option')
    search_fields = ('question_text', 'exam__title', 'exam__course_name')
    ordering = ('exam__class_name', 'exam__stream', 'exam__title', 'order')

    def exam_title(self, obj):
        return obj.exam.title
    exam_title.short_description = 'Exam Paper'

    def exam_class(self, obj):
        return obj.exam.class_name
    exam_class.short_description = 'Class'

    def exam_stream(self, obj):
        return obj.exam.stream
    exam_stream.short_description = 'Stream'

    def question_preview(self, obj):
        return (obj.question_text[:75] + '...') if len(obj.question_text) > 75 else obj.question_text
    question_preview.short_description = 'Question Text'


@admin.register(CBTStudentAttempt)
class CBTStudentAttemptAdmin(admin.ModelAdmin):
    list_display = ('exam', 'student', 'score', 'total_possible', 'percentage', 'is_submitted', 'auto_submitted')
    list_filter = ('is_submitted', 'auto_submitted')


admin.site.register(CBTStudentAnswer)
admin.site.register(CBTNotification)



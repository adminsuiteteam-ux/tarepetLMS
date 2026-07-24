from django.contrib import admin
from .models import Course, Module, Lesson, Quiz, Question

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'teacher', 'grade_level', 'enrollment_limit', 'is_active', 'start_date')
    list_filter = ('grade_level', 'is_active', 'start_date')
    search_fields = ('title', 'code', 'description')
    prepopulated_fields = {'slug': ('code', 'title')}

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('course', 'title', 'order', 'is_published', 'release_date')
    list_filter = ('is_published', 'course')
    search_fields = ('title', 'description')

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('module', 'title', 'content_type', 'order', 'estimated_time', 'is_required')
    list_filter = ('content_type', 'is_required')
    search_fields = ('title', 'text_content')

admin.site.register(Quiz)
admin.site.register(Question)

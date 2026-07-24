from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from apps.users.models import TeacherProfile, StudentProfile


class Course(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.SET_NULL, null=True, related_name='courses'
    )
    students = models.ManyToManyField(
        StudentProfile, related_name='enrolled_courses', blank=True
    )
    grade_level = models.CharField(max_length=50, default='Primary 1')
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    enrollment_limit = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    thumbnail = models.URLField(blank=True, null=True)

    class Meta:
        ordering = ['-start_date', 'title']

    def __str__(self):
        return f"[{self.code}] {self.title}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.code}-{self.title}")
        super().save(*args, **kwargs)

    @property
    def enrollment_count(self):
        return self.students.count()


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    release_date = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.course.code} - Mod {self.order}: {self.title}"


class Lesson(models.Model):
    class ContentType(models.TextChoices):
        VIDEO = 'video', _('Video')
        PDF = 'pdf', _('PDF Document')
        AUDIO = 'audio', _('Audio')
        EXTERNAL_LINK = 'external_link', _('External Link')
        QUIZ = 'quiz', _('Quiz')

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    content_type = models.CharField(
        max_length=20, choices=ContentType.choices, default=ContentType.VIDEO
    )
    content_url = models.URLField(blank=True, null=True)
    text_content = models.TextField(blank=True, null=True)
    is_required = models.BooleanField(default=True)
    estimated_time = models.PositiveIntegerField(help_text=_('Estimated time in minutes'), default=15)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Lesson {self.order}: {self.title} ({self.get_content_type_display()})"


class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    time_limit = models.PositiveIntegerField(help_text=_('Time limit in minutes (0 for no limit)'), default=30)
    max_attempts = models.PositiveIntegerField(default=3)
    passing_score = models.FloatField(default=70.0, help_text=_('Passing score percentage'))
    shuffle_questions = models.BooleanField(default=True)

    def __str__(self):
        return f"Quiz: {self.title}"


class Question(models.Model):
    class QuestionType(models.TextChoices):
        MULTIPLE_CHOICE = 'multiple_choice', _('Multiple Choice')
        TRUE_FALSE = 'true_false', _('True/False')
        ESSAY = 'essay', _('Essay')

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20, choices=QuestionType.choices, default=QuestionType.MULTIPLE_CHOICE
    )
    options = models.JSONField(default=list, blank=True, help_text=_('List of option strings or key-value choices'))
    correct_answer = models.CharField(max_length=255, help_text=_('Correct option or exact answer key'))
    points = models.FloatField(default=10.0)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Question ({self.get_question_type_display()}): {self.question_text[:50]}"

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.courses.models import Course
from apps.users.models import StudentProfile, TeacherProfile


class House(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=30, default='Red')
    motto = models.CharField(max_length=255, blank=True, null=True)
    points = models.IntegerField(default=0)
    head_of_house = models.ForeignKey(
        TeacherProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_house'
    )

    def __str__(self):
        return f"{self.name} ({self.points} pts)"


class Assignment(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField()
    max_score = models.FloatField(default=100.0)
    allowed_file_types = models.CharField(
        max_length=100, default='pdf,doc,docx,zip,png,jpg', help_text=_('Comma separated extensions')
    )

    class Meta:
        ordering = ['-due_date', 'title']

    def __str__(self):
        return f"[{self.course.code}] {self.title} (Due: {self.due_date.strftime('%Y-%m-%d')})"


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='submissions')
    submitted_at = models.DateTimeField(auto_now_add=True)
    file_url = models.URLField(blank=True, null=True)
    text_answer = models.TextField(blank=True, null=True)
    grade = models.FloatField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    graded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('assignment', 'student')
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Submission: {self.student.user.get_full_name()} for {self.assignment.title}"

    @property
    def is_late(self):
        return self.submitted_at > self.assignment.due_date

    @property
    def grade_percentage(self):
        if self.grade is not None and self.assignment.max_score > 0:
            return round((self.grade / self.assignment.max_score) * 100, 2)
        return None


class Gradebook(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='grades')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grades')
    assignment = models.ForeignKey(Assignment, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.CharField(max_length=50, default='Homework') # Homework 20%, Projects 30%, Exams 40%, Participation 10%
    score = models.FloatField(default=0.0)
    weight = models.FloatField(default=1.0)
    grade_letter = models.CharField(max_length=5, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.course.code}: {self.score} ({self.category})"


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'present', _('Present')
        ABSENT = 'absent', _('Absent')
        LATE = 'late', _('Late')
        EXCUSED = 'excused', _('Excused')

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='attendance_records')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    remarks = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('student', 'course', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.date}: {self.get_status_display()}"


class BehaviorLog(models.Model):
    class Category(models.TextChoices):
        POSITIVE = 'positive', _('Positive Behavior')
        NEGATIVE = 'negative', _('Negative Behavior')
        NEEDS_IMPROVEMENT = 'needs_improvement', _('Needs Improvement')

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='behavior_logs')
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.SET_NULL, null=True, related_name='behavior_logs')
    date = models.DateField(auto_now_add=True)
    category = models.CharField(max_length=25, choices=Category.choices, default=Category.POSITIVE)
    description = models.TextField()
    points = models.IntegerField(default=5)

    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.get_category_display()} ({self.points} pts)"

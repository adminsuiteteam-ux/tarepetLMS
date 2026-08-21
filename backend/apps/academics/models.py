from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.users.models import StudentProfile, CustomUser


class BroadsheetScore(models.Model):
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name='broadsheet_scores', null=True, blank=True
    )
    student_identifier = models.CharField(max_length=100, db_index=True)
    course_code = models.CharField(max_length=50, db_index=True)
    course_name = models.CharField(max_length=150, blank=True, null=True)
    ca1 = models.FloatField(default=0.0)
    ca2 = models.FloatField(default=0.0)
    cbt_score = models.FloatField(default=0.0)
    exam = models.FloatField(default=0.0)
    total = models.FloatField(default=0.0)
    grade = models.CharField(max_length=10, blank=True, null=True)
    teacher_remark = models.CharField(max_length=255, blank=True, null=True)
    term = models.CharField(max_length=20, default='1ST_TERM')
    session = models.CharField(max_length=20, default='2026/2027')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student_identifier', 'course_code', 'term', 'session')
        ordering = ['course_code']

    def save(self, *args, **kwargs):
        self.total = round((self.ca1 or 0) + (self.ca2 or 0) + (self.cbt_score or 0) + (self.exam or 0), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student_identifier} - {self.course_code}: {self.total} ({self.grade or 'N/A'})"


class PromotionRecord(models.Model):
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name='promotion_records', null=True, blank=True
    )
    student_name = models.CharField(max_length=255)
    student_code = models.CharField(max_length=100, db_index=True)
    from_class = models.CharField(max_length=50)
    to_class = models.CharField(max_length=50)
    academic_session = models.CharField(max_length=50, default='2026/2027')
    term = models.CharField(max_length=50, default='3rd Term')
    promoted_by = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student_name} ({self.student_code}): {self.from_class} -> {self.to_class} ({self.academic_session})"


class ClassAttendanceRecord(models.Model):
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, related_name='class_attendance_records', null=True, blank=True
    )
    student_name = models.CharField(max_length=255)
    student_identifier = models.CharField(max_length=100, db_index=True)
    class_name = models.CharField(max_length=50)
    stream = models.CharField(max_length=50, blank=True, null=True)
    exam_id = models.IntegerField(null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, default='PRESENT') # PRESENT, ABSENT, LATE
    date = models.DateField(auto_now_add=True)
    marked_by = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.student_name} ({self.class_name}) - {self.status} on {self.date}"

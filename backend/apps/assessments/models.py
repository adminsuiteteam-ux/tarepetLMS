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


# ==========================================
# CBT (Computer Based Testing) System Models
# ==========================================

class CBTExam(models.Model):
    class AssessmentType(models.TextChoices):
        TEST = 'TEST', _('Continuous Assessment Test')
        EXAM = 'EXAM', _('Term Final Examination')

    class Term(models.TextChoices):
        FIRST_TERM = '1ST_TERM', _('1st Term')
        SECOND_TERM = '2ND_TERM', _('2nd Term')
        THIRD_TERM = '3RD_TERM', _('3rd Term')

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        PENDING_APPROVAL = 'PENDING', _('Pending Admin Approval')
        APPROVED = 'APPROVED', _('Approved by Admin')
        PUBLISHED = 'PUBLISHED', _('Published to Class')
        REJECTED = 'REJECTED', _('Rejected by Admin')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    instructions = models.TextField(blank=True, null=True, help_text=_('Instructions for students before starting exam'))
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='cbt_exams')
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name='created_cbt_exams')
    assessment_type = models.CharField(max_length=10, choices=AssessmentType.choices, default=AssessmentType.TEST)
    term = models.CharField(max_length=10, choices=Term.choices, default=Term.FIRST_TERM)
    duration_minutes = models.PositiveIntegerField(default=30, help_text=_('Duration in minutes'))
    questions_per_page = models.PositiveIntegerField(default=1, help_text=_('Number of questions displayed per screen view'))
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    rejection_reason = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_exams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_assessment_type_display()}] {self.title} ({self.get_term_display()}) - {self.get_status_display()}"


class CBTQuestion(models.Model):
    class CorrectOption(models.TextChoices):
        OPTION_A = 'A', _('Option A')
        OPTION_B = 'B', _('Option B')
        OPTION_C = 'C', _('Option C')
        OPTION_D = 'D', _('Option D')

    exam = models.ForeignKey(CBTExam, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_option = models.CharField(max_length=1, choices=CorrectOption.choices, default=CorrectOption.OPTION_A)
    points = models.FloatField(default=1.0)
    order = models.IntegerField(default=1)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Question {self.order} for {self.exam.title}"


class CBTStudentAttempt(models.Model):
    exam = models.ForeignKey(CBTExam, on_delete=models.CASCADE, related_name='student_attempts')
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='cbt_attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    is_submitted = models.BooleanField(default=False)
    auto_submitted = models.BooleanField(default=False, help_text=_('True if timer expired before manual submission'))
    score = models.FloatField(default=0.0)
    total_possible = models.FloatField(default=0.0)
    percentage = models.FloatField(default=0.0)
    gradebook_synced = models.BooleanField(default=False)

    class Meta:
        unique_together = ('exam', 'student')
        ordering = ['-started_at']

    def __str__(self):
        return f"Attempt: {self.student.user.get_full_name()} on {self.exam.title} ({'Submitted' if self.is_submitted else 'In Progress'})"


class CBTStudentAnswer(models.Model):
    attempt = models.ForeignKey(CBTStudentAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(CBTQuestion, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=1, choices=CBTQuestion.CorrectOption.choices, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    points_awarded = models.FloatField(default=0.0)

    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Answer for Q{self.question.order}: {self.selected_option} ({'Correct' if self.is_correct else 'Wrong'})"


class CBTNotification(models.Model):
    class NotificationType(models.TextChoices):
        PENDING_APPROVAL = 'PENDING_APPROVAL', _('Exam Submitted for Approval')
        APPROVED = 'APPROVED', _('Exam Approved')
        REJECTED = 'REJECTED', _('Exam Rejected')
        EXAM_SUBMITTED = 'EXAM_SUBMITTED', _('Student Completed Exam')

    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='cbt_notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    exam = models.ForeignKey(CBTExam, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_notification_type_display()}] For {self.user.email}: {self.title}"


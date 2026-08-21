from django.db import models
from apps.users.models import CustomUser


class Announcement(models.Model):
    title = models.CharField(max_length=255)
    target_role = models.CharField(max_length=50, default='ALL') # ALL, TEACHER, STUDENT, PARENT
    priority = models.CharField(max_length=50, default='NORMAL') # NORMAL, HIGH, URGENT
    category = models.CharField(max_length=100, default='Academic')
    content = models.TextField()
    send_sms = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority}] {self.title} ({self.target_role})"


class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject} ({self.created_at.strftime('%Y-%m-%d')})"


class ActivityLog(models.Model):
    activity_type = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    detail = models.TextField(blank=True, default='')
    user = models.CharField(max_length=255, blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.activity_type}] {self.title} - {self.user}"


class Notification(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='info')
    recipient_role = models.CharField(max_length=50, default='ALL')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.recipient_role}] {self.title} ({'Read' if self.is_read else 'Unread'})"


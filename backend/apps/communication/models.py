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
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    severity = models.CharField(max_length=20, default='INFO')  # INFO, WARNING, ERROR, CRITICAL
    category = models.CharField(max_length=50, default='SYSTEM')  # AUTH, ACADEMICS, FINANCE, CBT, SECURITY, SYSTEM
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.severity}] [{self.activity_type}] {self.title} - {self.user}"


class CookieConsent(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='cookie_consents'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    consent_status = models.CharField(max_length=50, default='ALL')  # ALL, ESSENTIAL, CUSTOM, DECLINED
    necessary = models.BooleanField(default=True)
    analytics = models.BooleanField(default=True)
    functional = models.BooleanField(default=True)
    security = models.BooleanField(default=True)
    disclaimer_acknowledged = models.BooleanField(default=True)
    session_id = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"CookieConsent: {self.consent_status} from {self.ip_address or 'Unknown'} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class SystemAlert(models.Model):
    ALERT_TYPES = (
        ('BROKEN_CODE', 'Broken Code / Runtime Error'),
        ('BACKEND_ERROR', 'Backend Server Error (500)'),
        ('UNRESPONSIVE_UI', 'Unresponsive / Frozen UI'),
        ('DATABASE_USAGE', 'Database Spikes / Latency'),
        ('SECURITY_BREACH', 'Security Breach / Suspicious Attempt'),
        ('NETWORK_FAILURE', 'Network Degradation / Offline Drop'),
    )

    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    title = models.CharField(max_length=255)
    details = models.TextField()
    url = models.CharField(max_length=500, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    severity = models.CharField(max_length=20, default='HIGH')  # LOW, MEDIUM, HIGH, CRITICAL
    email_dispatched = models.BooleanField(default=False)
    recipient = models.EmailField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.severity}] {self.get_alert_type_display()} - {self.title}"


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



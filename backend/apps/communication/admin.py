from django.contrib import admin
from .models import Announcement, ContactMessage, ActivityLog, CookieConsent, SystemAlert, Notification

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'target_role', 'priority', 'category', 'send_sms', 'created_by', 'created_at')
    search_fields = ('title', 'content', 'category')
    list_filter = ('target_role', 'priority', 'category', 'created_at')

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'is_read', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    list_filter = ('is_read', 'created_at')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'activity_type', 'user', 'severity', 'category', 'ip_address', 'timestamp')
    search_fields = ('title', 'detail', 'user', 'activity_type', 'ip_address')
    list_filter = ('severity', 'category', 'activity_type', 'timestamp')

@admin.register(CookieConsent)
class CookieConsentAdmin(admin.ModelAdmin):
    list_display = ('consent_status', 'user', 'ip_address', 'necessary', 'analytics', 'functional', 'security', 'created_at')
    search_fields = ('consent_status', 'ip_address', 'user__email')
    list_filter = ('consent_status', 'necessary', 'analytics', 'functional', 'security', 'created_at')

@admin.register(SystemAlert)
class SystemAlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'alert_type', 'severity', 'email_dispatched', 'recipient', 'ip_address', 'created_at')
    search_fields = ('title', 'details', 'url', 'ip_address')
    list_filter = ('alert_type', 'severity', 'email_dispatched', 'created_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'recipient_role', 'is_read', 'created_at')
    search_fields = ('title', 'message')
    list_filter = ('notification_type', 'recipient_role', 'is_read', 'created_at')

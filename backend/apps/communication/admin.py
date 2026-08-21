from django.contrib import admin
from .models import Announcement, ContactMessage

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

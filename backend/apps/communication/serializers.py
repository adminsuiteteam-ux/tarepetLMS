from rest_framework import serializers
from .models import Announcement, ContactMessage, ActivityLog, Notification, CookieConsent, SystemAlert


class AnnouncementSerializer(serializers.ModelSerializer):
    target = serializers.CharField(source='target_role', required=False)
    sendSMS = serializers.BooleanField(source='send_sms', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    author = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'target', 'target_role', 'priority',
            'category', 'content', 'sendSMS', 'send_sms',
            'author', 'createdAt', 'created_at'
        ]

    def get_author(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return 'School Administration'

    def create(self, validated_data):
        if 'target_role' not in validated_data and 'target' in self.initial_data:
            validated_data['target_role'] = self.initial_data['target']
        if 'send_sms' not in validated_data and 'sendSMS' in self.initial_data:
            validated_data['send_sms'] = self.initial_data['sendSMS']
        return super().create(validated_data)


class ContactMessageSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'is_read', 'createdAt', 'created_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='activity_type', required=False)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'type', 'activity_type', 'title', 'detail',
            'user', 'ip_address', 'user_agent', 'severity', 'category', 'timestamp'
        ]

    def create(self, validated_data):
        if 'activity_type' not in validated_data and 'type' in self.initial_data:
            validated_data['activity_type'] = self.initial_data['type']
        return super().create(validated_data)


class CookieConsentSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = CookieConsent
        fields = [
            'id', 'user', 'user_email', 'ip_address', 'user_agent',
            'consent_status', 'necessary', 'analytics', 'functional', 'security',
            'disclaimer_acknowledged', 'session_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_email(self, obj):
        if obj.user:
            return obj.user.email
        return None


class SystemAlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)

    class Meta:
        model = SystemAlert
        fields = [
            'id', 'alert_type', 'alert_type_display', 'title', 'details',
            'url', 'ip_address', 'user_agent', 'severity',
            'email_dispatched', 'recipient', 'created_at'
        ]
        read_only_fields = ['id', 'email_dispatched', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='notification_type', required=False)
    role = serializers.CharField(source='recipient_role', required=False)
    read = serializers.BooleanField(source='is_read', required=False)
    time = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'notification_type',
            'role', 'recipient_role', 'read', 'is_read', 'time', 'created_at'
        ]

    def create(self, validated_data):
        if 'notification_type' not in validated_data and 'type' in self.initial_data:
            validated_data['notification_type'] = self.initial_data['type']
        if 'recipient_role' not in validated_data and 'role' in self.initial_data:
            validated_data['recipient_role'] = self.initial_data['role']
        if 'is_read' not in validated_data and 'read' in self.initial_data:
            validated_data['is_read'] = self.initial_data['read']
        return super().create(validated_data)



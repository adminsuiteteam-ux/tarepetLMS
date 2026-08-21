from rest_framework import serializers
from .models import Announcement, ContactMessage


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

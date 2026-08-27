from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Announcement, ContactMessage, ActivityLog, Notification
from .serializers import (
    AnnouncementSerializer, ContactMessageSerializer,
    ActivityLogSerializer, NotificationSerializer
)


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    def get_queryset(self):
        user = self.request.user
        role_param = self.request.query_params.get('role')
        if role_param:
            return Announcement.objects.filter(target_role__in=['ALL', role_param.upper()])
        if user.is_authenticated:
            if user.is_admin:
                return Announcement.objects.all()
            return Announcement.objects.filter(target_role__in=['ALL', user.role])
        return Announcement.objects.filter(target_role='ALL')


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class ActivityLogViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return ActivityLog.objects.all().order_by('-timestamp')[:100]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        role = self.request.query_params.get('role')
        if role:
            return Notification.objects.filter(recipient_role__in=['ALL', role.upper()])
        return Notification.objects.all()

    @action(detail=True, methods=['post'], url_path='mark_read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'marked as read', 'id': notif.id}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='mark_all_read')
    def mark_all_read(self, request):
        role = request.data.get('role', request.query_params.get('role'))
        qs = Notification.objects.all()
        if role:
            qs = qs.filter(recipient_role__in=['ALL', role.upper()])
        qs.update(is_read=True)
        return Response({'status': 'all marked as read'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete', 'post'], url_path='clear-all')
    def clear_all(self, request):
        role = request.data.get('role', request.query_params.get('role'))
        qs = Notification.objects.all()
        if role:
            qs = qs.filter(recipient_role=role.upper())
        qs.delete()
        return Response({'status': 'all notifications cleared'}, status=status.HTTP_200_OK)


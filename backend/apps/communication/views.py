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


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only view of system activity logs for authenticated users."""
    queryset = ActivityLog.objects.all().order_by('-timestamp')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ActivityLog.objects.all().order_by('-timestamp')
        if not (getattr(user, 'is_admin', False) or getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser):
            # Non-admins only see their own activities or general system events
            qs = qs.filter(user__icontains=user.email)
        return qs


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'clear_all']:
            from apps.users.permissions import IsAdmin
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Notification.objects.all().order_by('-created_at')
        if getattr(user, 'is_admin', False) or getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser:
            return qs

        user_role = getattr(user, 'role', 'ALL')
        return qs.filter(recipient_role__in=['ALL', user_role])

    @action(detail=True, methods=['post'], url_path='mark_read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'marked as read', 'id': notif.id}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='mark_all_read')
    def mark_all_read(self, request):
        user = request.user
        user_role = getattr(user, 'role', 'ALL')
        qs = Notification.objects.filter(recipient_role__in=['ALL', user_role])
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


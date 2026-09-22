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


from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
import time

_recent_error_hashes = {}

class TelemetryErrorAlertView(APIView):
    """
    Automated real-time client error reporting endpoint.
    Catches JavaScript runtime errors, broken components, or unhandled exceptions
    and immediately emails the school admin so defects are addressed before users report them.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        error_msg = str(data.get('message', 'Unknown Client Error'))[:1000]
        stack = str(data.get('stack', 'No stack trace provided'))[:3000]
        url = str(data.get('url', request.META.get('HTTP_REFERER', 'Unknown URL')))[:300]
        user_info = str(data.get('user', 'Guest / Unauthenticated'))[:200]
        device = str(data.get('device', request.META.get('HTTP_USER_AGENT', 'Unknown Device')))[:300]

        # Rate-limit duplicate errors to avoid spamming the admin inbox (1 per identical error every 10 min)
        err_hash = f"{error_msg[:120]}_{url[:80]}"
        now = time.time()
        last_sent = _recent_error_hashes.get(err_hash, 0)
        if now - last_sent < 600:
            return Response({'status': 'throttled', 'detail': 'Error alerted recently.'}, status=status.HTTP_200_OK)
        _recent_error_hashes[err_hash] = now

        subject = f"🚨 [Tarepet Live Alert] Code Error on {url}"
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; padding: 20px 24px;">
                <h2 style="margin: 0; font-size: 19px;">🚨 Tarepet LMS: Live Runtime Error Detected</h2>
                <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">An automated error occurred in the browser before users reported it.</p>
            </div>
            <div style="padding: 24px; background: #ffffff; color: #1e293b; font-size: 14px; line-height: 1.6;">
                <p><strong>Error Message:</strong><br><span style="color: #dc2626; font-family: monospace; font-size: 13px; background: #fef2f2; padding: 4px 8px; border-radius: 6px; display: inline-block;">{error_msg}</span></p>
                <p><strong>Page URL:</strong> <a href="{url}" style="color: #2563eb; text-decoration: underline;">{url}</a></p>
                <p><strong>Affected User:</strong> {user_info}</p>
                <p><strong>Device / Browser:</strong> {device}</p>
                <div style="margin-top: 16px;">
                    <strong>Stack Trace:</strong>
                    <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; overflow-x: auto; color: #475569; max-height: 250px;">{stack}</pre>
                </div>
            </div>
            <div style="background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 14px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                Tarepet Montessori School Telemetry Alert Service • Automated system email
            </div>
        </div>
        """
        try:
            admin_email = getattr(settings, 'EMAIL_HOST_USER', 'tarepetm@gmail.com') or 'tarepetm@gmail.com'
            send_mail(
                subject=subject,
                message=f"Tarepet Error Alert on {url}\n\nError: {error_msg}\nUser: {user_info}\nDevice: {device}\n\nStack:\n{stack}",
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', admin_email),
                recipient_list=[admin_email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({'status': 'alert_dispatched'}, status=status.HTTP_200_OK)


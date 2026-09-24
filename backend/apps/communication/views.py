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


import json
import time
from django.db import connection
from django.conf import settings
from rest_framework.views import APIView
from .models import CookieConsent, SystemAlert
from .serializers import CookieConsentSerializer, SystemAlertSerializer
from .alerts import dispatch_live_alert, log_system_activity, get_client_ip


class ActivityLogViewSet(viewsets.ModelViewSet):
    """Activity log management with filtering, searching, and custom logging."""
    queryset = ActivityLog.objects.all().order_by('-timestamp')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ActivityLog.objects.all().order_by('-timestamp')
        if not (getattr(user, 'is_admin', False) or getattr(user, 'role', '') == 'ADMIN' or user.is_staff or user.is_superuser):
            qs = qs.filter(user__icontains=user.email)

        # Filters
        severity = self.request.query_params.get('severity')
        category = self.request.query_params.get('category')
        activity_type = self.request.query_params.get('type')
        search = self.request.query_params.get('search')

        if severity:
            qs = qs.filter(severity__iexact=severity)
        if category:
            qs = qs.filter(category__iexact=category)
        if activity_type:
            qs = qs.filter(activity_type__icontains=activity_type)
        if search:
            qs = qs.filter(models.Q(title__icontains=search) | models.Q(detail__icontains=search) | models.Q(user__icontains=search))

        return qs

    @action(detail=False, methods=['post'], url_path='log', permission_classes=[permissions.AllowAny])
    def log_event(self, request):
        """Allows both authenticated clients and public pages to record user interactions."""
        data = request.data or {}
        act_type = data.get('type') or data.get('activity_type') or 'CLIENT_EVENT'
        title = data.get('title', 'Client Action')
        detail = data.get('detail', '')
        severity = data.get('severity', 'INFO')
        category = data.get('category', 'SYSTEM')

        user_str = ''
        if request.user.is_authenticated:
            user_str = request.user.email
        else:
            user_str = data.get('user', 'Guest / Anonymous')

        log_obj = log_system_activity(
            activity_type=act_type,
            title=title,
            detail=detail,
            user=user_str,
            request=request,
            severity=severity,
            category=category
        )
        return Response({'status': 'logged', 'id': log_obj.id if log_obj else None}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='export')
    def export_logs(self, request):
        """Exports the latest 500 activity logs as a structured JSON ledger."""
        qs = self.get_queryset()[:500]
        serializer = self.get_serializer(qs, many=True)
        return Response({'count': len(serializer.data), 'logs': serializer.data}, status=status.HTTP_200_OK)


class CookieConsentViewSet(viewsets.ModelViewSet):
    """
    Manages browser cookie consent policies, stores consent records,
    and sets secure response cookies.
    """
    queryset = CookieConsent.objects.all().order_by('-created_at')
    serializer_class = CookieConsentSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action in ['create', 'consent_status']:
            return [permissions.AllowAny()]
        from apps.users.permissions import IsAdmin
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        data = request.data or {}
        ip = get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')
        user = request.user if request.user.is_authenticated else None

        consent_status = data.get('consent_status', 'ALL').upper()
        necessary = data.get('necessary', True)
        analytics = data.get('analytics', True if consent_status == 'ALL' else False)
        functional = data.get('functional', True if consent_status == 'ALL' else False)
        security = data.get('security', True)
        disclaimer_ack = data.get('disclaimer_acknowledged', True)
        session_id = data.get('session_id', request.session.session_key or '')

        consent_obj = CookieConsent.objects.create(
            user=user,
            ip_address=ip,
            user_agent=ua[:500] if ua else '',
            consent_status=consent_status,
            necessary=necessary,
            analytics=analytics,
            functional=functional,
            security=security,
            disclaimer_acknowledged=disclaimer_ack,
            session_id=session_id
        )

        # Audit in ActivityLog
        log_system_activity(
            activity_type='COOKIE_CONSENT',
            title=f"Cookie Consent: {consent_status}",
            detail=f"Necessary: {necessary}, Analytics: {analytics}, Functional: {functional}, Disclaimer Ack: {disclaimer_ack}",
            user=user.email if user else f"Guest ({ip})",
            request=request,
            severity='INFO',
            category='SYSTEM'
        )

        resp_data = CookieConsentSerializer(consent_obj).data
        response = Response({'status': 'consent_recorded', 'consent': resp_data}, status=status.HTTP_201_CREATED)

        # Set secure HTTP cookie on response (persisted for 1 year)
        cookie_payload = json.dumps({
            'status': consent_status,
            'necessary': necessary,
            'analytics': analytics,
            'functional': functional,
            'security': security,
            'disclaimer_acknowledged': disclaimer_ack,
            'timestamp': int(time.time())
        })
        is_secure = getattr(settings, 'SESSION_COOKIE_SECURE', False) or request.is_secure()
        response.set_cookie(
            key='tarepet_cookie_consent',
            value=cookie_payload,
            max_age=31536000,  # 1 year
            samesite='Lax',
            secure=is_secure,
            httponly=False  # Accessible to client JS for immediate UI sync
        )
        response.set_cookie(
            key='tarepet_disclaimer_ack',
            value='true',
            max_age=31536000,
            samesite='Lax',
            secure=is_secure,
            httponly=False
        )
        return response

    @action(detail=False, methods=['get'], url_path='status')
    def consent_status(self, request):
        """Checks if consent is already recorded for this user or IP."""
        ip = get_client_ip(request)
        consent = None
        if request.user.is_authenticated:
            consent = CookieConsent.objects.filter(user=request.user).first()
        if not consent and ip:
            consent = CookieConsent.objects.filter(ip_address=ip).first()

        if consent:
            return Response({'has_consent': True, 'consent': CookieConsentSerializer(consent).data}, status=status.HTTP_200_OK)
        return Response({'has_consent': False}, status=status.HTTP_200_OK)


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


class TelemetryErrorAlertView(APIView):
    """
    Live real-time error & telemetry reporting endpoint.
    Catches broken code, uncaught runtime errors, unhandled rejections, unresponsive UI,
    security breaches, and database spikes, sending instant live email notifications.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        alert_type = str(data.get('alert_type', data.get('type', 'BROKEN_CODE'))).upper()
        if alert_type not in dict(SystemAlert.ALERT_TYPES):
            alert_type = 'BROKEN_CODE'

        title = str(data.get('title') or data.get('message', 'Client Runtime Error'))[:250]
        details = str(data.get('details') or data.get('stack') or data.get('error', 'No trace provided'))
        url = str(data.get('url', request.META.get('HTTP_REFERER', 'Unknown URL')))[:500]
        severity = str(data.get('severity', 'HIGH')).upper()
        if severity not in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']:
            severity = 'HIGH'

        result = dispatch_live_alert(
            alert_type=alert_type,
            title=title,
            details=details,
            request=request,
            severity=severity,
            url=url
        )
        return Response(result, status=status.HTTP_200_OK)


class SystemHealthStatusView(APIView):
    """
    Real-time system health diagnostic endpoint and live alert tester.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        db_healthy = False
        db_latency_ms = None
        t0 = time.time()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            db_latency_ms = round((time.time() - t0) * 1000, 2)
            db_healthy = True
        except Exception as e:
            db_healthy = False
            db_latency_ms = -1

        now = time.time()
        one_day_ago = now - 86400
        total_recent_errors = SystemAlert.objects.filter(created_at__gte=time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(one_day_ago))).count()
        total_activity_logs = ActivityLog.objects.count()
        cookie_consents_count = CookieConsent.objects.count()

        return Response({
            'status': 'OPERATIONAL' if db_healthy else 'DEGRADED',
            'database': {
                'connected': db_healthy,
                'latency_ms': db_latency_ms,
                'engine': settings.DATABASES['default']['ENGINE'].split('.')[-1]
            },
            'telemetry': {
                'errors_24h': total_recent_errors,
                'total_activity_logs': total_activity_logs,
                'total_cookie_consents': cookie_consents_count,
            },
            'email_service': {
                'configured': bool(getattr(settings, 'EMAIL_HOST_USER', '')),
                'backend': settings.EMAIL_BACKEND.split('.')[-1],
                'alert_recipient': getattr(settings, 'ADMIN_ALERT_EMAIL', getattr(settings, 'EMAIL_HOST_USER', 'tarepetm@gmail.com'))
            }
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Dispatches an on-demand test email to verify live alerting is working."""
        from apps.users.permissions import IsAdmin
        if not (request.user.is_authenticated and (getattr(request.user, 'is_admin', False) or getattr(request.user, 'role', '') == 'ADMIN' or request.user.is_staff or request.user.is_superuser)):
            return Response({'error': 'Admin permissions required to send test alerts'}, status=status.HTTP_403_FORBIDDEN)

        res = dispatch_live_alert(
            alert_type='BROKEN_CODE',
            title='Diagnostic Verification: Live Status Alert Pipeline is Active',
            details='This is a confirmed live test email dispatched from the Tarepet LMS Admin Console to verify that error feedback, broken code alerts, database health, and security breaches are properly received.',
            request=request,
            severity='LOW',
            url='https://tarepetmontessorischool.com/dashboard/admin'
        )
        return Response({'status': 'test_alert_dispatched', 'detail': res}, status=status.HTTP_200_OK)



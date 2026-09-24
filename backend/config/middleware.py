import re
import traceback
from django.http import HttpResponse


class HealthCheckMiddleware:
    """
    Ultra-fast health check middleware positioned before CommonMiddleware.
    Allows container orchestrators (Render, Kubernetes, AWS ALB) to perform
    liveness/readiness probes on internal IPs without triggering DisallowedHost (400)
    or trailing-slash redirects (301).
    """
    HEALTH_PATHS = {
        '/',
        '/health',
        '/health/',
        '/api/health',
        '/api/health/',
        '/api/v1/health',
        '/api/v1/health/',
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path in self.HEALTH_PATHS:
            return HttpResponse(
                b'{"status":"healthy","service":"tarepet-backend"}',
                content_type='application/json',
                status=200,
            )
        return self.get_response(request)


class LiveSystemMonitorMiddleware:
    """
    Live monitoring middleware that intercepts unhandled server exceptions (500s),
    detects active security breach patterns, and triggers instant email alerts.
    """
    SUSPICIOUS_PATTERNS = [
        re.compile(r'(\.\./|\.\.\\)', re.IGNORECASE),  # Path traversal
        re.compile(r'(union\s+select|select\s+.*from|drop\s+table|insert\s+into)', re.IGNORECASE),  # SQL Injection
        re.compile(r'(<script|javascript:|onerror=)', re.IGNORECASE),  # XSS in params
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Security scan on incoming query strings
        qs = request.META.get('QUERY_STRING', '')
        if qs:
            for pattern in self.SUSPICIOUS_PATTERNS:
                if pattern.search(qs):
                    from apps.communication.alerts import dispatch_live_alert
                    dispatch_live_alert(
                        alert_type='SECURITY_BREACH',
                        title=f"Potential Exploit Attempt on {request.path}",
                        details=f"Suspicious payload detected in query string:\n{qs[:500]}",
                        request=request,
                        severity='CRITICAL'
                    )
                    break

        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """Catches unhandled backend exceptions, logs them, and dispatches live email."""
        try:
            from apps.communication.alerts import dispatch_live_alert
            tb = traceback.format_exc()
            dispatch_live_alert(
                alert_type='BACKEND_ERROR',
                title=f"Backend Exception: {exception.__class__.__name__} on {request.path}",
                details=f"Exception: {str(exception)}\n\nTraceback:\n{tb}",
                request=request,
                severity='CRITICAL',
                url=request.build_absolute_uri()
            )
        except Exception as e:
            print(f"[LiveSystemMonitorMiddleware Error] {e}")
        return None


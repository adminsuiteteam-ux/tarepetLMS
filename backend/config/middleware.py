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

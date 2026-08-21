from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'healthy', 'service': 'tarepet-backend'})

def trigger_sentry_test(request):
    """Test view to intentionally trigger an exception and verify Sentry reporting."""
    division_by_zero = 1 / 0
    return JsonResponse({'status': 'never reached'})

urlpatterns = [
    path('', health_check, name='root-health'),
    path('health/', health_check, name='health-check'),
    path('api/sentry-debug/', trigger_sentry_test, name='sentry-debug'),
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 Router
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/lms/', include('apps.courses.urls')),
    path('api/v1/assessments/', include('apps.assessments.urls')),
]

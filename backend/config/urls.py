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

urlpatterns = [
    path('', health_check, name='root-health'),
    path('health/', health_check, name='health-check'),
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

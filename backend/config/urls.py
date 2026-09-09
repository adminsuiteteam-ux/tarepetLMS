from django.contrib import admin
from django.urls import path, include
from django.conf import settings as django_settings
from rest_framework.permissions import IsAdminUser
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from django.http import JsonResponse, HttpResponse
from apps.users.views import SeedStudentsView


def health_check(request):
    return JsonResponse({'status': 'healthy', 'service': 'tarepet-backend'})


def favicon_view(request):
    return HttpResponse(status=204)


urlpatterns = [
    path('', health_check, name='root-health'),
    path('favicon.ico', favicon_view, name='favicon'),
    path('health/', health_check, name='health-check'),

    # Admin site
    path('admin/', admin.site.urls),

    # OpenAPI Schema & Docs (auth required in production)
    path(
        'api/schema/',
        SpectacularAPIView.as_view(
            permission_classes=[IsAdminUser] if not django_settings.DEBUG else []
        ),
        name='schema'
    ),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(
            url_name='schema',
            permission_classes=[IsAdminUser] if not django_settings.DEBUG else []
        ),
        name='swagger-ui'
    ),
    path(
        'api/redoc/',
        SpectacularRedocView.as_view(
            url_name='schema',
            permission_classes=[IsAdminUser] if not django_settings.DEBUG else []
        ),
        name='redoc'
    ),

    # API v1 Router — canonical paths only (no duplicate aliases)
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/lms/', include('apps.courses.urls')),
    path('api/v1/assessments/', include('apps.assessments.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/academics/', include('apps.academics.urls')),
    path('api/v1/admissions/', include('apps.admissions.urls')),
    path('api/v1/communication/', include('apps.communication.urls')),
]

# Debug-only routes — never available in production
if django_settings.DEBUG:
    # Sentry smoke-test: intentional 500 to verify error capture pipeline
    def trigger_sentry_test(request):
        """DEBUG-only view to verify Sentry error reporting is functional."""
        raise RuntimeError('Sentry smoke-test triggered intentionally (DEBUG mode only)')

    urlpatterns += [
        path('api/sentry-debug/', trigger_sentry_test, name='sentry-debug'),
        # Seed trigger also exposed in DEBUG for local dev convenience;
        # in production use the management command directly.
        path('api/seed-students/', SeedStudentsView.as_view(), name='root-seed-students'),
    ]

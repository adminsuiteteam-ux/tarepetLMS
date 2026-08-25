from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    CustomTokenObtainPairView,
    OTPVerifyView,
    OTPResendView,
    RegisterView,
    UserProfileView,
    UserViewSet,
    AdminAnalyticsView,
    BulkUserImportView,
    SystemAuditLogView,
    LoginActivityLogView,
    SystemSettingsView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user-management')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('otp/verify/', OTPVerifyView.as_view(), name='otp_verify'),
    path('otp/resend/', OTPResendView.as_view(), name='otp_resend'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('register/', RegisterView.as_view(), name='user_register'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('settings/', SystemSettingsView.as_view(), name='system_settings'),

    # Enterprise Admin Endpoints
    path('admin-analytics/', AdminAnalyticsView.as_view(), name='admin_analytics'),
    path('bulk-import/', BulkUserImportView.as_view(), name='bulk_user_import'),
    path('audit-logs/', SystemAuditLogView.as_view(), name='system_audit_logs'),
    path('login-activities/', LoginActivityLogView.as_view(), name='login_activities'),

    path('', include(router.urls)),
]

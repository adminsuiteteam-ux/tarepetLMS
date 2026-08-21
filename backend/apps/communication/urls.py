from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnnouncementViewSet, ContactMessageViewSet,
    ActivityLogViewSet, NotificationViewSet
)

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'contact', ContactMessageViewSet, basename='contact-message')
router.register(r'messages', ContactMessageViewSet, basename='contact-message-alias')
router.register(r'activities', ActivityLogViewSet, basename='activity-log')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'cbt-notifications', NotificationViewSet, basename='cbt-notification-alias')

urlpatterns = [
    path('', include(router.urls)),
]


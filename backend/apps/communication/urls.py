from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnnouncementViewSet, ContactMessageViewSet

router = DefaultRouter()
router.register(r'announcements', AnnouncementViewSet, basename='announcement')
router.register(r'contact', ContactMessageViewSet, basename='contact-message')
router.register(r'messages', ContactMessageViewSet, basename='contact-message-alias')

urlpatterns = [
    path('', include(router.urls)),
]

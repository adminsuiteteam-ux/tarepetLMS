from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdmissionApplicationViewSet

router = DefaultRouter()
router.register(r'applications', AdmissionApplicationViewSet, basename='admission-application')
router.register(r'inquiries', AdmissionApplicationViewSet, basename='admission-inquiry')  # alias

urlpatterns = [
    path('', include(router.urls)),
]

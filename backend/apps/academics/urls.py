from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BroadsheetViewSet,
    PromotionRecordViewSet,
    ClassAttendanceViewSet,
)

router = DefaultRouter()
router.register(r'broadsheet', BroadsheetViewSet, basename='broadsheet')
router.register(r'promotions', PromotionRecordViewSet, basename='promotions')
router.register(r'attendance', ClassAttendanceViewSet, basename='class-attendance')

urlpatterns = [
    path('', include(router.urls)),
]

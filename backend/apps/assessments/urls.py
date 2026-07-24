from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssignmentViewSet,
    SubmissionViewSet,
    GradebookViewSet,
    AttendanceViewSet,
    BehaviorLogViewSet,
    HouseViewSet,
)

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'gradebook', GradebookViewSet, basename='gradebook')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'behavior-logs', BehaviorLogViewSet, basename='behavior-log')
router.register(r'houses', HouseViewSet, basename='house')

urlpatterns = [
    path('', include(router.urls)),
]

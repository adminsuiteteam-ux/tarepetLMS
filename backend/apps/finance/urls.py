from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeItemViewSet,
    FeeTransactionViewSet,
    IncomeRecordViewSet,
    ExpenseRecordViewSet,
    ClassFeeScheduleViewSet,
    DiscountPolicyViewSet,
    StudentFeeAccountViewSet,
)

router = DefaultRouter()
router.register(r'fee-items', FeeItemViewSet, basename='fee-item')
router.register(r'categories', FeeItemViewSet, basename='fee-category')  # alias for legacy calls
router.register(r'fee-schedules', ClassFeeScheduleViewSet, basename='class-fee-schedule')
router.register(r'discount-policies', DiscountPolicyViewSet, basename='discount-policy')
router.register(r'student-fee-accounts', StudentFeeAccountViewSet, basename='student-fee-account')
router.register(r'transactions', FeeTransactionViewSet, basename='fee-transaction')
router.register(r'income', IncomeRecordViewSet, basename='income-record')
router.register(r'expenses', ExpenseRecordViewSet, basename='expense-record')

urlpatterns = [
    path('', include(router.urls)),
]

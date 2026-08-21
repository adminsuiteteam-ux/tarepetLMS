from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeItemViewSet,
    FeeTransactionViewSet,
    IncomeRecordViewSet,
    ExpenseRecordViewSet,
)

router = DefaultRouter()
router.register(r'fee-items', FeeItemViewSet, basename='fee-item')
router.register(r'categories', FeeItemViewSet, basename='fee-category')  # alias for legacy calls
router.register(r'transactions', FeeTransactionViewSet, basename='fee-transaction')
router.register(r'income', IncomeRecordViewSet, basename='income-record')
router.register(r'expenses', ExpenseRecordViewSet, basename='expense-record')

urlpatterns = [
    path('', include(router.urls)),
]

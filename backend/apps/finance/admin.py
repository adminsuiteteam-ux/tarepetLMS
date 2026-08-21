from django.contrib import admin
from .models import FeeItem, FeeTransaction, IncomeRecord, ExpenseRecord

@admin.register(FeeItem)
class FeeItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'item_key', 'category', 'amount', 'term', 'session', 'is_required')
    search_fields = ('name', 'item_key', 'category')
    list_filter = ('category', 'term', 'session', 'is_required')

@admin.register(FeeTransaction)
class FeeTransactionAdmin(admin.ModelAdmin):
    list_display = ('reference', 'student_name', 'item_name', 'amount', 'channel', 'status', 'paid_at')
    search_fields = ('reference', 'student_name', 'student_email', 'item_name')
    list_filter = ('channel', 'status', 'term', 'session')

@admin.register(IncomeRecord)
class IncomeRecordAdmin(admin.ModelAdmin):
    list_display = ('reference', 'description', 'category', 'amount', 'date', 'status')
    search_fields = ('reference', 'description', 'category')
    list_filter = ('category', 'status', 'date')

@admin.register(ExpenseRecord)
class ExpenseRecordAdmin(admin.ModelAdmin):
    list_display = ('reference', 'description', 'category', 'amount', 'date', 'status')
    search_fields = ('reference', 'description', 'category')
    list_filter = ('category', 'status', 'date')

from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.users.models import CustomUser, StudentProfile


class FeeItem(models.Model):
    item_key = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default='Tuition & Basic')
    parent_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    grade_amounts = models.JSONField(default=dict, blank=True)
    currency = models.CharField(max_length=10, default='NGN')
    due_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    is_required = models.BooleanField(default=False)
    term = models.CharField(max_length=20, default='1ST_TERM')
    session = models.CharField(max_length=20, default='2026/2027')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.item_key}) - ₦{self.amount}"


class FeeTransaction(models.Model):
    class Status(models.TextChoices):
        SUCCESS = 'SUCCESS', _('Success')
        PENDING = 'PENDING', _('Pending')
        FAILED = 'FAILED', _('Failed')

    class Channel(models.TextChoices):
        PAYSTACK = 'paystack', _('Paystack')
        BANK_TRANSFER = 'bank_transfer', _('Bank Transfer')
        CASH = 'cash', _('Cash')

    reference = models.CharField(max_length=100, unique=True)
    student = models.ForeignKey(
        StudentProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='fee_transactions'
    )
    student_name = models.CharField(max_length=255)
    student_email = models.CharField(max_length=255, blank=True, null=True)
    item_key = models.CharField(max_length=100)
    item_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default='NGN')
    channel = models.CharField(max_length=30, choices=Channel.choices, default=Channel.PAYSTACK)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS)
    paid_at = models.DateTimeField(auto_now_add=True)
    receipt_url = models.URLField(blank=True, null=True)
    term = models.CharField(max_length=20, default='1ST_TERM')
    session = models.CharField(max_length=20, default='2026/2027')

    class Meta:
        ordering = ['-paid_at']

    def __str__(self):
        return f"{self.student_name} - {self.item_name} (₦{self.amount}) - {self.status}"


class IncomeRecord(models.Model):
    reference = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='School Fees')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    date = models.DateField()
    status = models.CharField(max_length=30, default='RECEIVED')
    recorded_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_incomes'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Income: {self.description} (₦{self.amount}) - {self.date}"


class ExpenseRecord(models.Model):
    reference = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='Salaries')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    date = models.DateField()
    status = models.CharField(max_length=30, default='PAID')
    recorded_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_expenses'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"Expense: {self.description} (₦{self.amount}) - {self.date}"

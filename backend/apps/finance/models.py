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


class ClassFeeSchedule(models.Model):
    class Division(models.TextChoices):
        CRECHE_NURSERY = 'CRECHE_NURSERY', _('Montessori Crèche & Nursery')
        PRIMARY = 'PRIMARY', _('Montessori Primary')
        JUNIOR_SECONDARY = 'JUNIOR_SECONDARY', _('Junior Secondary (JSS)')
        SENIOR_SECONDARY = 'SENIOR_SECONDARY', _('Senior Secondary (SS)')

    class_level = models.CharField(max_length=50, unique=True)
    division = models.CharField(max_length=50, choices=Division.choices, default=Division.PRIMARY)
    tuition_fee = models.DecimalField(max_digits=12, decimal_places=2, default=40000.00)
    development_levy = models.DecimalField(max_digits=12, decimal_places=2, default=5000.00)
    books_materials = models.DecimalField(max_digits=12, decimal_places=2, default=10000.00)
    uniform_sports = models.DecimalField(max_digits=12, decimal_places=2, default=8000.00)
    pta_medical = models.DecimalField(max_digits=12, decimal_places=2, default=3000.00)
    exam_levy = models.DecimalField(max_digits=12, decimal_places=2, default=2000.00)
    extra_fees = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    session = models.CharField(max_length=20, default='2025/2026')
    term = models.CharField(max_length=20, default='2nd Term')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    @property
    def total_fee(self):
        return (
            self.tuition_fee +
            self.development_levy +
            self.books_materials +
            self.uniform_sports +
            self.pta_medical +
            self.exam_levy
        )

    def __str__(self):
        return f"{self.class_level} ({self.division}) - Total: ₦{self.total_fee}"


class DiscountPolicy(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', _('Percentage (%)')
        FIXED = 'FIXED', _('Fixed Amount (₦)')

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENTAGE)
    value = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.value}{'%' if self.discount_type == 'PERCENTAGE' else ' NGN'})"


class StudentFeeAccount(models.Model):
    class PaymentStatus(models.TextChoices):
        PAID = 'PAID', _('Fully Paid')
        PARTIAL = 'PARTIAL', _('Partially Paid')
        UNPAID = 'UNPAID', _('Unpaid')

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='fee_accounts', null=True, blank=True)
    student_name = models.CharField(max_length=255)
    class_level = models.CharField(max_length=50)
    session = models.CharField(max_length=20, default='2025/2026')
    term = models.CharField(max_length=20, default='2nd Term')
    total_billed = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_applied = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_reason = models.CharField(max_length=150, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    last_payment_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['class_level', 'student_name']

    def __str__(self):
        return f"{self.student_name} ({self.class_level}) - {self.status} (Bal: ₦{self.balance_due})"

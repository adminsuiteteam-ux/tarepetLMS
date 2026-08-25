from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', CustomUser.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrator')
        TEACHER = 'TEACHER', _('Teacher')
        STUDENT = 'STUDENT', _('Student')
        PARENT = 'PARENT', _('Parent')

    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True, null=True)
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )
    profile_image = models.TextField(blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) - {self.get_role_display()}"

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    @property
    def is_parent(self):
        return self.role == self.Role.PARENT


class ParentProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='parent_profile'
    )
    occupation = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    preferred_language = models.CharField(max_length=50, default='English')
    newsletter_subscription = models.BooleanField(default=True)
    profile_image = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Parent: {self.user.get_full_name()}"


class StudentProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='student_profile'
    )
    student_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    parents = models.ManyToManyField(
        ParentProfile, related_name='students', blank=True
    )
    grade_level = models.CharField(max_length=50, default='Primary 1')
    stream = models.CharField(max_length=50, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    house = models.CharField(max_length=50, blank=True, null=True)
    admission_date = models.DateField(auto_now_add=True)
    date_of_birth = models.DateField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    state_of_origin = models.CharField(max_length=100, blank=True, null=True)
    lga = models.CharField(max_length=100, blank=True, null=True)
    parent_name = models.CharField(max_length=255, blank=True, null=True)
    parent_phone = models.CharField(max_length=50, blank=True, null=True)
    programme = models.CharField(max_length=150, blank=True, null=True)
    study_mode = models.CharField(max_length=50, default='Full Time', blank=True, null=True)
    profile_image = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Student: {self.user.get_full_name()} ({self.student_id or 'No ID'})"


class TeacherProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='teacher_profile'
    )
    teacher_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, default='Montessori Primary')
    specialization = models.CharField(max_length=100, blank=True, null=True)
    subjects_taught = models.JSONField(default=list, blank=True)
    hire_date = models.DateField(blank=True, null=True)
    qualifications = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    salary = models.CharField(max_length=50, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    form_teacher_of = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_image = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Teacher: {self.user.get_full_name()} ({self.teacher_id or 'No ID'})"


class AdminProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='admin_profile'
    )
    admin_id = models.CharField(max_length=50, blank=True, null=True, default='TMS/ADM/2018/001')
    title = models.CharField(max_length=150, default='School Principal & Chief Administrator', blank=True, null=True)
    department = models.CharField(max_length=150, default='Executive Governance & Academics', blank=True, null=True)
    role_type = models.CharField(max_length=50, default='Super Admin')
    gender = models.CharField(max_length=20, blank=True, null=True, default='Male')
    dob = models.CharField(max_length=50, blank=True, null=True, default='1978-08-15')
    state_of_origin = models.CharField(max_length=100, blank=True, null=True, default='Bayelsa State, Nigeria')
    address = models.TextField(blank=True, null=True, default='12 Kpansia-Epie Road, Yenagoa, Bayelsa State')
    emergency_contact = models.CharField(max_length=150, blank=True, null=True, default='Mrs. Florence Montessori (Spouse)')
    emergency_phone = models.CharField(max_length=50, blank=True, null=True, default='+234 802 987 6543')
    office_location = models.CharField(max_length=200, blank=True, null=True, default="Principal's Office Suite, Block A Executive Wing")
    direct_extension = models.CharField(max_length=50, blank=True, null=True, default='Ext. 101 (Direct Intercom)')
    bio = models.TextField(
        blank=True,
        null=True,
        default='Visionary educational leader with over 18 years of pioneering excellence in Montessori and Nigerian National Curriculum pedagogy. Committed to nurturing intellectual curiosity, ethical character, and academic brilliance across all learners.'
    )
    rank = models.CharField(max_length=100, blank=True, null=True, default='Chief Executive Administrator (Super Admin)')
    blood_group = models.CharField(max_length=20, blank=True, null=True, default='O+')
    qualifications = models.TextField(blank=True, null=True)
    certifications = models.TextField(blank=True, null=True)
    committees = models.JSONField(default=list, blank=True)
    divisions_supervised = models.JSONField(default=list, blank=True)
    permissions = models.JSONField(default=dict, blank=True)
    profile_image = models.TextField(blank=True, null=True)
    extra_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Admin: {self.user.get_full_name()} ({self.admin_id or 'TMS/ADM/2018/001'})"


class SystemSettings(models.Model):
    """
    Central institutional configuration holding all settings sections
    from the Administrator Settings console in the database.
    """
    # 1. Multi-Factor & Authentication
    enforce_2fa = models.BooleanField(default=True)
    otp_channels = models.JSONField(default=list, blank=True)
    otp_expiry_minutes = models.IntegerField(default=5)
    max_otp_attempts = models.IntegerField(default=3)
    send_welcome_email_with_credentials = models.BooleanField(default=True)
    allow_direct_student_pin_login = models.BooleanField(default=True)
    min_password_length = models.IntegerField(default=8)
    require_special_char = models.BooleanField(default=True)
    require_number = models.BooleanField(default=True)
    password_expiry_months = models.IntegerField(default=6)
    failed_login_lockout_attempts = models.IntegerField(default=5)

    # 2. School Identity
    school_name = models.CharField(max_length=200, default='Tare Pet Montessori School')
    short_name = models.CharField(max_length=50, default='TPMS')
    motto = models.CharField(max_length=255, default='Excellence Through Observation & Character')
    official_email = models.EmailField(default='info@tarepet.edu.ng')
    phone = models.CharField(max_length=50, default='+234 803 123 4567')
    address = models.TextField(default='12 Kpansia-Epie Road, Yenagoa, Bayelsa State, Nigeria')
    ministry_reg_no = models.CharField(max_length=100, default='EDU/BY/SCH/2009/0421')
    proprietress = models.CharField(max_length=150, default='Mrs. Tare Pet')
    principal = models.CharField(max_length=150, default='Dr. T. Montessori')
    vice_principal = models.CharField(max_length=150, default='Mr. James Eze')
    accreditations = models.TextField(blank=True, null=True)

    # 3. Academic & Grading
    session = models.CharField(max_length=50, default='2025/2026')
    term = models.CharField(max_length=50, default='2nd Term')
    term_start = models.CharField(max_length=50, default='2026-01-12')
    term_end = models.CharField(max_length=50, default='2026-04-04')
    min_pass_mark = models.IntegerField(default=50)
    ca1_weight = models.IntegerField(default=15)
    ca2_weight = models.IntegerField(default=15)
    exam_weight = models.IntegerField(default=70)
    grading_scale = models.JSONField(default=dict, blank=True)

    # 4. Session & Access
    session_timeout_minutes = models.IntegerField(default=30)
    single_session_per_user = models.BooleanField(default=True)
    rbac_roles = models.JSONField(default=dict, blank=True)

    # 5. Notifications & SMS
    sms_provider = models.CharField(max_length=100, default='Termii (Nigeria)')
    sms_sender_id = models.CharField(max_length=50, default='TPMS-School')
    sms_balance = models.IntegerField(default=4820)
    notify_results_sms = models.BooleanField(default=True)
    notify_attendance_sms = models.BooleanField(default=True)
    notify_fees_sms = models.BooleanField(default=True)
    notify_cbt_exams = models.BooleanField(default=True)

    # 6. Fees
    late_fee_penalty = models.CharField(max_length=100, default='₦2,000 flat fee after due date')
    scholarship_slots = models.IntegerField(default=10)
    fee_schedules = models.JSONField(default=dict, blank=True)

    # 7. Portal Theme & Preferences
    portal_language = models.CharField(max_length=50, default='en-NG')
    color_scheme = models.CharField(max_length=50, default='system')
    date_format = models.CharField(max_length=50, default='YYYY-MM-DD')
    currency = models.CharField(max_length=20, default='NGN')

    # Comprehensive JSON holding all arbitrary settings sections
    settings_data = models.JSONField(default=dict, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return f"System Settings (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else 'Initial'})"

    @classmethod
    def get_settings(cls):
        obj, created = cls.objects.get_or_create(id=1)
        if created or not obj.settings_data:
            obj.settings_data = {
                'enforce2FA': obj.enforce_2fa,
                'otpChannels': obj.otp_channels or ['EMAIL'],
                'otpExpiryMinutes': obj.otp_expiry_minutes,
                'maxOtpAttempts': obj.max_otp_attempts,
                'sendWelcomeEmailWithCredentials': obj.send_welcome_email_with_credentials,
                'allowDirectStudentPinLogin': obj.allow_direct_student_pin_login,
                'minPasswordLength': obj.min_password_length,
                'requireSpecialChar': obj.require_special_char,
                'requireNumber': obj.require_number,
                'passwordExpiryMonths': obj.password_expiry_months,
                'failedLoginLockoutAttempts': obj.failed_login_lockout_attempts,
                'schoolName': obj.school_name,
                'shortName': obj.short_name,
                'motto': obj.motto,
                'officialEmail': obj.official_email,
                'phone': obj.phone,
                'address': obj.address,
                'ministryRegNo': obj.ministry_reg_no,
                'proprietress': obj.proprietress,
                'principal': obj.principal,
                'vicePrincipal': obj.vice_principal,
                'session': obj.session,
                'term': obj.term,
                'termStart': obj.term_start,
                'termEnd': obj.term_end,
                'minPassMark': obj.min_pass_mark,
                'ca1Weight': obj.ca1_weight,
                'ca2Weight': obj.ca2_weight,
                'examWeight': obj.exam_weight,
                'sessionTimeoutMinutes': obj.session_timeout_minutes,
                'singleSessionPerUser': obj.single_session_per_user,
                'smsProvider': obj.sms_provider,
                'smsSenderId': obj.sms_sender_id,
                'smsBalance': obj.sms_balance,
                'notifyResultsSMS': obj.notify_results_sms,
                'notifyAttendanceSMS': obj.notify_attendance_sms,
                'notifyFeesSMS': obj.notify_fees_sms,
                'notifyCBTExams': obj.notify_cbt_exams,
                'lateFeePenalty': obj.late_fee_penalty,
                'scholarshipSlots': obj.scholarship_slots,
                'portalLanguage': obj.portal_language,
                'colorScheme': obj.color_scheme,
                'dateFormat': obj.date_format,
                'currency': obj.currency,
            }
            obj.save()
        return obj


class LoginActivityLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='login_logs')
    email = models.CharField(max_length=255)
    role = models.CharField(max_length=50, default='UNKNOWN')
    ip_address = models.CharField(max_length=100, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    device_info = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, default='SUCCESS')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.email} ({self.role}) - {self.status} at {self.timestamp}"


# ── Signals: Auto-Create Profile for Users ───────────────────────────────────
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomUser)
def create_or_ensure_user_profile(sender, instance, created, **kwargs):
    if instance.role == CustomUser.Role.TEACHER:
        if not hasattr(instance, 'teacher_profile'):
            candidate_id = f"TMS/TCH/{instance.id:04d}"
            if TeacherProfile.objects.filter(teacher_id=candidate_id).exists():
                candidate_id = f"TMS/TCH/{instance.id:04d}_{instance.pk}"
            TeacherProfile.objects.create(
                user=instance,
                teacher_id=candidate_id,
                department="Montessori Primary",
                specialization="",
            )
    elif instance.role == CustomUser.Role.STUDENT:
        if not hasattr(instance, 'student_profile'):
            candidate_stu_id = f"TP-STU-{instance.id:04d}"
            if StudentProfile.objects.filter(student_id=candidate_stu_id).exists():
                candidate_stu_id = f"TP-STU-{instance.id:04d}_{instance.pk}"
            StudentProfile.objects.create(
                user=instance,
                student_id=candidate_stu_id,
                grade_level="Primary 1",
            )
    elif instance.role == CustomUser.Role.PARENT:
        if not hasattr(instance, 'parent_profile'):
            ParentProfile.objects.create(user=instance)
    elif instance.role == CustomUser.Role.ADMIN:
        if not hasattr(instance, 'admin_profile'):
            AdminProfile.objects.create(user=instance)


# ── OTP 2FA Model ─────────────────────────────────────────────────────────────
import secrets
import hashlib
import uuid
from datetime import timedelta
from django.utils import timezone


class OTPVerification(models.Model):
    class Purpose(models.TextChoices):
        LOGIN_2FA = 'LOGIN', _('Login 2FA')
        PASSWORD_RESET = 'RESET', _('Password Reset')

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otp_verifications')
    temp_token = models.CharField(max_length=64, unique=True, default=uuid.uuid4, db_index=True)
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, choices=Purpose.choices, default=Purpose.LOGIN_2FA)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.user.email} [{self.purpose}] - {'Used' if self.is_used else 'Active'}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    @classmethod
    def create_otp(cls, user, purpose=Purpose.LOGIN_2FA, validity_minutes=5):
        # Invalidate any existing active OTPs for this user & purpose
        cls.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)

        raw_code = f"{secrets.randbelow(900000) + 100000:06d}"
        code_hash = hashlib.sha256(raw_code.encode()).hexdigest()
        temp_token = uuid.uuid4().hex

        otp_obj = cls.objects.create(
            user=user,
            temp_token=temp_token,
            code_hash=code_hash,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=validity_minutes),
        )
        return raw_code, temp_token, otp_obj

    def verify(self, raw_code: str) -> tuple[bool, str]:
        if self.is_used:
            return False, "This OTP has already been used. Please request a new one."
        if self.is_expired:
            return False, "This OTP has expired. Please request a new code."
        if self.attempts >= 3:
            self.is_used = True
            self.save(update_fields=['is_used'])
            return False, "Too many failed attempts. Please request a new code."

        input_hash = hashlib.sha256(str(raw_code).strip().encode()).hexdigest()
        if input_hash == self.code_hash:
            self.is_used = True
            self.save(update_fields=['is_used'])
            return True, "Verification successful."
        else:
            self.attempts += 1
            self.save(update_fields=['attempts'])
            remaining = 3 - self.attempts
            if remaining <= 0:
                self.is_used = True
                self.save(update_fields=['is_used'])
                return False, "Too many failed attempts. This code has been invalidated."
            return False, f"Incorrect code. {remaining} attempt(s) remaining."




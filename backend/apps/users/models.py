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
    house = models.CharField(max_length=50, blank=True, null=True)
    admission_date = models.DateField(auto_now_add=True)
    date_of_birth = models.DateField(blank=True, null=True)
    medical_conditions = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)

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

    def __str__(self):
        return f"Teacher: {self.user.get_full_name()} ({self.teacher_id or 'No ID'})"


class AdminProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='admin_profile'
    )
    role_type = models.CharField(max_length=50, default='Super Admin')
    permissions = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Admin: {self.user.get_full_name()} ({self.role_type})"


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
            TeacherProfile.objects.create(
                user=instance,
                teacher_id=f"TMS/TCH/{instance.id:04d}",
                department="Montessori Primary",
                specialization="Education Specialist",
            )
    elif instance.role == CustomUser.Role.STUDENT:
        if not hasattr(instance, 'student_profile'):
            StudentProfile.objects.create(
                user=instance,
                student_id=f"TP-STU-{instance.id:04d}",
                grade_level="Primary 1",
            )
    elif instance.role == CustomUser.Role.PARENT:
        if not hasattr(instance, 'parent_profile'):
            ParentProfile.objects.create(user=instance)
    elif instance.role == CustomUser.Role.ADMIN:
        if not hasattr(instance, 'admin_profile'):
            AdminProfile.objects.create(user=instance)




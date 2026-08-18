from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import StudentProfile, TeacherProfile

User = get_user_model()


class EmailOrIDModelBackend(ModelBackend):
    """
    Custom authentication backend that allows logging in with:
    - Email (case-insensitive)
    - Username (case-insensitive)
    - Student ID (e.g. TP-STU-001)
    - Teacher ID (e.g. TMS/TCH/0060)
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get(User.USERNAME_FIELD) or kwargs.get('email')
        if not username or password is None:
            return None

        identifier = str(username).strip()

        # 1. Check Student ID
        student_prof = StudentProfile.objects.filter(student_id__iexact=identifier).select_related('user').first()
        if student_prof and student_prof.user:
            user = student_prof.user
            if user.check_password(password) and self.user_can_authenticate(user):
                return user

        # 2. Check Teacher ID
        teacher_prof = TeacherProfile.objects.filter(teacher_id__iexact=identifier).select_related('user').first()
        if teacher_prof and teacher_prof.user:
            user = teacher_prof.user
            if user.check_password(password) and self.user_can_authenticate(user):
                return user

        # 3. Check Email or Username case-insensitively
        try:
            user = User.objects.filter(
                Q(email__iexact=identifier) | Q(username__iexact=identifier)
            ).first()
        except Exception:
            return None

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user

        return None

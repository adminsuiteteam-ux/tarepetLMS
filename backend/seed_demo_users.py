import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import AdminProfile, TeacherProfile, StudentProfile, ParentProfile

User = get_user_model()

def seed():
    print("[SEED] Seeding Tarepet Montessori Default Users...")

    # 1. Admin Account
    admin_email = "admin@tarepet.com"
    admin_user, created = User.objects.get_or_create(email=admin_email, defaults={
        'username': admin_email,
        'first_name': 'System',
        'last_name': 'Administrator',
        'role': User.Role.ADMIN,
        'is_staff': True,
        'is_superuser': True,
    })
    admin_user.set_password("admin123")
    admin_user.role = User.Role.ADMIN
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    AdminProfile.objects.get_or_create(user=admin_user, defaults={'role_type': 'Super Admin'})
    print(f"[OK] Admin Account: {admin_email} / admin123")

    # 2. Teacher Account
    teacher_email = "teacher@tarepet.com"
    teacher_user, created = User.objects.get_or_create(email=teacher_email, defaults={
        'username': teacher_email,
        'first_name': 'Simeon',
        'last_name': 'Chigozie',
        'role': User.Role.TEACHER,
    })
    teacher_user.set_password("teacher123")
    teacher_user.role = User.Role.TEACHER
    teacher_user.save()
    teacher_profile, _ = TeacherProfile.objects.get_or_create(user=teacher_user, defaults={
        'teacher_id': 'TCH001',
        'department': 'Montessori Primary',
        'specialization': 'Basic Science & Mathematics',
        'form_teacher_of': 'Primary 1',
    })
    print(f"[OK] Teacher Account: {teacher_email} / teacher123 (ID: TCH001)")

    # 3. Parent Account
    parent_email = "parent@tarepet.com"
    parent_user, created = User.objects.get_or_create(email=parent_email, defaults={
        'username': parent_email,
        'first_name': 'Grace',
        'last_name': 'Okon',
        'role': User.Role.PARENT,
    })
    parent_user.set_password("parent123")
    parent_user.role = User.Role.PARENT
    parent_user.save()
    parent_profile, _ = ParentProfile.objects.get_or_create(user=parent_user, defaults={
        'occupation': 'Engineer',
        'address': '12 Tarepet Way, Lagos',
    })
    print(f"[OK] Parent Account: {parent_email} / parent123")

    # 4. Student Account
    student_email = "student@tarepet.com"
    student_user, created = User.objects.get_or_create(email=student_email, defaults={
        'username': student_email,
        'first_name': 'David',
        'last_name': 'Okon',
        'role': User.Role.STUDENT,
    })
    student_user.set_password("student123")
    student_user.role = User.Role.STUDENT
    student_user.save()
    student_profile, _ = StudentProfile.objects.get_or_create(user=student_user, defaults={
        'student_id': 'STD001',
        'grade_level': 'Primary 1',
        'house': 'Blue House',
    })
    student_profile.parents.add(parent_profile)
    print(f"[OK] Student Account: {student_email} / student123 (ID: STD001)")

    print("\n[SUCCESS] All demo accounts successfully seeded into Django Database!")

if __name__ == "__main__":
    seed()

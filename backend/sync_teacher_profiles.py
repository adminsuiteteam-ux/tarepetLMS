import sys
import os
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import CustomUser, TeacherProfile, StudentProfile

def sync_profiles():
    print("[SYNC] Checking and syncing missing user profiles in Django DB...")
    
    # 1. Teachers
    teachers = CustomUser.objects.filter(role=CustomUser.Role.TEACHER)
    fixed_teachers = 0
    for user in teachers:
        if not hasattr(user, 'teacher_profile'):
            tch_id = f"TMS/TCH/{user.id:04d}"
            # Check if tch_id exists
            if TeacherProfile.objects.filter(teacher_id=tch_id).exists():
                tch_id = f"TMS/TCH/ALT-{user.id}"
            TeacherProfile.objects.create(
                user=user,
                teacher_id=tch_id,
                department="Montessori Primary",
                specialization="Education Specialist",
            )
            fixed_teachers += 1
            print(f"  [+] Created TeacherProfile for {user.email} (ID: {tch_id})")

    # 2. Students
    students = CustomUser.objects.filter(role=CustomUser.Role.STUDENT)
    fixed_students = 0
    for user in students:
        if not hasattr(user, 'student_profile'):
            stu_id = f"TP-STU-{user.id:04d}"
            if StudentProfile.objects.filter(student_id=stu_id).exists():
                stu_id = f"TP-STU-ALT-{user.id}"
            StudentProfile.objects.create(
                user=user,
                student_id=stu_id,
                grade_level="Primary 1",
            )
            fixed_students += 1

    print(f"\n[SUCCESS] Profile sync complete!")
    print(f"  - Teacher Users Total: {teachers.count()}")
    print(f"  - Teacher Profiles Total: {TeacherProfile.objects.count()}")
    print(f"  - Fixed Teachers: {fixed_teachers}")
    print(f"  - Fixed Students: {fixed_students}")

if __name__ == '__main__':
    sync_profiles()

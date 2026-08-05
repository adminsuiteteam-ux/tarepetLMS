from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile, TeacherProfile, ParentProfile, AdminProfile
from apps.courses.models import Course, Module, Lesson, Quiz, Question
from apps.assessments.models import House, Assignment, Submission, Attendance, BehaviorLog

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds sample data for Tarepet Montessori LMS (Users, Courses, Houses, Assignments)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding Tarepet Montessori LMS database...'))

        # 1. Create Houses
        houses_data = [
            {'name': 'Red House (Falcon)', 'color': 'Red', 'motto': 'Soar to Excellence', 'points': 450},
            {'name': 'Blue House (Eagle)', 'color': 'Blue', 'motto': 'Wisdom & Honor', 'points': 520},
            {'name': 'Green House (Jaguar)', 'color': 'Green', 'motto': 'Strength & Unity', 'points': 480},
            {'name': 'Purple House (Phoenix)', 'color': 'Purple', 'motto': 'Rise & Illuminate', 'points': 510},
        ]
        for h in houses_data:
            House.objects.get_or_create(name=h['name'], defaults=h)

        # 2. Create Admin Account
        admin_user = User.objects.filter(email='admin@tarepet.edu.ng').first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                email='admin@tarepet.edu.ng',
                password='AdminPassword123!',
                first_name='Super',
                last_name='Administrator',
            )
        AdminProfile.objects.get_or_create(user=admin_user, defaults={'role_type': 'Super Admin'})

        # 3. Create Teacher Account
        teacher_email = 'chioma.okafor@tarepet.com'
        teacher_id_val = 'TP-TCH-001'
        teacher_user = User.objects.filter(email=teacher_email).first()
        if not teacher_user:
            teacher_user = User.objects.create_user(
                email=teacher_email,
                password=teacher_id_val,
                first_name='Chioma',
                last_name='Okafor',
                role=User.Role.TEACHER,
                is_staff=True,
            )
        else:
            teacher_user.set_password(teacher_id_val)
            teacher_user.save()

        teacher_prof, _ = TeacherProfile.objects.get_or_create(
            user=teacher_user,
            defaults={
                'teacher_id': teacher_id_val,
                'department': 'Montessori Secondary (Erdkinder)',
                'subjects_taught': ['Mathematics', 'Practical Life', 'Botany & Agronomy'],
                'bio': 'Senior Montessori Educator with 12+ years teaching experience.'
            }
        )
        if not teacher_prof.teacher_id:
            teacher_prof.teacher_id = teacher_id_val
            teacher_prof.save()

        # 4. Create Parent Account
        parent_email = 'ebi.amadi@tarepet.com'
        parent_user = User.objects.filter(email=parent_email).first()
        if not parent_user:
            parent_user = User.objects.create_user(
                email=parent_email,
                password='ParentPassword123!',
                first_name='Ebi',
                last_name='Amadi',
                role=User.Role.PARENT,
            )
        parent_prof, _ = ParentProfile.objects.get_or_create(
            user=parent_user,
            defaults={'occupation': 'Civil Engineer', 'address': 'Yenagoa, Bayelsa State'}
        )

        # 5. Create Student Account
        student_email = 'emeka.amadi@tarepet.com'
        student_id_val = 'TP-STU-001'
        student_user = User.objects.filter(email=student_email).first()
        if not student_user:
            student_user = User.objects.create_user(
                email=student_email,
                password=student_id_val,
                first_name='Emeka',
                last_name='Amadi',
                role=User.Role.STUDENT,
            )
        else:
            student_user.set_password(student_id_val)
            student_user.save()

        student_prof, _ = StudentProfile.objects.get_or_create(
            user=student_user,
            defaults={
                'student_id': student_id_val,
                'grade_level': 'Junior Secondary 1',
                'house': 'Blue House (Eagle)',
            }
        )
        if not student_prof.student_id:
            student_prof.student_id = student_id_val
            student_prof.save()

        student_prof.parents.add(parent_prof)

        # 6. Create Course & Modules
        course, _ = Course.objects.get_or_create(
            code='MTH-101',
            defaults={
                'title': 'Montessori Applied Mathematics',
                'description': 'Erdkinder practical mathematics integrating micro-economy and geometry.',
                'teacher': teacher_prof,
                'grade_level': 'Junior Secondary 1',
                'enrollment_limit': 30,
                'is_active': True,
                'thumbnail': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop'
            }
        )
        course.students.add(student_prof)

        module, _ = Module.objects.get_or_create(
            course=course,
            title='Module 1: Practical Geometry & Measurement',
            defaults={'order': 1, 'is_published': True}
        )

        Lesson.objects.get_or_create(
            module=module,
            title='Lesson 1: Geometric Solids in Architecture',
            defaults={
                'content_type': Lesson.ContentType.VIDEO,
                'content_url': 'https://www.youtube.com/watch?v=sample',
                'text_content': 'Exploring Pythagorean application in agricultural field layout.',
                'order': 1,
                'estimated_time': 25,
            }
        )

        # 7. Create Assignment
        Assignment.objects.get_or_create(
            course=course,
            title='Agronomy Micro-Economy Financial Ledger',
            defaults={
                'description': 'Submit your farm ledger calculating profit margin on cassava harvest.',
                'due_date': '2026-08-15 23:59:00+00:00',
                'max_score': 100.0,
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded Tarepet LMS demo accounts:'))
        self.stdout.write('  - Admin: admin@tarepet.edu.ng (Pass: AdminPassword123!)')
        self.stdout.write(f'  - Teacher: {teacher_email} (ID & Pass: {teacher_id_val})')
        self.stdout.write(f'  - Student: {student_email} (ID & Pass: {student_id_val})')
        self.stdout.write(f'  - Parent: {parent_email} (Pass: ParentPassword123!)')

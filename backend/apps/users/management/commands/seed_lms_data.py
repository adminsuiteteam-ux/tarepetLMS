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

        # 2. Create / Reset Admin Superuser Accounts
        admin_emails = ['admin@tarepet.edu.ng', 'admin@tarepet.com']
        for adm_email in admin_emails:
            adm_user = User.objects.filter(email=adm_email).first()
            if not adm_user:
                adm_user = User.objects.filter(username=adm_email).first()
            if not adm_user:
                adm_user = User.objects.create_superuser(
                    email=adm_email,
                    password='AdminPassword123!',
                    first_name='Super',
                    last_name='Administrator',
                    role=User.Role.ADMIN,
                )
            else:
                adm_user.set_password('AdminPassword123!')
                adm_user.is_staff = True
                adm_user.is_superuser = True
                adm_user.is_active = True
                adm_user.role = User.Role.ADMIN
                adm_user.save()
            AdminProfile.objects.get_or_create(user=adm_user, defaults={'role_type': 'Super Admin'})

        # 3. Seed Teachers from Official Roster
        teachers_roster = [
            {
                'first_name': 'Simeon Blessed',
                'last_name': 'Chigozie',
                'email': 'blessedsimeon6@gmail.com',
                'teacher_id': 'TMS/TCH/0019',
                'gender': 'Male',
                'department': 'Physics & Science Department',
                'specialization': 'Physics & Basic Science',
                'subjects_taught': [
                    {'name': 'Physics', 'grade': 'SS 1'},
                    {'name': 'Physics', 'grade': 'SS 2'},
                    {'name': 'Physics', 'grade': 'SS 3'},
                    {'name': 'Basic Science', 'grade': 'JSS 1'},
                ],
                'bio': 'Physics and Basic Science educator for Junior and Senior Secondary levels.'
            },
            {
                'first_name': 'Eli',
                'last_name': 'Idua',
                'email': 'eliidua@gmail.com',
                'teacher_id': 'TMS/TCH/0025',
                'gender': 'Male',
                'department': 'Mathematics Department',
                'specialization': 'Mathematics & Further Mathematics',
                'subjects_taught': [
                    {'name': 'Mathematics', 'grade': 'JSS 3'},
                    {'name': 'Mathematics', 'grade': 'SS 3'},
                    {'name': 'Further Mathematics', 'grade': 'SS 2'},
                    {'name': 'Further Mathematics', 'grade': 'SS 3'},
                ],
                'bio': 'Senior Mathematics & Further Mathematics specialist.'
            },
            {
                'first_name': 'Amos',
                'last_name': 'Godspower',
                'email': 'amosgodspower360@mail.com',
                'teacher_id': 'TMS/TCH/0054',
                'gender': 'Male',
                'department': 'Social Sciences',
                'specialization': 'Civic Education',
                'subjects_taught': [
                    {'name': 'Civic Education', 'grade': 'SS 1'},
                    {'name': 'Civic Education', 'grade': 'SS 2'},
                    {'name': 'Civic Education', 'grade': 'SS 3'},
                ],
                'bio': 'Civic Education specialist across all Senior Secondary classes (SS1 - SS3).'
            },
            {
                'first_name': 'Goodluck',
                'last_name': 'Ufomba',
                'email': 'goodluckufomba2020@gmail.com',
                'teacher_id': 'TMS/TCH/0027',
                'gender': 'Male',
                'department': 'Mathematics Department',
                'specialization': 'Mathematics',
                'subjects_taught': [
                    {'name': 'Mathematics', 'grade': 'SS 2'},
                ],
                'bio': 'Mathematics educator handling SS 2 curriculum.'
            },
            {
                'first_name': 'Alfred-Eto',
                'last_name': 'Eluan',
                'email': 'alfredetoeluan16@gmail.com',
                'teacher_id': 'TMS/TCH/0039',
                'gender': 'Male',
                'department': 'Science Department',
                'specialization': 'Chemistry',
                'subjects_taught': [
                    {'name': 'Chemistry', 'grade': 'SS 2'},
                    {'name': 'Chemistry', 'grade': 'SS 3'},
                ],
                'bio': 'Senior Chemistry specialist for SS 2 and SS 3.'
            },
            {
                'first_name': 'Abiola Adeniyi',
                'last_name': 'Adeyemo',
                'email': 'adeniyiabiola2@gmail.com',
                'teacher_id': 'TMS/TCH/0017',
                'gender': 'Male',
                'department': 'Science Department',
                'specialization': 'Chemistry',
                'subjects_taught': [
                    {'name': 'Chemistry', 'grade': 'SS 1'},
                ],
                'bio': 'Chemistry educator for Senior Secondary 1 (SS1).'
            },
            {
                'first_name': 'Emmanuel',
                'last_name': 'Joseph',
                'email': 'joeugbede2024@gmail.com',
                'teacher_id': 'TMS/TCH/0022',
                'gender': 'Male',
                'department': 'Biological Sciences',
                'specialization': 'Biology',
                'subjects_taught': [
                    {'name': 'Biology', 'grade': 'SS 1'},
                    {'name': 'Biology', 'grade': 'SS 2'},
                    {'name': 'Biology', 'grade': 'SS 3'},
                ],
                'bio': 'Senior Biology specialist for SS 1, SS 2, and SS 3.'
            },
            {
                'first_name': 'Alex T.',
                'last_name': 'Akpobulokemi',
                'email': 'alexakpobulokemi@gmail.com',
                'teacher_id': 'TMS/TCH/0013',
                'gender': 'Male',
                'department': 'Geography & Environmental Sciences',
                'specialization': 'Geography & Marine Geography',
                'subjects_taught': [
                    {'name': 'Geography', 'grade': 'SS 1'},
                    {'name': 'Geography', 'grade': 'SS 2'},
                    {'name': 'Geography', 'grade': 'SS 3'},
                    {'name': 'Marine Geography', 'grade': 'SS 1'},
                    {'name': 'Marine Geography', 'grade': 'SS 2'},
                    {'name': 'Marine Geography', 'grade': 'SS 3'},
                ],
                'bio': 'Geography and Marine Environmental Studies educator (SS 1 - SS 3).'
            },
            {
                'first_name': 'Joseph',
                'last_name': 'Ekenebe',
                'email': 'joebleszekenebe@gmail.com',
                'teacher_id': 'TMS/TCH/0043',
                'gender': 'Male',
                'department': 'Senior Secondary Studies',
                'specialization': 'Senior Secondary Studies',
                'subjects_taught': [
                    {'name': 'Senior Secondary Studies', 'grade': 'SS 1'},
                    {'name': 'Senior Secondary Studies', 'grade': 'SS 2'},
                    {'name': 'Senior Secondary Studies', 'grade': 'SS 3'},
                ],
                'bio': 'Senior Secondary faculty educator across SS 1, SS 2, and SS 3 classes.'
            },
            {
                'first_name': 'Timi',
                'last_name': 'Porbeni',
                'email': 'isaactimi16@gmail.com',
                'teacher_id': 'TMS/TCH/0016',
                'gender': 'Female',
                'department': 'Languages & Literature',
                'specialization': 'English Language & Literature in English',
                'subjects_taught': [
                    {'name': 'English Language', 'grade': 'SS 2'},
                    {'name': 'English Language', 'grade': 'SS 3'},
                    {'name': 'Literature in English', 'grade': 'SS 3'},
                ],
                'bio': 'Senior English Language and Literature in English educator for SS 2 and SS 3.'
            },
        ]

        for tr in teachers_roster:
            t_user = User.objects.filter(email=tr['email']).first()
            if not t_user:
                t_user = User.objects.create_user(
                    email=tr['email'],
                    password=tr['teacher_id'],
                    first_name=tr['first_name'],
                    last_name=tr['last_name'],
                    role=User.Role.TEACHER,
                    is_staff=True,
                )
            else:
                t_user.first_name = tr['first_name']
                t_user.last_name = tr['last_name']
                t_user.save()

            t_prof, _ = TeacherProfile.objects.get_or_create(user=t_user)
            t_prof.teacher_id = tr['teacher_id']
            t_prof.department = tr['department']
            t_prof.specialization = tr['specialization']
            t_prof.subjects_taught = tr['subjects_taught']
            t_prof.bio = tr['bio']
            t_prof.gender = tr['gender']
            t_prof.form_teacher_of = 'None'
            t_prof.save()

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

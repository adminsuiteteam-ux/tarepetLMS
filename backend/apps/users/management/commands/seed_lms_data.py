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

        # 2. Create / Reset Admin Superuser Account from Environment Variables
        import os
        adm_email = os.environ.get('ADMIN_EMAIL', 'admin@tarepetmontessorischool.com').strip().lower()
        adm_password = os.environ.get('ADMIN_PASSWORD', 'TarepetAdmin@2026!')

        adm_user = User.objects.filter(email=adm_email).first() or User.objects.filter(username=adm_email).first()
        if not adm_user:
            adm_user = User.objects.create_superuser(
                email=adm_email,
                password=adm_password,
                first_name='Super',
                last_name='Administrator',
                role=User.Role.ADMIN,
            )
        else:
            adm_user.set_password(adm_password)
            adm_user.is_staff = True
            adm_user.is_superuser = True
            adm_user.is_active = True
            adm_user.role = User.Role.ADMIN
            adm_user.save()
        AdminProfile.objects.get_or_create(user=adm_user, defaults={'role_type': 'Super Admin'})


        # 3. Seed Teachers from Official Paper Roster (Exact 19 Teachers)
        teachers_roster = [
            {
                'first_name': 'Ms. Allison',
                'last_name': 'Victoria',
                'email': 'allison.victoria@tarepet.com',
                'phone': '08062571566',
                'teacher_id': 'TMS/TCH/0001',
                'gender': 'Female',
                'department': 'Senior Secondary Section',
                'specialization': 'Senior Secondary Language Arts & English',
                'class_assigned': 'SS 1',
                'bio': 'Form Teacher for SS 1 guiding students in English Language and Senior Secondary curriculum.',
                'subjects_taught': [{'name': 'English Language', 'grade': 'SS 1'}]
            },
            {
                'first_name': 'Mrs. Timi',
                'last_name': 'Porbeni',
                'email': 'isaactimi16@gmail.com',
                'phone': '07068523730',
                'teacher_id': 'TMS/TCH/0002',
                'gender': 'Female',
                'department': 'Senior Secondary Humanities Department',
                'specialization': 'English Language & Literature in English (SS1, SS2, SS3)',
                'class_assigned': 'SS 2',
                'bio': 'Senior Instructor in English Language & Literature in English across SS 1, SS 2, and SS 3.',
                'subjects_taught': [{'name': 'English Language', 'grade': 'SS 2'}, {'name': 'Literature in English', 'grade': 'SS 2'}]
            },
            {
                'first_name': 'Samuel',
                'last_name': 'Hannah',
                'email': 'hannah.samuel@tarepet.com',
                'phone': '08062429432',
                'teacher_id': 'TMS/TCH/0003',
                'gender': 'Female',
                'department': 'Early Years & Vocational Studies',
                'specialization': 'Prevocational Studies (NUR - SS3) & Creche',
                'class_assigned': 'Creche',
                'bio': 'Form Educator for Creche and Prevocational Studies instructor from Nursery to SS 3.',
                'subjects_taught': [{'name': 'Prevocational Studies', 'grade': 'Primary 1'}]
            },
            {
                'first_name': 'Nwachukwu (O)',
                'last_name': 'Edirin',
                'email': 'edirin.nwachukwu@tarepet.com',
                'phone': '07032356176',
                'teacher_id': 'TMS/TCH/0004',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Primary 2 Curriculum & Basic Sciences',
                'class_assigned': 'Primary 2',
                'bio': 'Form Teacher for Primary 2 nurturing foundational literacy, numeracy, and science inquiry.',
                'subjects_taught': [{'name': 'Basic Science', 'grade': 'Primary 2'}]
            },
            {
                'first_name': 'Mrs. Ozichi Nwaudo',
                'last_name': 'Arinze',
                'email': 'ozichi.arinze@tarepet.com',
                'phone': '08067102216',
                'teacher_id': 'TMS/TCH/0005',
                'gender': 'Female',
                'department': 'Junior Secondary Section',
                'specialization': 'Mathematics (JSS 1)',
                'class_assigned': 'JSS 1',
                'bio': 'Form Teacher for JSS 1 and Junior Secondary Mathematics educator.',
                'subjects_taught': [{'name': 'Mathematics', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Ogbe',
                'last_name': 'Andrew',
                'email': 'ogbe.andrew@tarepet.com',
                'phone': '08020697680',
                'teacher_id': 'TMS/TCH/0006',
                'gender': 'Male',
                'department': 'Mathematics & Sciences Department',
                'specialization': 'Mathematics (Basic 4, SS 2)',
                'class_assigned': 'Basic 4',
                'bio': 'Form Teacher and Mathematics instructor for Basic 4 and Senior Secondary 2.',
                'subjects_taught': [{'name': 'Mathematics', 'grade': 'Basic 4'}]
            },
            {
                'first_name': 'Abiola Adeniyi',
                'last_name': 'Adegemo',
                'email': 'adeniyiabiola2@gmail.com',
                'phone': '08131251726',
                'teacher_id': 'TMS/TCH/0007',
                'gender': 'Male',
                'department': 'Physical & Commercial Sciences',
                'specialization': 'Physics (PRI - SS3) & Financial Accounting (JSS 1)',
                'class_assigned': 'Senior Science',
                'bio': 'Senior Physics instructor for Primary to SS 3 and Financial Accounting instructor for JSS 1.',
                'subjects_taught': [{'name': 'Physics', 'grade': 'SS 1'}]
            },
            {
                'first_name': 'Simeon Blessed',
                'last_name': 'Chigozie',
                'email': 'blessedsimeon6@gmail.com',
                'phone': '08146183309',
                'teacher_id': 'TMS/TCH/0008',
                'gender': 'Male',
                'department': 'Creative Arts & Music Department',
                'specialization': 'Music (JSS 1) & Basic 4 Curriculum',
                'class_assigned': 'JSS 1',
                'bio': 'Form Teacher and instructor for Music (JSS 1) and Basic 4 creative arts.',
                'subjects_taught': [{'name': 'Music', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Egufe B.',
                'last_name': 'Austin',
                'email': 'austin.egufe@tarepet.com',
                'phone': '08066154094',
                'teacher_id': 'TMS/TCH/0009',
                'gender': 'Male',
                'department': 'Vocational & Technical Studies',
                'specialization': 'Home Economics (JSS 1 - 3)',
                'class_assigned': 'JSS Vocational',
                'bio': 'Instructor for Home Economics across Junior Secondary classes (JSS 1 to JSS 3).',
                'subjects_taught': [{'name': 'Home Economics', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Oyiniki Anita',
                'last_name': 'Ojinbrakemi',
                'email': 'oyinkianita6@gmail.com',
                'phone': '08146183309',
                'teacher_id': 'TMS/TCH/0010',
                'gender': 'Female',
                'department': 'Junior Secondary Section',
                'specialization': 'English Language & Verbal Reasoning (JSS 3)',
                'class_assigned': 'JSS 3 Love',
                'bio': 'Form Teacher for JSS 3 Love and instructor in English Language & Verbal Reasoning.',
                'subjects_taught': [{'name': 'English Language', 'grade': 'JSS 3'}]
            },
            {
                'first_name': 'Mrs. Eze Chidubem',
                'last_name': 'Janneth',
                'email': 'ukachukwuchidubem223@gmail.com',
                'phone': '08142417833',
                'teacher_id': 'TMS/TCH/0011',
                'gender': 'Female',
                'department': 'Creative & Cultural Arts Department',
                'specialization': 'Fine Art & Creative Arts (JSS 1 - 3)',
                'class_assigned': 'JSS 2 Faith',
                'bio': 'Form Teacher for JSS 2 Faith and Fine Art instructor for JSS 1, JSS 2, and JSS 3.',
                'subjects_taught': [{'name': 'Fine Art', 'grade': 'JSS 2'}]
            },
            {
                'first_name': 'Agadaga',
                'last_name': 'Tari',
                'email': 'tari.agadaga@tarepet.com',
                'phone': '08065008494',
                'teacher_id': 'TMS/TCH/0012',
                'gender': 'Male',
                'department': 'Social Sciences Department',
                'specialization': 'Social Studies (SOS) & Civic Education (JSS 1 - 3)',
                'class_assigned': 'None',
                'bio': 'Instructor in Social Studies and Civic Education for Junior Secondary classes.',
                'subjects_taught': [{'name': 'Social Studies', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Amos',
                'last_name': 'Godspower',
                'email': 'amosgodspower360@mail.com',
                'phone': '07035339196',
                'teacher_id': 'TMS/TCH/0013',
                'gender': 'Male',
                'department': 'Business & Commercial Studies',
                'specialization': 'Business Studies (JSS 1 - 2) & Civic Education',
                'class_assigned': 'JSS 3 Faith',
                'bio': 'Form Teacher for JSS 3 Faith and Business Studies educator.',
                'subjects_taught': [{'name': 'Business Studies', 'grade': 'JSS 3'}]
            },
            {
                'first_name': 'Iwu',
                'last_name': 'Adanma',
                'email': 'iwu.adanma@tarepet.com',
                'phone': '08039341848',
                'teacher_id': 'TMS/TCH/0014',
                'gender': 'Female',
                'department': 'Senior Secondary Commercial Department',
                'specialization': 'Marketing & Commerce (SS 1 - 3)',
                'class_assigned': 'JSS 1 Faith',
                'bio': 'Form Teacher for JSS 1 Faith and Commerce & Marketing instructor for SS 1 to SS 3.',
                'subjects_taught': [{'name': 'Commerce', 'grade': 'SS 1'}]
            },
            {
                'first_name': 'Mr. Joseph',
                'last_name': 'Ekenebe',
                'email': 'joebleszekenebe@gmail.com',
                'phone': '08137183618',
                'teacher_id': 'TMS/TCH/0015',
                'gender': 'Male',
                'department': 'Senior Secondary Section',
                'specialization': 'Senior Secondary Studies (SS 1 - 3)',
                'class_assigned': 'SS 2 Grace',
                'bio': 'Form Teacher for SS 2 Grace and Senior Secondary educator.',
                'subjects_taught': [{'name': 'Senior Secondary Studies', 'grade': 'SS 2'}]
            },
            {
                'first_name': 'Goodluck',
                'last_name': 'Ufomba',
                'email': 'goodluckufomba2020@gmail.com',
                'phone': '08032288883',
                'teacher_id': 'TMS/TCH/0016',
                'gender': 'Male',
                'department': 'Mathematics & Sciences Department',
                'specialization': 'Mathematics (JSS 2 & SS 2)',
                'class_assigned': 'None',
                'bio': 'Mathematics instructor for Junior Secondary 2 and Senior Secondary 2.',
                'subjects_taught': [{'name': 'Mathematics', 'grade': 'SS 2'}]
            },
            {
                'first_name': 'Eli',
                'last_name': 'Idua',
                'email': 'eliidua@gmail.com',
                'phone': '08068583070',
                'teacher_id': 'TMS/TCH/0017',
                'gender': 'Male',
                'department': 'Mathematics & Quantitative Sciences',
                'specialization': 'Mathematics & Further Mathematics (JSS 3, SS 1, SS 2, SS 3)',
                'class_assigned': 'SS 1 Art',
                'bio': 'Form Teacher for SS 1 Art and Mathematics & Further Mathematics specialist.',
                'subjects_taught': [{'name': 'Mathematics', 'grade': 'SS 1'}, {'name': 'Further Mathematics', 'grade': 'SS 2'}]
            },
            {
                'first_name': 'Alex I.',
                'last_name': 'Akpokulokenei Maria',
                'email': 'alexakpobulokemi@gmail.com',
                'phone': '09066984417',
                'teacher_id': 'TMS/TCH/0018',
                'gender': 'Female',
                'department': 'Earth & Environmental Sciences',
                'specialization': 'Geography (SS 1 - 3)',
                'class_assigned': 'None',
                'bio': 'Senior Geography educator across Senior Secondary classes (SS 1 to SS 3).',
                'subjects_taught': [{'name': 'Geography', 'grade': 'SS 1'}]
            },
            {
                'first_name': 'Emmanuel U.',
                'last_name': 'Joseph',
                'email': 'joeugbede2024@gmail.com',
                'phone': '08021472342',
                'teacher_id': 'TMS/TCH/0019',
                'gender': 'Male',
                'department': 'Biological & Life Sciences',
                'specialization': 'Biology (SS 1 - 3)',
                'class_assigned': 'None',
                'bio': 'Senior Biology educator for Senior Secondary classes (SS 1 to SS 3).',
                'subjects_taught': [{'name': 'Biology', 'grade': 'SS 1'}, {'name': 'Biology', 'grade': 'SS 2'}, {'name': 'Biology', 'grade': 'SS 3'}]
            },
        ]

        # Prune any unlisted teacher profiles from the database
        allowed_emails = {tr['email'].lower() for tr in teachers_roster}
        for tp in TeacherProfile.objects.all():
            if tp.user.email.lower() not in allowed_emails:
                u = tp.user
                tp.delete()
                u.delete()
        for u in User.objects.filter(role=User.Role.TEACHER):
            if u.email.lower() not in allowed_emails:
                u.delete()

        # Variables to capture the first teacher for downstream use
        teacher_prof = None
        teacher_email = ''
        teacher_id_val = ''

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
            # Reassign any conflicting teacher profile that might already hold this ID
            conflicting_prof = TeacherProfile.objects.filter(teacher_id=tr['teacher_id']).exclude(pk=t_prof.pk).first()
            if conflicting_prof:
                conflicting_prof.teacher_id = f"TMS/TCH/TMP_{conflicting_prof.pk}"
                conflicting_prof.save(update_fields=['teacher_id'])

            t_prof.teacher_id = tr['teacher_id']
            t_prof.department = tr['department']
            t_prof.specialization = tr['specialization']
            t_prof.subjects_taught = tr['subjects_taught']
            t_prof.bio = tr['bio']
            t_prof.gender = tr['gender']
            t_prof.form_teacher_of = tr.get('class_assigned', 'None')
            t_prof.save()

            # Capture the first teacher's profile for Course FK and summary output
            if teacher_prof is None:
                teacher_prof = t_prof
                teacher_email = tr['email']
                teacher_id_val = tr['teacher_id']

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

        # 5. Clean up and purge any mock student accounts
        StudentProfile.objects.all().delete()
        User.objects.filter(role=User.Role.STUDENT).delete()
        User.objects.filter(email__in=[
            'civa.media@tarepet.com',
            'student@tarepet.com',
            'emeka.amadi@tarepet.com',
            'hacker@evil.com',
            'wronguser@fake.com',
            'chidinma.okoro@tarepet.com',
            'kelechi.eze@tarepet.com',
            'somto.nnamdi@tarepet.com',
            'tari.powei@tarepet.com',
        ]).delete()

        primary_student_prof = None

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
        if primary_student_prof:
            course.students.add(primary_student_prof)

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
        self.stdout.write(f'  - Students: 5 registered students seeded (e.g. emeka.amadi@tarepet.com, chidinma.okoro@tarepet.com)')
        self.stdout.write(f'  - Parent: {parent_email} (Pass: ParentPassword123!)')


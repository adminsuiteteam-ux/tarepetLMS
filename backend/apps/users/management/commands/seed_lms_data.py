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
        adm_password = os.environ.get('ADMIN_PASSWORD', 'ChangeMeInProd2026!')

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
                'first_name': 'Ms Allison',
                'last_name': 'Victoria',
                'email': 'allison.victoria@tarepet.com',
                'teacher_id': 'TMS/TCH/0060',
                'gender': 'Female',
                'department': 'Senior Secondary Section',
                'specialization': 'SS 1 Curriculum',
                'class_assigned': 'SS 1',
                'bio': 'Form Teacher for SS 1.',
                'subjects_taught': [{'name': 'Primary Literacy & Language Arts', 'grade': 'SS 1'}]
            },
            {
                'first_name': 'Timi',
                'last_name': 'Porbeni',
                'email': 'isaactimi16@gmail.com',
                'teacher_id': 'TMS/TCH/0016',
                'gender': 'Female',
                'department': 'Languages & Literature',
                'specialization': 'English Language & Literature in English (SS1-3)',
                'class_assigned': 'None',
                'bio': 'English Language and Literature in English educator for SS1 to SS3.',
                'subjects_taught': [{'name': 'English Language', 'grade': 'SS 1'}, {'name': 'Literature in English', 'grade': 'SS 1'}]
            },
            {
                'first_name': 'Samuel',
                'last_name': 'Ogah',
                'email': 'samuel.ogah@tarepet.com',
                'teacher_id': 'TMS/TCH/0070',
                'gender': 'Male',
                'department': 'Computer & ICT Department',
                'specialization': 'Coding (P1-SS2) & Digital Literacy (JSS1-3)',
                'class_assigned': 'None',
                'bio': 'Coding and Digital Literacy instructor.',
                'subjects_taught': [{'name': 'Computer Studies', 'grade': 'JSS 1'}, {'name': 'Coding', 'grade': 'Primary 1'}]
            },
            {
                'first_name': 'Nwachukwu (O)',
                'last_name': 'Edirin',
                'email': 'edirin.nwachukwu@tarepet.com',
                'teacher_id': 'TMS/TCH/0061',
                'gender': 'Female',
                'department': 'Senior Secondary Science Department',
                'specialization': 'Physics & Chemistry Education',
                'class_assigned': 'SS 2',
                'bio': 'Form Teacher for SS 2.',
                'subjects_taught': [{'name': 'Physics', 'grade': 'SS 2'}, {'name': 'Chemistry', 'grade': 'SS 2'}]
            },
            {
                'first_name': 'Ozichi Nwando',
                'last_name': 'Arinze',
                'email': 'ozichi.arinze@tarepet.com',
                'teacher_id': 'TMS/TCH/0062',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Basic 4 Mathematics',
                'class_assigned': 'Basic 4',
                'bio': 'Form Teacher for Basic 4.',
                'subjects_taught': [{'name': 'Mathematics', 'grade': 'Basic 4'}]
            },
            {
                'first_name': 'Ogbe',
                'last_name': 'Andrew',
                'email': 'ogbe.andrew@tarepet.com',
                'teacher_id': 'TMS/TCH/0063',
                'gender': 'Male',
                'department': 'Senior Secondary Humanities Department',
                'specialization': 'Literature in English & History',
                'class_assigned': 'SS 3',
                'bio': 'Form Teacher for SS 3.',
                'subjects_taught': [{'name': 'Literature in English', 'grade': 'SS 3'}, {'name': 'History', 'grade': 'SS 3'}]
            },
            {
                'first_name': 'Abiola Adeniyi',
                'last_name': 'Adeyemo',
                'email': 'adeniyiabiola2@gmail.com',
                'teacher_id': 'TMS/TCH/0017',
                'gender': 'Male',
                'department': 'Science Department',
                'specialization': 'Chemistry',
                'class_assigned': 'None',
                'bio': 'Chemistry specialist for SS 3.',
                'subjects_taught': [{'name': 'Chemistry', 'grade': 'SS 3'}]
            },
            {
                'first_name': 'Simeon Blessed',
                'last_name': 'Chigozie',
                'email': 'blessedsimeon6@gmail.com',
                'teacher_id': 'TMS/TCH/0019',
                'gender': 'Male',
                'department': 'Physics & Science Department',
                'specialization': 'Physics (JSS1-3 / SS1-3)',
                'class_assigned': 'SS 1 Love',
                'bio': 'Form Teacher for SS 1 Love and Physics educator.',
                'subjects_taught': [{'name': 'Physics', 'grade': 'SS 1'}, {'name': 'Basic Science', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Egbe B.',
                'last_name': 'Austin',
                'email': 'egbe.austin@tarepet.com',
                'teacher_id': 'TMS/TCH/0071',
                'gender': 'Male',
                'department': 'Physical Education Department',
                'specialization': 'JSS1-3 Physical & Health Education (PHE)',
                'class_assigned': 'None',
                'bio': 'Physical and Health Education instructor.',
                'subjects_taught': [{'name': 'Physical & Health Education', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Oyiniki Anita',
                'last_name': 'Ojinbrakemi',
                'email': 'oyinkianita6@gmail.com',
                'teacher_id': 'TMS/TCH/0026',
                'gender': 'Female',
                'department': 'Junior Secondary Section',
                'specialization': 'Home Economics & English Language (JSS 1-3)',
                'class_assigned': 'JSS 3 Love',
                'bio': 'Form Teacher for JSS 3 Love.',
                'subjects_taught': [{'name': 'Home Economics', 'grade': 'JSS 3'}, {'name': 'English Language', 'grade': 'JSS 3'}]
            },
            {
                'first_name': 'Jane Chidubem',
                'last_name': 'Eze',
                'email': 'ukachukwuchidubem223@gmail.com',
                'teacher_id': 'TMS/TCH/0044',
                'gender': 'Female',
                'department': 'Junior Secondary Section',
                'specialization': 'JSS 2 Faith & Business Studies',
                'class_assigned': 'JSS 2 Faith',
                'bio': 'Form Teacher for JSS 2 Faith.',
                'subjects_taught': [{'name': 'Business Studies', 'grade': 'JSS 2'}, {'name': 'Home Economics', 'grade': 'JSS 2'}]
            },
            {
                'first_name': 'Agadaga',
                'last_name': 'Tari',
                'email': 'agadaga.tari@tarepet.com',
                'teacher_id': 'TMS/TCH/0072',
                'gender': 'Male',
                'department': 'Creative & Fine Arts Department',
                'specialization': 'JSS 1-3 Fine Art',
                'class_assigned': 'None',
                'bio': 'Fine Art instructor across JSS 1 to JSS 3.',
                'subjects_taught': [{'name': 'Fine Art', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Amos',
                'last_name': 'Godspower',
                'email': 'amosgodspower360@mail.com',
                'teacher_id': 'TMS/TCH/0054',
                'gender': 'Male',
                'department': 'Social Sciences',
                'specialization': 'Social Studies / Civic Education (JSS 1-3)',
                'class_assigned': 'JSS 3 Faith',
                'bio': 'Form Teacher for JSS 3 Faith.',
                'subjects_taught': [{'name': 'Civic Education', 'grade': 'JSS 3'}, {'name': 'Social Studies', 'grade': 'JSS 3'}]
            },
            {
                'first_name': 'Iwu',
                'last_name': 'Adanma',
                'email': 'iwu.adanma@tarepet.com',
                'teacher_id': 'TMS/TCH/0064',
                'gender': 'Female',
                'department': 'Junior Secondary Section',
                'specialization': 'JSS 1-2 Business Studies',
                'class_assigned': 'JSS 1 Faith',
                'bio': 'Form Teacher for JSS 1 Faith.',
                'subjects_taught': [{'name': 'Business Studies', 'grade': 'JSS 1'}]
            },
            {
                'first_name': 'Joseph',
                'last_name': 'Ekenebe',
                'email': 'joebleszekenebe@gmail.com',
                'teacher_id': 'TMS/TCH/0043',
                'gender': 'Male',
                'department': 'Senior Secondary Section',
                'specialization': 'SS 1-3 Marketing & Entrepreneurship',
                'class_assigned': 'SS 2 Grace',
                'bio': 'Form Teacher for SS 2 Grace.',
                'subjects_taught': [{'name': 'Marketing', 'grade': 'SS 2'}, {'name': 'Entrepreneurship', 'grade': 'SS 2'}]
            },
            {
                'first_name': 'Goodluck',
                'last_name': 'Ufomba',
                'email': 'goodluckufomba2020@gmail.com',
                'teacher_id': 'TMS/TCH/0027',
                'gender': 'Male',
                'department': 'Mathematics Department',
                'specialization': 'Mathematics JSS 2 & SS 2',
                'class_assigned': 'None',
                'bio': 'Mathematics educator for JSS 2 and SS 2.',
                'subjects_taught': [{'name': 'Mathematics', 'grade': 'SS 2'}, {'name': 'Mathematics', 'grade': 'JSS 2'}]
            },
            {
                'first_name': 'Eli',
                'last_name': 'Idua',
                'email': 'eliidua@gmail.com',
                'teacher_id': 'TMS/TCH/0025',
                'gender': 'Male',
                'department': 'Mathematics Department',
                'specialization': 'Maths & Further Maths JSS 3, SS 2, SS 3',
                'class_assigned': 'None',
                'bio': 'Mathematics and Further Mathematics specialist.',
                'subjects_taught': [{'name': 'Mathematics', 'grade': 'SS 3'}, {'name': 'Further Mathematics', 'grade': 'SS 2'}]
            },
            {
                'first_name': 'Alex T.',
                'last_name': 'Akpobulokemi',
                'email': 'alexakpobulokemi@gmail.com',
                'teacher_id': 'TMS/TCH/0013',
                'gender': 'Male',
                'department': 'Geography & Environmental Sciences',
                'specialization': 'Geography SS 1 - SS 3',
                'class_assigned': 'None',
                'bio': 'Geography and Environmental Sciences instructor.',
                'subjects_taught': [{'name': 'Geography', 'grade': 'SS 1'}, {'name': 'Marine Geography', 'grade': 'SS 1'}]
            },
            {
                'first_name': 'Emmanuel U.',
                'last_name': 'Joseph',
                'email': 'joeugbede2024@gmail.com',
                'teacher_id': 'TMS/TCH/0022',
                'gender': 'Male',
                'department': 'Biological Sciences',
                'specialization': 'Biology SS 1 - SS 3',
                'class_assigned': 'None',
                'bio': 'Senior Biology specialist across SS 1 to SS 3.',
                'subjects_taught': [{'name': 'Biology', 'grade': 'SS 1'}, {'name': 'Biology', 'grade': 'SS 2'}, {'name': 'Biology', 'grade': 'SS 3'}]
            },
        ]

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
        self.stdout.write(f'  - Admin: {adm_email} (Pass: {adm_password})')
        self.stdout.write(f'  - Teacher: {teacher_email} (ID & Pass: {teacher_id_val})')
        self.stdout.write(f'  - Student: {student_email} (ID & Pass: {student_id_val})')
        self.stdout.write(f'  - Parent: {parent_email} (Pass: ParentPassword123!)')

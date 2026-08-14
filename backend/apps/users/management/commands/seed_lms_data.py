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
                'bio': 'Physics and Basic Science educator for Junior and Senior Secondary levels.',
                'class_assigned': 'SS 1 Love'
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
                'bio': 'Senior Mathematics & Further Mathematics specialist.',
                'class_assigned': 'SS 1 Art'
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
                'bio': 'Civic Education specialist across all Senior Secondary classes (SS1 - SS3).',
                'class_assigned': 'JSS 3 Faith'
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
                'bio': 'Senior Secondary faculty educator across SS 1, SS 2, and SS 3 classes.',
                'class_assigned': 'JSS 2 Love'
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
            {
                'first_name': 'Ngozi',
                'last_name': 'Okwor',
                'email': 'okworngozi@tarepet.com',
                'teacher_id': 'TMS/TCH/0057',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Primary 3 Curriculum & Pastoral Care',
                'class_assigned': 'Basic 3 Faith',
                'subjects_taught': [
                    {'name': 'All Subjects (Primary)', 'grade': 'Basic 3'},
                ],
                'bio': 'Form Teacher for Basic 3 Faith guiding pupil academic progress and character development.'
            },
            {
                'first_name': 'Faith',
                'last_name': 'Johnson',
                'email': 'johnsonhecter2019@gmail.com',
                'teacher_id': 'TMS/TCH/0015',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Primary 4 Curriculum & Pastoral Care',
                'class_assigned': 'Basic 4',
                'subjects_taught': [
                    {'name': 'All Subjects (Primary)', 'grade': 'Basic 4'},
                ],
                'bio': 'Form Teacher for Basic 4 overseeing student leadership and elementary syllabus.'
            },
            {
                'first_name': 'Glory',
                'last_name': 'Albert',
                'email': 'albertglory@gmail.com',
                'teacher_id': 'TMS/TCH/0038',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Primary 2 Curriculum & Pastoral Care',
                'class_assigned': 'Basic 2',
                'subjects_taught': [
                    {'name': 'All Subjects (Primary)', 'grade': 'Basic 2'},
                ],
                'bio': 'Form Teacher for Basic 2 focused on foundational numeracy and reading fluency.'
            },
            {
                'first_name': 'Tina',
                'last_name': 'Maku',
                'email': 'tinamaku@tarepet.com',
                'teacher_id': 'TMS/TCH/0058',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Primary 1 Grace Curriculum & Pastoral Care',
                'class_assigned': 'Basic 1 Grace',
                'subjects_taught': [
                    {'name': 'All Subjects (Primary)', 'grade': 'Basic 1'},
                ],
                'bio': 'Form Teacher for Basic 1 Grace facilitating early primary transition and active learning.'
            },
            {
                'first_name': 'Azibaolonami',
                'last_name': 'Wariboko',
                'email': 'aziwariboko@gmail.com',
                'teacher_id': 'TMS/TCH/0035',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Primary 1 Love Curriculum & Pastoral Care',
                'class_assigned': 'Basic 1 Love',
                'subjects_taught': [
                    {'name': 'All Subjects (Primary)', 'grade': 'Basic 1'},
                ],
                'bio': 'Form Teacher for Basic 1 Love nurturing young learners in literacy and character.'
            },
            {
                'first_name': 'Juliet',
                'last_name': 'Shedrack',
                'email': 'ogbenejuliet02@gmail.com',
                'teacher_id': 'TMS/TCH/0028',
                'gender': 'Female',
                'department': 'Primary Section',
                'specialization': 'Primary 5 Curriculum & Primary School Leaving Prep',
                'class_assigned': 'Basic 5',
                'subjects_taught': [
                    {'name': 'All Subjects (Primary)', 'grade': 'Basic 5'},
                ],
                'bio': 'Form Teacher for Basic 5 preparing senior primary pupils for secondary school entrance.'
            },
            {
                'first_name': 'Anita Oyinbrakemi',
                'last_name': 'Oyinki',
                'email': 'oyinkianita6@gmail.com',
                'teacher_id': 'TMS/TCH/0026',
                'gender': 'Female',
                'department': 'Junior Secondary Section',
                'specialization': 'Junior Secondary Academic & Examination Oversight',
                'class_assigned': 'JSS 3 Love',
                'subjects_taught': [
                    {'name': 'English Language', 'grade': 'JSS 3'},
                    {'name': 'Verbal Reasoning', 'grade': 'JSS 3'},
                ],
                'bio': 'Form Teacher for JSS 3 Love guiding final year junior secondary students to BECE excellence.'
            },
            {
                'first_name': 'Jane Chidubem',
                'last_name': 'Eze',
                'email': 'ukachukwuchidubem223@gmail.com',
                'teacher_id': 'TMS/TCH/0044',
                'gender': 'Female',
                'department': 'Junior Secondary Section',
                'specialization': 'Junior Secondary Academic & Pastoral Oversight',
                'class_assigned': 'JSS 2 Faith',
                'subjects_taught': [
                    {'name': 'Business Studies', 'grade': 'JSS 2'},
                    {'name': 'Home Economics', 'grade': 'JSS 2'},
                ],
                'bio': 'Form Teacher for JSS 2 Faith supporting students in character and academic growth.'
            },

            {
                'first_name': 'Agatha',
                'last_name': 'Joseph',
                'email': 'agathajoseph@gmail.com',
                'teacher_id': 'TMS/TCH/0037',
                'gender': 'Female',
                'department': 'Nursery & Early Childhood Department',
                'specialization': 'Early Years Montessori (All Subjects)',
                'class_assigned': 'Nursery 1',
                'subjects_taught': [
                    {'name': 'All Subjects (Early Years)', 'grade': 'Nursery 1'},
                    {'name': 'Numeracy & Shapes', 'grade': 'Nursery 1'},
                    {'name': 'Literacy & Phonics', 'grade': 'Nursery 1'},
                    {'name': 'Practical Life & Sensorial', 'grade': 'Nursery 1'},
                ],
                'bio': 'Nursery 1 Lead Educator specializing in Montessori foundational numeracy and phonics.'
            },
            {
                'first_name': 'Excellent A.',
                'last_name': 'Marvellous',
                'email': 'mexcellent78@gmail.com',
                'teacher_id': 'TMS/TCH/0030',
                'gender': 'Female',
                'department': 'Nursery & Early Childhood Department',
                'specialization': 'Early Years Montessori (All Subjects)',
                'class_assigned': 'Nursery 2',
                'subjects_taught': [
                    {'name': 'All Subjects (Early Years)', 'grade': 'Nursery 2'},
                    {'name': 'Numeracy & Arithmetic', 'grade': 'Nursery 2'},
                    {'name': 'Literacy & Phonics', 'grade': 'Nursery 2'},
                    {'name': 'Montessori Sensorial', 'grade': 'Nursery 2'},
                ],
                'bio': 'Nursery 2 Educator focused on experiential early learning and language development.'
            },
            {
                'first_name': 'Joy',
                'last_name': 'Pullah',
                'email': 'pullahjoy@tarepet.com',
                'teacher_id': 'TMS/TCH/0055',
                'gender': 'Female',
                'department': 'Creche & Reception Department',
                'specialization': 'Early Childhood & Toddler Care (All Subjects)',
                'class_assigned': 'Reception (Creche)',
                'subjects_taught': [
                    {'name': 'All Subjects (Reception / Creche)', 'grade': 'Reception'},
                    {'name': 'Sensorial & Motor Development', 'grade': 'Reception'},
                    {'name': 'Language & Rhymes', 'grade': 'Reception'},
                ],
                'bio': 'Reception & Creche Specialist nurturing toddler sensory exploration and communication.'
            },
            {
                'first_name': 'Ayibaiteimodei',
                'last_name': 'Godknows',
                'email': 'godknowsayibaiteimodei15@gmail.com',
                'teacher_id': 'TMS/TCH/0046',
                'gender': 'Female',
                'department': 'Nursery & Early Childhood Department',
                'specialization': 'Early Years Montessori (All Subjects)',
                'class_assigned': 'Nursery 2',
                'subjects_taught': [
                    {'name': 'All Subjects (Early Years)', 'grade': 'Nursery 2'},
                    {'name': 'Numeracy & Counting', 'grade': 'Nursery 2'},
                    {'name': 'Literacy & Handwriting', 'grade': 'Nursery 2'},
                ],
                'bio': 'Nursery 2 Classroom Educator dedicated to Montessori motor and cognitive development.'
            },
            {
                'first_name': 'Oviezibe',
                'last_name': 'Jude',
                'email': 'oviezibejude99@gmail.com',
                'teacher_id': 'TMS/TCH/0042',
                'gender': 'Female',
                'department': 'Nursery & Early Childhood Department',
                'specialization': 'Early Years Montessori (All Subjects)',
                'class_assigned': 'Nursery 1',
                'subjects_taught': [
                    {'name': 'All Subjects (Early Years)', 'grade': 'Nursery 1'},
                    {'name': 'Phonics & Speech', 'grade': 'Nursery 1'},
                    {'name': 'Numeracy & Logic', 'grade': 'Nursery 1'},
                ],
                'bio': 'Nursery 1 Educator with expertise in speech articulation and phonics readiness.'
            },
            {
                'first_name': 'Emmanuella',
                'last_name': 'Albert',
                'email': 'albertbogilizibe@gmail.com',
                'teacher_id': 'TMS/TCH/0020',
                'gender': 'Female',
                'department': 'Nursery & Early Childhood Department',
                'specialization': 'Early Years Montessori (All Subjects)',
                'class_assigned': 'Nursery 1',
                'subjects_taught': [
                    {'name': 'All Subjects (Early Years)', 'grade': 'Nursery 1'},
                    {'name': 'Early Montessori Science & Arts', 'grade': 'Nursery 1'},
                    {'name': 'Literacy & Rhymes', 'grade': 'Nursery 1'},
                ],
                'bio': 'Nursery 1 Creative Learning and Early Science Educator.'
            },
            {
                'first_name': 'Vivian',
                'last_name': 'Ugwuorah',
                'email': 'viviangariga@gmail.com',
                'teacher_id': 'TMS/TCH/0045',
                'gender': 'Female',
                'department': 'Advance Nursery & Transition Department',
                'specialization': 'Advance Nursery (Nursery 3 - All Subjects)',
                'class_assigned': 'Advance Nursery (Nursery 3)',
                'subjects_taught': [
                    {'name': 'All Subjects (Advance Nursery)', 'grade': 'Nursery 3'},
                    {'name': 'Advanced Numeracy & Mental Math', 'grade': 'Nursery 3'},
                    {'name': 'Advanced Literacy & Grammar', 'grade': 'Nursery 3'},
                    {'name': 'Basic Science & Nature Study', 'grade': 'Nursery 3'},
                ],
                'bio': 'Advance Nursery (Nursery 3) Specialist preparing pupils for seamless Primary 1 transition.'
            },
            {
                'first_name': 'Marian',
                'last_name': 'Ewaen',
                'email': 'ewaenmarian@gmail.com',
                'teacher_id': 'TMS/TCH/0041',
                'gender': 'Female',
                'department': 'Advance Nursery & Transition Department',
                'specialization': 'Advance Nursery (Nursery 3 - All Subjects)',
                'class_assigned': 'Advance Nursery (Nursery 3)',
                'subjects_taught': [
                    {'name': 'All Subjects (Advance Nursery)', 'grade': 'Nursery 3'},
                    {'name': 'Reading & Phonics Comprehension', 'grade': 'Nursery 3'},
                    {'name': 'Quantitative & Verbal Reasoning', 'grade': 'Nursery 3'},
                ],
                'bio': 'Advance Nursery (Nursery 3) Lead Teacher focused on literacy mastery and verbal reasoning.'
            },
            {
                'first_name': 'Deborah',
                'last_name': 'Eletu Sean',
                'email': 'deboraheletusean@tarepet.com',
                'teacher_id': 'TMS/TCH/0056',
                'gender': 'Female',
                'department': 'Creche & Reception Department',
                'specialization': 'Creche & Reception (All Subjects)',
                'class_assigned': 'Reception (Creche)',
                'subjects_taught': [
                    {'name': 'All Subjects (Reception / Creche)', 'grade': 'Reception'},
                    {'name': 'Sensorial & Cognitive Activities', 'grade': 'Reception'},
                    {'name': 'Early Montessori Social Skills', 'grade': 'Reception'},
                ],
                'bio': 'Reception & Creche Educator specialized in early sensory coordination and social development.'
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
            t_prof.form_teacher_of = tr.get('class_assigned', 'None')
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

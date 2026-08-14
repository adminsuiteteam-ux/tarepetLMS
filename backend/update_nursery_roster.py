import os
import django

os.environ['DATABASE_URL'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'db.sqlite3')}"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import CustomUser, TeacherProfile

nursery_roster = [
    {
        'first_name': 'Agatha',
        'last_name': 'Joseph',
        'email': 'agathajoseph@gmail.com',
        'teacher_id': 'TMS/TCH/0037',
        'gender': 'Female',
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Early Years Montessori (All Subjects)',
        'class_assigned': 'Nursery 1',
        'subs': [
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
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Early Years Montessori (All Subjects)',
        'class_assigned': 'Nursery 2',
        'subs': [
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
        'dept': 'Creche & Reception Department',
        'spec': 'Early Childhood & Toddler Care (All Subjects)',
        'class_assigned': 'Reception (Creche)',
        'subs': [
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
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Early Years Montessori (All Subjects)',
        'class_assigned': 'Nursery 2',
        'subs': [
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
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Early Years Montessori (All Subjects)',
        'class_assigned': 'Nursery 1',
        'subs': [
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
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Early Years Montessori (All Subjects)',
        'class_assigned': 'Nursery 1',
        'subs': [
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
        'dept': 'Advance Nursery & Transition Department',
        'spec': 'Advance Nursery (Nursery 3 - All Subjects)',
        'class_assigned': 'Advance Nursery (Nursery 3)',
        'subs': [
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
        'dept': 'Advance Nursery & Transition Department',
        'spec': 'Advance Nursery (Nursery 3 - All Subjects)',
        'class_assigned': 'Advance Nursery (Nursery 3)',
        'subs': [
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
        'dept': 'Creche & Reception Department',
        'spec': 'Creche & Reception (All Subjects)',
        'class_assigned': 'Reception (Creche)',
        'subs': [
            {'name': 'All Subjects (Reception / Creche)', 'grade': 'Reception'},
            {'name': 'Sensorial & Cognitive Activities', 'grade': 'Reception'},
            {'name': 'Early Montessori Social Skills', 'grade': 'Reception'},
        ],
        'bio': 'Reception & Creche Educator specialized in early sensory coordination and social development.'
    },
]

print("Updating Nursery / Early Years teachers in Django database...")
for r in nursery_roster:
    u = CustomUser.objects.filter(email=r['email']).first()
    if not u:
        u = CustomUser.objects.create_user(
            email=r['email'],
            password=r['teacher_id'],
            first_name=r['first_name'],
            last_name=r['last_name'],
            role='TEACHER',
            is_staff=True,
        )
    else:
        u.first_name = r['first_name']
        u.last_name = r['last_name']
        u.save()

    p, _ = TeacherProfile.objects.get_or_create(user=u)
    p.teacher_id = r['teacher_id']
    p.department = r['dept']
    p.specialization = r['spec']
    p.subjects_taught = r['subs']
    p.bio = r['bio']
    p.gender = r['gender']
    p.form_teacher_of = r['class_assigned']
    p.save()
    print(f"OK: {u.first_name} {u.last_name} ({u.email}) -> Class: {r['class_assigned']} -> {r['spec']}")

print("\nSuccessfully updated all 9 Nursery / Reception / Advance Nursery teachers in the database!")

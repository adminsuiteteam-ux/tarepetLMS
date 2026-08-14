import os
import django

os.environ['DATABASE_URL'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'db.sqlite3')}"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import CustomUser, TeacherProfile

form_teachers_roster = [
    {
        'first_name': 'Ngozi',
        'last_name': 'Okwor',
        'email': 'okworngozi@tarepet.com',
        'teacher_id': 'TMS/TCH/0057',
        'gender': 'Female',
        'form_class': 'Basic 3 Faith',
        'dept': 'Primary Section',
        'spec': 'Primary 3 Curriculum & Pastoral Care',
        'bio': 'Form Teacher for Basic 3 Faith guiding pupil academic progress and character development.'
    },
    {
        'first_name': 'Faith',
        'last_name': 'Johnson',
        'email': 'johnsonhecter2019@gmail.com',
        'teacher_id': 'TMS/TCH/0015',
        'gender': 'Female',
        'form_class': 'Basic 4',
        'dept': 'Primary Section',
        'spec': 'Primary 4 Curriculum & Pastoral Care',
        'bio': 'Form Teacher for Basic 4 overseeing student leadership and elementary syllabus.'
    },
    {
        'first_name': 'Glory',
        'last_name': 'Albert',
        'email': 'albertglory@gmail.com',
        'teacher_id': 'TMS/TCH/0038',
        'gender': 'Female',
        'form_class': 'Basic 2',
        'dept': 'Primary Section',
        'spec': 'Primary 2 Curriculum & Pastoral Care',
        'bio': 'Form Teacher for Basic 2 focused on foundational numeracy and reading fluency.'
    },
    {
        'first_name': 'Tina',
        'last_name': 'Maku',
        'email': 'tinamaku@tarepet.com',
        'teacher_id': 'TMS/TCH/0058',
        'gender': 'Female',
        'form_class': 'Basic 1 Grace',
        'dept': 'Primary Section',
        'spec': 'Primary 1 Grace Curriculum & Pastoral Care',
        'bio': 'Form Teacher for Basic 1 Grace facilitating early primary transition and active learning.'
    },
    {
        'first_name': 'Azibaolonami',
        'last_name': 'Wariboko',
        'email': 'aziwariboko@gmail.com',
        'teacher_id': 'TMS/TCH/0035',
        'gender': 'Female',
        'form_class': 'Basic 1 Love',
        'dept': 'Primary Section',
        'spec': 'Primary 1 Love Curriculum & Pastoral Care',
        'bio': 'Form Teacher for Basic 1 Love nurturing young learners in literacy and character.'
    },
    {
        'first_name': 'Joy',
        'last_name': 'Pullah',
        'email': 'pullahjoy@tarepet.com',
        'teacher_id': 'TMS/TCH/0055',
        'gender': 'Female',
        'form_class': 'Reception (Creche)',
        'dept': 'Creche & Reception Department',
        'spec': 'Early Childhood & Toddler Care',
        'bio': 'Form Educator for Reception & Creche nurturing toddler motor development and language.'
    },
    {
        'first_name': 'Excellent A.',
        'last_name': 'Marvellous',
        'email': 'mexcellent78@gmail.com',
        'teacher_id': 'TMS/TCH/0030',
        'gender': 'Female',
        'form_class': 'Nursery 2',
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Early Years Montessori Curriculum',
        'bio': 'Form Teacher for Nursery 2 championing sensorial exploration and early phonics.'
    },
    {
        'first_name': 'Juliet',
        'last_name': 'Shedrack',
        'email': 'ogbenejuliet02@gmail.com',
        'teacher_id': 'TMS/TCH/0028',
        'gender': 'Female',
        'form_class': 'Basic 5',
        'dept': 'Primary Section',
        'spec': 'Primary 5 Curriculum & Primary School Leaving Prep',
        'bio': 'Form Teacher for Basic 5 preparing senior primary pupils for secondary school entrance.'
    },
    {
        'first_name': 'Joseph',
        'last_name': 'Ekenebe',
        'email': 'joebleszekenebe@gmail.com',
        'teacher_id': 'TMS/TCH/0043',
        'gender': 'Male',
        'form_class': 'JSS 2 Love',
        'dept': 'Junior Secondary Section',
        'spec': 'Junior Secondary Academic & Pastoral Oversight',
        'bio': 'Form Teacher for JSS 2 Love mentoring junior secondary students.'
    },
    {
        'first_name': 'Simeon Blessed',
        'last_name': 'Chigozie',
        'email': 'blessedsimeon6@gmail.com',
        'teacher_id': 'TMS/TCH/0019',
        'gender': 'Male',
        'form_class': 'SS 1 Love',
        'dept': 'Senior Secondary Section',
        'spec': 'Physics, Science & Pastoral Oversight',
        'bio': 'Form Teacher for SS 1 Love guiding senior students in sciences and personal development.'
    },
    {
        'first_name': 'Eli',
        'last_name': 'Idua',
        'email': 'eliidua@gmail.com',
        'teacher_id': 'TMS/TCH/0025',
        'gender': 'Male',
        'form_class': 'SS 1 Art',
        'dept': 'Senior Secondary Section',
        'spec': 'Mathematics & Senior Pastoral Oversight',
        'bio': 'Form Teacher for SS 1 Art supporting students in academic excellence.'
    },
    {
        'first_name': 'Amos',
        'last_name': 'Godspower',
        'email': 'amosgodspower360@mail.com',
        'teacher_id': 'TMS/TCH/0054',
        'gender': 'Male',
        'form_class': 'JSS 3 Faith',
        'dept': 'Junior Secondary Section',
        'spec': 'Civic Education & BECE Examination Pastoral Oversight',
        'bio': 'Form Teacher for JSS 3 Faith preparing students for Junior WAEC / BECE examinations.'
    },
    {
        'first_name': 'Anita Oyinbrakemi',
        'last_name': 'Oyinki',
        'email': 'oyinkianita6@gmail.com',
        'teacher_id': 'TMS/TCH/0026',
        'gender': 'Female',
        'form_class': 'JSS 3 Love',
        'dept': 'Junior Secondary Section',
        'spec': 'Junior Secondary Academic & Examination Oversight',
        'bio': 'Form Teacher for JSS 3 Love guiding final year junior secondary students.'
    },
    {
        'first_name': 'Marian',
        'last_name': 'Ewaen',
        'email': 'ewaenmarian@gmail.com',
        'teacher_id': 'TMS/TCH/0041',
        'gender': 'Female',
        'form_class': 'Advance Nursery (Nursery 3)',
        'dept': 'Advance Nursery & Transition Department',
        'spec': 'Advance Nursery Transition & Literacy',
        'bio': 'Form Teacher for Advance Nursery (Nursery 3) facilitating readiness for Primary 1.'
    },
    {
        'first_name': 'Oviezibe',
        'last_name': 'Jude',
        'email': 'oviezibejude99@gmail.com',
        'teacher_id': 'TMS/TCH/0042',
        'gender': 'Female',
        'form_class': 'Nursery 1',
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Nursery 1 Montessori Curriculum',
        'bio': 'Form Teacher for Nursery 1 fostering phonics awareness and social confidence.'
    },
    {
        'first_name': 'Jane Chidubem',
        'last_name': 'Eze',
        'email': 'ukachukwuchidubem223@gmail.com',
        'teacher_id': 'TMS/TCH/0044',
        'gender': 'Female',
        'form_class': 'JSS 2 Faith',
        'dept': 'Junior Secondary Section',
        'spec': 'Junior Secondary Academic & Pastoral Oversight',
        'bio': 'Form Teacher for JSS 2 Faith supporting students in character and academic growth.'
    },
    {
        'first_name': 'Agatha',
        'last_name': 'Joseph',
        'email': 'agathajoseph@gmail.com',
        'teacher_id': 'TMS/TCH/0037',
        'gender': 'Female',
        'form_class': 'Nursery 1',
        'dept': 'Nursery & Early Childhood Department',
        'spec': 'Nursery 1 Montessori Foundation',
        'bio': 'Form Teacher for Nursery 1 dedicated to early childhood learning milestones.'
    },
]

print("Updating official Form Teachers in Django database...")
for r in form_teachers_roster:
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
    p.bio = r['bio']
    p.gender = r['gender']
    p.form_teacher_of = r['form_class']
    p.save()
    print(f"OK: {u.first_name} {u.last_name} ({u.email}) -> Form Teacher of: {p.form_teacher_of}")

print("\nSuccessfully updated all 17 Form Teachers in the database!")

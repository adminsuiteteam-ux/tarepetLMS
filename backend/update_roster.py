import os
import django
from django.conf import settings

if 'DATABASE_URL' not in os.environ:
    os.environ['DATABASE_URL'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'db.sqlite3')}"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import CustomUser, TeacherProfile

roster = [
    {
        'first_name': 'Simeon Blessed',
        'last_name': 'Chigozie',
        'email': 'blessedsimeon6@gmail.com',
        'gender': 'Male',
        'dept': 'Physics & Science Department',
        'spec': 'Physics & Basic Science',
        'subs': [
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
        'gender': 'Male',
        'dept': 'Mathematics Department',
        'spec': 'Mathematics & Further Mathematics',
        'subs': [
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
        'gender': 'Male',
        'dept': 'Social Sciences',
        'spec': 'Civic Education',
        'subs': [
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
        'gender': 'Male',
        'dept': 'Mathematics Department',
        'spec': 'Mathematics',
        'subs': [
            {'name': 'Mathematics', 'grade': 'SS 2'},
        ],
        'bio': 'Mathematics educator handling SS 2 curriculum.'
    },
    {
        'first_name': 'Alfred-Eto',
        'last_name': 'Eluan',
        'email': 'alfredetoeluan16@gmail.com',
        'gender': 'Male',
        'dept': 'Science Department',
        'spec': 'Chemistry',
        'subs': [
            {'name': 'Chemistry', 'grade': 'SS 2'},
            {'name': 'Chemistry', 'grade': 'SS 3'},
        ],
        'bio': 'Senior Chemistry specialist for SS 2 and SS 3.'
    },
    {
        'first_name': 'Abiola Adeniyi',
        'last_name': 'Adeyemo',
        'email': 'adeniyiabiola2@gmail.com',
        'gender': 'Male',
        'dept': 'Science Department',
        'spec': 'Chemistry',
        'subs': [
            {'name': 'Chemistry', 'grade': 'SS 1'},
        ],
        'bio': 'Chemistry educator for Senior Secondary 1 (SS1).'
    },
    {
        'first_name': 'Emmanuel',
        'last_name': 'Joseph',
        'email': 'joeugbede2024@gmail.com',
        'gender': 'Male',
        'dept': 'Biological Sciences',
        'spec': 'Biology',
        'subs': [
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
        'gender': 'Male',
        'dept': 'Geography & Environmental Sciences',
        'spec': 'Geography & Marine Geography',
        'subs': [
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
        'gender': 'Male',
        'dept': 'Senior Secondary Studies',
        'spec': 'Senior Secondary Studies',
        'subs': [
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
        'gender': 'Female',
        'dept': 'Languages & Literature',
        'spec': 'English Language & Literature in English',
        'subs': [
            {'name': 'English Language', 'grade': 'SS 2'},
            {'name': 'English Language', 'grade': 'SS 3'},
            {'name': 'Literature in English', 'grade': 'SS 3'},
        ],
        'bio': 'Senior English Language and Literature in English educator for SS 2 and SS 3.'
    },
]

print("Updating teachers in Django database...")
for r in roster:
    u = CustomUser.objects.filter(email=r['email']).first()
    if not u:
        u = CustomUser.objects.create_user(
            email=r['email'],
            password='TeacherPassword123!',
            first_name=r['first_name'],
            last_name=r['last_name'],
            role='TEACHER'
        )
    else:
        u.first_name = r['first_name']
        u.last_name = r['last_name']
        u.save()
    p, _ = TeacherProfile.objects.get_or_create(user=u)
    p.department = r['dept']
    p.specialization = r['spec']
    p.subjects_taught = r['subs']
    p.bio = r['bio']
    p.gender = r['gender']
    p.form_teacher_of = 'None'
    p.save()
    print(f"OK: {u.first_name} {u.last_name} ({u.email}) -> Specialization: {p.specialization} -> {len(p.subjects_taught)} classes/subjects")

print("\nSuccessfully updated all 10 teacher assignments in database!")

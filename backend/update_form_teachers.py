import os
import django

if 'DATABASE_URL' not in os.environ:
    os.environ['DATABASE_URL'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'db.sqlite3')}"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import CustomUser, TeacherProfile

OFFICIAL_19_TEACHERS = [
    {
        'first_name': 'Ms. Allison',
        'last_name': 'Victoria',
        'email': 'allison.victoria@tarepet.com',
        'phone': '08062571566',
        'teacher_id': 'TMS/TCH/0060',
        'gender': 'Female',
        'form_class': 'SS 1',
        'dept': 'Senior Secondary Section',
        'spec': 'Senior Secondary Language Arts & English',
        'bio': 'Form Teacher for SS 1 guiding students in English Language and Senior Secondary curriculum.'
    },
    {
        'first_name': 'Mrs. Timi',
        'last_name': 'Porbeni',
        'email': 'isaactimi16@gmail.com',
        'phone': '07068523730',
        'teacher_id': 'TMS/TCH/0016',
        'gender': 'Female',
        'form_class': 'SS 2',
        'dept': 'Senior Secondary Humanities Department',
        'spec': 'English Language & Literature in English (SS1, SS2, SS3)',
        'bio': 'Senior Instructor in English Language & Literature in English across SS 1, SS 2, and SS 3.'
    },
    {
        'first_name': 'Samuel',
        'last_name': 'Hannah',
        'email': 'hannah.samuel@tarepet.com',
        'phone': '08062429432',
        'teacher_id': 'TMS/TCH/0070',
        'gender': 'Female',
        'form_class': 'Creche',
        'dept': 'Early Years & Vocational Studies',
        'spec': 'Prevocational Studies (NUR - SS3) & Creche',
        'bio': 'Form Educator for Creche and Prevocational Studies instructor from Nursery to SS 3.'
    },
    {
        'first_name': 'Nwachukwu (O)',
        'last_name': 'Edirin',
        'email': 'edirin.nwachukwu@tarepet.com',
        'phone': '07032356176',
        'teacher_id': 'TMS/TCH/0061',
        'gender': 'Female',
        'form_class': 'Primary 2',
        'dept': 'Primary Section',
        'spec': 'Primary 2 Curriculum & Basic Sciences',
        'bio': 'Form Teacher for Primary 2 nurturing foundational literacy, numeracy, and science inquiry.'
    },
    {
        'first_name': 'Mrs. Ozichi Nwaudo',
        'last_name': 'Arinze',
        'email': 'ozichi.arinze@tarepet.com',
        'phone': '08067102216',
        'teacher_id': 'TMS/TCH/0062',
        'gender': 'Female',
        'form_class': 'JSS 1',
        'dept': 'Junior Secondary Section',
        'spec': 'Mathematics (JSS 1)',
        'bio': 'Form Teacher for JSS 1 and Junior Secondary Mathematics educator.'
    },
    {
        'first_name': 'Ogbe',
        'last_name': 'Andrew',
        'email': 'ogbe.andrew@tarepet.com',
        'phone': '08020697680',
        'teacher_id': 'TMS/TCH/0063',
        'gender': 'Male',
        'form_class': 'Basic 4',
        'dept': 'Mathematics & Sciences Department',
        'spec': 'Mathematics (Basic 4, SS 2)',
        'bio': 'Form Teacher and Mathematics instructor for Basic 4 and Senior Secondary 2.'
    },
    {
        'first_name': 'Abiola Adeniyi',
        'last_name': 'Adegemo',
        'email': 'adeniyiabiola2@gmail.com',
        'phone': '08131251726',
        'teacher_id': 'TMS/TCH/0017',
        'gender': 'Male',
        'form_class': 'Senior Science',
        'dept': 'Physical & Commercial Sciences',
        'spec': 'Physics (PRI - SS3) & Financial Accounting (JSS 1)',
        'bio': 'Senior Physics instructor for Primary to SS 3 and Financial Accounting instructor for JSS 1.'
    },
    {
        'first_name': 'Simeon Blessed',
        'last_name': 'Chigozie',
        'email': 'blessedsimeon6@gmail.com',
        'phone': '08146183309',
        'teacher_id': 'TMS/TCH/0019',
        'gender': 'Male',
        'form_class': 'JSS 1',
        'dept': 'Creative Arts & Music Department',
        'spec': 'Music (JSS 1) & Basic 4 Curriculum',
        'bio': 'Form Teacher and instructor for Music (JSS 1) and Basic 4 creative arts.'
    },
    {
        'first_name': 'Egufe B.',
        'last_name': 'Austin',
        'email': 'austin.egufe@tarepet.com',
        'phone': '08066154094',
        'teacher_id': 'TMS/TCH/0071',
        'gender': 'Male',
        'form_class': 'JSS Vocational',
        'dept': 'Vocational & Technical Studies',
        'spec': 'Home Economics (JSS 1 - 3)',
        'bio': 'Instructor for Home Economics across Junior Secondary classes (JSS 1 to JSS 3).'
    },
    {
        'first_name': 'Oyiniki Anita',
        'last_name': 'Ojinbrakemi',
        'email': 'oyinkianita6@gmail.com',
        'phone': '08146183309',
        'teacher_id': 'TMS/TCH/0026',
        'gender': 'Female',
        'form_class': 'JSS 3 Love',
        'dept': 'Junior Secondary Section',
        'spec': 'English Language & Verbal Reasoning (JSS 3)',
        'bio': 'Form Teacher for JSS 3 Love and instructor in English Language & Verbal Reasoning.'
    },
    {
        'first_name': 'Mrs. Eze Chidubem',
        'last_name': 'Janneth',
        'email': 'ukachukwuchidubem223@gmail.com',
        'phone': '08142417833',
        'teacher_id': 'TMS/TCH/0044',
        'gender': 'Female',
        'form_class': 'JSS 2 Faith',
        'dept': 'Creative & Cultural Arts Department',
        'spec': 'Fine Art & Creative Arts (JSS 1 - 3)',
        'bio': 'Form Teacher for JSS 2 Faith and Fine Art instructor for JSS 1, JSS 2, and JSS 3.'
    },
    {
        'first_name': 'Agadaga',
        'last_name': 'Tari',
        'email': 'tari.agadaga@tarepet.com',
        'phone': '08065008494',
        'teacher_id': 'TMS/TCH/0072',
        'gender': 'Male',
        'form_class': 'None',
        'dept': 'Social Sciences Department',
        'spec': 'Social Studies (SOS) & Civic Education (JSS 1 - 3)',
        'bio': 'Instructor in Social Studies and Civic Education for Junior Secondary classes.'
    },
    {
        'first_name': 'Amos',
        'last_name': 'Godspower',
        'email': 'amosgodspower360@mail.com',
        'phone': '07035339196',
        'teacher_id': 'TMS/TCH/0054',
        'gender': 'Male',
        'form_class': 'JSS 3 Faith',
        'dept': 'Business & Commercial Studies',
        'spec': 'Business Studies (JSS 1 - 2) & Civic Education',
        'bio': 'Form Teacher for JSS 3 Faith and Business Studies educator.'
    },
    {
        'first_name': 'Iwu',
        'last_name': 'Adanma',
        'email': 'iwu.adanma@tarepet.com',
        'phone': '08039341848',
        'teacher_id': 'TMS/TCH/0064',
        'gender': 'Female',
        'form_class': 'JSS 1 Faith',
        'dept': 'Senior Secondary Commercial Department',
        'spec': 'Marketing & Commerce (SS 1 - 3)',
        'bio': 'Form Teacher for JSS 1 Faith and Commerce & Marketing instructor for SS 1 to SS 3.'
    },
    {
        'first_name': 'Mr. Joseph',
        'last_name': 'Ekenebe',
        'email': 'joebleszekenebe@gmail.com',
        'phone': '08137183618',
        'teacher_id': 'TMS/TCH/0043',
        'gender': 'Male',
        'form_class': 'SS 2 Grace',
        'dept': 'Senior Secondary Section',
        'spec': 'Senior Secondary Studies (SS 1 - 3)',
        'bio': 'Form Teacher for SS 2 Grace and Senior Secondary educator.'
    },
    {
        'first_name': 'Goodluck',
        'last_name': 'Ufomba',
        'email': 'goodluckufomba2020@gmail.com',
        'phone': '08032288883',
        'teacher_id': 'TMS/TCH/0027',
        'gender': 'Male',
        'form_class': 'None',
        'dept': 'Mathematics & Sciences Department',
        'spec': 'Mathematics (JSS 2 & SS 2)',
        'bio': 'Mathematics instructor for Junior Secondary 2 and Senior Secondary 2.'
    },
    {
        'first_name': 'Eli',
        'last_name': 'Idua',
        'email': 'eliidua@gmail.com',
        'phone': '08068583070',
        'teacher_id': 'TMS/TCH/0025',
        'gender': 'Male',
        'form_class': 'SS 1 Art',
        'dept': 'Mathematics & Quantitative Sciences',
        'spec': 'Mathematics & Further Mathematics (JSS 3, SS 1, SS 2, SS 3)',
        'bio': 'Form Teacher for SS 1 Art and Mathematics & Further Mathematics specialist.'
    },
    {
        'first_name': 'Alex I.',
        'last_name': 'Akpokulokenei Maria',
        'email': 'alexakpobulokemi@gmail.com',
        'phone': '09066984417',
        'teacher_id': 'TMS/TCH/0013',
        'gender': 'Female',
        'form_class': 'None',
        'dept': 'Earth & Environmental Sciences',
        'spec': 'Geography (SS 1 - 3)',
        'bio': 'Senior Geography educator across Senior Secondary classes (SS 1 to SS 3).'
    },
    {
        'first_name': 'Emmanuel U.',
        'last_name': 'Joseph',
        'email': 'joeugbede2024@gmail.com',
        'phone': '08021472342',
        'teacher_id': 'TMS/TCH/0022',
        'gender': 'Male',
        'form_class': 'None',
        'dept': 'Biological & Life Sciences',
        'spec': 'Biology (SS 1 - 3)',
        'bio': 'Senior Biology educator for Senior Secondary classes (SS 1 to SS 3).'
    },
    {
        'first_name': 'Covenantzanadu',
        'last_name': 'Uzor',
        'email': 'covenant.uzor@tarepet.com',
        'phone': '08035567890',
        'teacher_id': 'TMS/TCH/0024',
        'gender': 'Male',
        'form_class': 'None',
        'dept': 'Academic Staff',
        'spec': 'General Studies & Science',
        'bio': 'Educator in General Studies & Science.'
    },
]

allowed_emails = {t['email'].lower() for t in OFFICIAL_19_TEACHERS}

# Step 1: Prune unlisted
for t in CustomUser.objects.filter(role='TEACHER'):
    if t.email.lower() not in allowed_emails:
        t.delete()

# Step 2: Create or update 19 teachers
for r in OFFICIAL_19_TEACHERS:
    u = CustomUser.objects.filter(email__iexact=r['email']).first()
    if not u:
        u = CustomUser.objects.create_user(
            email=r['email'],
            password=r['teacher_id'],
            first_name=r['first_name'],
            last_name=r['last_name'],
            phone=r['phone'],
            role='TEACHER',
            is_staff=True,
        )
    else:
        u.first_name = r['first_name']
        u.last_name = r['last_name']
        u.phone = r['phone']
        u.role = 'TEACHER'
        u.is_staff = True
        u.save()

    p, _ = TeacherProfile.objects.get_or_create(user=u)
    p.teacher_id = r['teacher_id']
    p.department = r['dept']
    p.specialization = r['spec']
    p.bio = r['bio']
    p.gender = r['gender']
    p.form_teacher_of = r['form_class']
    p.save()

print(f"OK: Exactly {CustomUser.objects.filter(role='TEACHER').count()} official teachers synced.")

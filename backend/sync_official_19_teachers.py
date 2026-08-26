import os
import django

if 'DATABASE_URL' not in os.environ:
    os.environ['DATABASE_URL'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'db.sqlite3')}"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import CustomUser, TeacherProfile

OFFICIAL_TEACHERS = [
    {
        'teacher_id': 'TMS/TCH/0060',
        'name': 'Ms. Allison Victoria',
        'email': 'allison.victoria@tarepet.com',
        'phone': '08062571566',
        'gender': 'Female',
        'department': 'Senior Secondary Section',
        'specialization': 'Senior Secondary Language Arts & English',
        'subjects': [{'name': 'English Language', 'grade': 'SS 1'}],
        'form_teacher_of': 'SS 1'
    },
    {
        'teacher_id': 'TMS/TCH/0016',
        'name': 'Mrs. Timi Porbeni',
        'email': 'isaactimi16@gmail.com',
        'phone': '07068523730',
        'gender': 'Female',
        'department': 'Senior Secondary Humanities Department',
        'specialization': 'English Language & Literature in English (SS1, SS2, SS3)',
        'subjects': [{'name': 'English Language', 'grade': 'SS 2'}, {'name': 'Literature in English', 'grade': 'SS 2'}, {'name': 'English Language', 'grade': 'SS 3'}, {'name': 'Literature in English', 'grade': 'SS 3'}],
        'form_teacher_of': 'SS 2'
    },
    {
        'teacher_id': 'TMS/TCH/0070',
        'name': 'Samuel Hannah',
        'email': 'hannah.samuel@tarepet.com',
        'phone': '08062429432',
        'gender': 'Female',
        'department': 'Early Years & Vocational Studies',
        'specialization': 'Prevocational Studies (NUR - SS3) & Creche',
        'subjects': [{'name': 'Prevocational Studies', 'grade': 'Primary 1'}],
        'form_teacher_of': 'Creche'
    },
    {
        'teacher_id': 'TMS/TCH/0061',
        'name': 'Nwachukwu (O) Edirin',
        'email': 'edirin.nwachukwu@tarepet.com',
        'phone': '07032356176',
        'gender': 'Female',
        'department': 'Primary Section',
        'specialization': 'Primary 2 Curriculum & Basic Sciences',
        'subjects': [{'name': 'Basic Science', 'grade': 'Primary 2'}],
        'form_teacher_of': 'Primary 2'
    },
    {
        'teacher_id': 'TMS/TCH/0062',
        'name': 'Mrs. Ozichi Nwaudo Arinze',
        'email': 'ozichi.arinze@tarepet.com',
        'phone': '08067102216',
        'gender': 'Female',
        'department': 'Junior Secondary Section',
        'specialization': 'Mathematics (JSS 1)',
        'subjects': [{'name': 'Mathematics', 'grade': 'JSS 1'}],
        'form_teacher_of': 'JSS 1'
    },
    {
        'teacher_id': 'TMS/TCH/0063',
        'name': 'Ogbe Andrew',
        'email': 'ogbe.andrew@tarepet.com',
        'phone': '08020697680',
        'gender': 'Male',
        'department': 'Mathematics & Sciences Department',
        'specialization': 'Mathematics (Basic 4, SS 2)',
        'subjects': [{'name': 'Mathematics', 'grade': 'Basic 4'}],
        'form_teacher_of': 'Basic 4'
    },
    {
        'teacher_id': 'TMS/TCH/0017',
        'name': 'Abiola Adeniyi Adegemo',
        'email': 'adeniyiabiola2@gmail.com',
        'phone': '08131251726',
        'gender': 'Male',
        'department': 'Physical & Commercial Sciences',
        'specialization': 'Physics (PRI - SS3) & Financial Accounting (JSS 1)',
        'subjects': [{'name': 'Physics', 'grade': 'SS 1'}],
        'form_teacher_of': 'Senior Science'
    },
    {
        'teacher_id': 'TMS/TCH/0019',
        'name': 'Simeon Blessed Chigozie',
        'email': 'blessedsimeon6@gmail.com',
        'phone': '08146183309',
        'gender': 'Male',
        'department': 'Creative Arts & Music Department',
        'specialization': 'Music (JSS 1) & Basic 4 Curriculum',
        'subjects': [{'name': 'Music', 'grade': 'JSS 1'}],
        'form_teacher_of': 'JSS 1'
    },
    {
        'teacher_id': 'TMS/TCH/0071',
        'name': 'Egufe B. Austin',
        'email': 'austin.egufe@tarepet.com',
        'phone': '08066154094',
        'gender': 'Male',
        'department': 'Vocational & Technical Studies',
        'specialization': 'Home Economics (JSS 1 - 3)',
        'subjects': [{'name': 'Home Economics', 'grade': 'JSS 1'}],
        'form_teacher_of': 'JSS Vocational'
    },
    {
        'teacher_id': 'TMS/TCH/0026',
        'name': 'Oyiniki Anita Ojinbrakemi',
        'email': 'oyinkianita6@gmail.com',
        'phone': '08146183309',
        'gender': 'Female',
        'department': 'Junior Secondary Section',
        'specialization': 'English Language & Verbal Reasoning (JSS 3)',
        'subjects': [{'name': 'English Language', 'grade': 'JSS 3'}],
        'form_teacher_of': 'JSS 3 Love'
    },
    {
        'teacher_id': 'TMS/TCH/0044',
        'name': 'Mrs. Eze Chidubem Janneth',
        'email': 'ukachukwuchidubem223@gmail.com',
        'phone': '08142417833',
        'gender': 'Female',
        'department': 'Creative & Cultural Arts Department',
        'specialization': 'Fine Art & Creative Arts (JSS 1 - 3)',
        'subjects': [{'name': 'Fine Art', 'grade': 'JSS 2'}],
        'form_teacher_of': 'JSS 2 Faith'
    },
    {
        'teacher_id': 'TMS/TCH/0072',
        'name': 'Agadaga Tari',
        'email': 'tari.agadaga@tarepet.com',
        'phone': '08065008494',
        'gender': 'Male',
        'department': 'Social Sciences Department',
        'specialization': 'Social Studies (SOS) & Civic Education (JSS 1 - 3)',
        'subjects': [{'name': 'Social Studies', 'grade': 'JSS 1'}],
        'form_teacher_of': 'None'
    },
    {
        'teacher_id': 'TMS/TCH/0054',
        'name': 'Amos Godspower',
        'email': 'amosgodspower360@mail.com',
        'phone': '07035339196',
        'gender': 'Male',
        'department': 'Business & Commercial Studies',
        'specialization': 'Business Studies (JSS 1 - 2) & Civic Education',
        'subjects': [{'name': 'Business Studies', 'grade': 'JSS 3'}],
        'form_teacher_of': 'JSS 3 Faith'
    },
    {
        'teacher_id': 'TMS/TCH/0064',
        'name': 'Iwu Adanma',
        'email': 'iwu.adanma@tarepet.com',
        'phone': '08039341848',
        'gender': 'Female',
        'department': 'Senior Secondary Commercial Department',
        'specialization': 'Marketing & Commerce (SS 1 - 3)',
        'subjects': [{'name': 'Commerce', 'grade': 'SS 1'}],
        'form_teacher_of': 'JSS 1 Faith'
    },
    {
        'teacher_id': 'TMS/TCH/0043',
        'name': 'Mr. Joseph Ekenebe',
        'email': 'joebleszekenebe@gmail.com',
        'phone': '08137183618',
        'gender': 'Male',
        'department': 'Senior Secondary Section',
        'specialization': 'Senior Secondary Studies (SS 1 - 3)',
        'subjects': [{'name': 'Senior Secondary Studies', 'grade': 'SS 2'}],
        'form_teacher_of': 'SS 2 Grace'
    },
    {
        'teacher_id': 'TMS/TCH/0027',
        'name': 'Goodluck Ufomba',
        'email': 'goodluckufomba2020@gmail.com',
        'phone': '08032288883',
        'gender': 'Male',
        'department': 'Mathematics & Sciences Department',
        'specialization': 'Mathematics (JSS 2 & SS 2)',
        'subjects': [{'name': 'Mathematics', 'grade': 'SS 2'}],
        'form_teacher_of': 'None'
    },
    {
        'teacher_id': 'TMS/TCH/0025',
        'name': 'Eli Idua',
        'email': 'eliidua@gmail.com',
        'phone': '08068583070',
        'gender': 'Male',
        'department': 'Mathematics & Quantitative Sciences',
        'specialization': 'Mathematics & Further Mathematics (JSS 3, SS 1, SS 2, SS 3)',
        'subjects': [{'name': 'Mathematics', 'grade': 'SS 1'}, {'name': 'Further Mathematics', 'grade': 'SS 2'}],
        'form_teacher_of': 'SS 1 Art'
    },
    {
        'teacher_id': 'TMS/TCH/0013',
        'name': 'Alex I. Akpokulokenei Maria',
        'email': 'alexakpobulokemi@gmail.com',
        'phone': '09066984417',
        'gender': 'Female',
        'department': 'Earth & Environmental Sciences',
        'specialization': 'Geography (SS 1 - 3)',
        'subjects': [{'name': 'Geography', 'grade': 'SS 1'}],
        'form_teacher_of': 'None'
    },
    {
        'teacher_id': 'TMS/TCH/0022',
        'name': 'Emmanuel U. Joseph',
        'email': 'joeugbede2024@gmail.com',
        'phone': '08021472342',
        'gender': 'Male',
        'department': 'Biological & Life Sciences',
        'specialization': 'Biology (SS 1 - 3)',
        'subjects': [{'name': 'Biology', 'grade': 'SS 1'}, {'name': 'Biology', 'grade': 'SS 2'}, {'name': 'Biology', 'grade': 'SS 3'}],
        'form_teacher_of': 'None'
    },
    {
        'teacher_id': 'TMS/TCH/0024',
        'name': 'Covenantzanadu Uzor',
        'email': 'covenant.uzor@tarepet.com',
        'phone': '08035567890',
        'gender': 'Male',
        'department': 'Academic Staff',
        'specialization': 'General Studies & Science',
        'subjects': [{'name': 'Basic Science', 'grade': 'JSS 1'}],
        'form_teacher_of': 'None'
    }
]

allowed_emails = {t['email'].lower() for t in OFFICIAL_TEACHERS}

print("=== STEP 1: Deleting unlisted teachers from database ===")
existing_teachers = CustomUser.objects.filter(role='TEACHER')
deleted_count = 0
for t in existing_teachers:
    if t.email.lower() not in allowed_emails:
        print(f"DELETING UNLISTED TEACHER: {t.get_full_name()} ({t.email})")
        t.delete()
        deleted_count += 1

print(f"Deleted {deleted_count} unlisted teacher records.\n")

print("=== STEP 2: Creating / Updating the Official 19 Teachers ===")
for r in OFFICIAL_TEACHERS:
    name_parts = r['name'].strip().split(' ')
    first_name = name_parts[0]
    last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else 'Staff'
    
    u = CustomUser.objects.filter(email__iexact=r['email']).first()
    if not u:
        u = CustomUser.objects.create_user(
            email=r['email'],
            password=r['teacher_id'],
            first_name=first_name,
            last_name=last_name,
            phone=r['phone'],
            role='TEACHER',
            is_staff=True,
        )
    else:
        u.first_name = first_name
        u.last_name = last_name
        u.phone = r['phone']
        u.role = 'TEACHER'
        u.is_staff = True
        u.save()

    p, _ = TeacherProfile.objects.get_or_create(user=u)
    p.teacher_id = r['teacher_id']
    p.department = r.get('department', '')
    p.specialization = r.get('specialization', '')
    p.gender = r.get('gender', '')
    p.form_teacher_of = r.get('form_teacher_of', 'None')
    p.subjects_taught = r.get('subjects', [])
    p.bio = f"Form Teacher for {p.form_teacher_of} and {p.specialization}" if p.form_teacher_of != 'None' else f"Educator in {p.specialization}"
    p.save()
    print(f"VERIFIED: {u.first_name} {u.last_name} | Staff ID: {p.teacher_id} | Phone: {u.phone} | Form Class: {p.form_teacher_of} | Spec: {p.specialization}")

total_now = CustomUser.objects.filter(role='TEACHER').count()
print(f"\nSUCCESS: Exactly {total_now} official teachers exist in the database!")

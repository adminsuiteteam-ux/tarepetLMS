import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

NURSERY_1_PUPILS = [
    {
        "name": "Pere T. Williams",
        "code": "3787",
        "dob": "2022-08-12",
        "gender": "Male",
        "parent_name": "Nelly Pere",
        "parent_phone": "07062285836",
    },
    {
        "name": "Lawrence W. Hillary",
        "code": "3781",
        "dob": "2022-04-06",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ikati",
        "parent_phone": "08032746972",
    },
    {
        "name": "Ipidei P. Penezidei",
        "code": "3783",
        "dob": "2022-05-30",
        "gender": "Male",
        "parent_name": "Momotimi Ipidei",
        "parent_phone": "08063828471",
    },
    {
        "name": "Ubagwu C. Kyla",
        "code": "3778",
        "dob": "2022-09-12",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ubagwu",
        "parent_phone": "09068359002",
    },
    {
        "name": "Louis Liam",
        "code": "3789",
        "dob": "2022-09-15",
        "gender": "Male",
        "parent_name": "Louis Ayodeji",
        "parent_phone": "08159868889",
    },
    {
        "name": "George Mfori Elianna",
        "code": "3784",
        "dob": "2022-10-28",
        "gender": "Female",
        "parent_name": "Mr & Mrs George",
        "parent_phone": "08130172436",
    },
    {
        "name": "Alamene Michaela",
        "code": "3788",
        "dob": "2022-10-13",
        "gender": "Female",
        "parent_name": "Mr & Mrs Alamene",
        "parent_phone": "07064933364",
    },
    {
        "name": "Ejimaji L. Marvellous",
        "code": "NUR1-008",
        "dob": "Not Provided",
        "gender": "Not Provided",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Ukaegbu C. Jason",
        "code": "3726",
        "dob": "2022-08-31",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ukaegbu",
        "parent_phone": "08062451584",
    },
    {
        "name": "Unezi V. Clara",
        "code": "NUR1-010",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Ogbonna E. Fidelia",
        "code": "3282",
        "dob": "2020-03-29",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ogbonna",
        "parent_phone": "08061113700",
    },
    {
        "name": "Simon S. Temeweierebi",
        "code": "3992",
        "dob": "2023-10-30",
        "gender": "Male",
        "parent_name": "Mr & Mrs Seletekeme",
        "parent_phone": "08066817858",
    },
    {
        "name": "Okoronkwo Paul A. Ahamefula",
        "code": "4078",
        "dob": "2022-10-28",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ahamefula",
        "parent_phone": "08161655708",
    },
    {
        "name": "Ifeme C. Chigozirim",
        "code": "4021",
        "dob": "2023-03-28",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ifeme",
        "parent_phone": "08031571337",
    },
    {
        "name": "Pullan Tamarau-efarem",
        "code": "NUR1-015",
        "dob": "Not Provided",
        "gender": "Not Provided",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Ebelonyetei O. Olaliq",
        "code": "3777",
        "dob": "2023-03-01",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ernest",
        "parent_phone": "08168216700",
    },
    {
        "name": "Pere P. Kingdavid",
        "code": "4061",
        "dob": "2022-04-17",
        "gender": "Male",
        "parent_name": "Suokipiri Praise",
        "parent_phone": "08033404324",
    },
    {
        "name": "Omiediekuma I. Martin",
        "code": "4004",
        "dob": "2023-04-13",
        "gender": "Male",
        "parent_name": "Mr & Mrs Omiediekuma",
        "parent_phone": "08169415574",
    },
    {
        "name": "Adelaja A. Aarianna",
        "code": "NUR1-019",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
]

def seed_nursery_1_pupils():
    print(f"[*] Starting Nursery 1 student seeding (19 pupils)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, pupil in enumerate(NURSERY_1_PUPILS, 1):
        name = pupil["name"].strip()
        code = pupil["code"].strip()
        dob_str = pupil["dob"].strip()
        gender = pupil["gender"].strip()
        parent_name = pupil["parent_name"].strip()
        parent_phone = pupil["parent_phone"].strip()

        # Clean name parts
        clean = re.sub(r'[^a-zA-Z\s]', '', name.lower()).split()
        first_name = clean[0].capitalize() if clean else "Student"
        last_name = clean[-1].capitalize() if len(clean) > 1 else "Tarepet"
        email = f"{clean[0]}.{clean[-1]}@tarepet.com" if len(clean) > 1 else f"{clean[0]}.tarepet@tarepet.com" if clean else f"student.{code}@tarepet.com"

        student_id = f"TMS/NUR1/{code}"

        user = User.objects.filter(username=student_id).first()
        created = False
        if not user:
            user = User.objects.filter(email=email).first()
            if user:
                user.username = student_id
            else:
                user = User(username=student_id, email=email, role=User.Role.STUDENT)
                created = True

        user.set_password(code)
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.role = User.Role.STUDENT
        user.save()

        profile, _ = StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                "student_id": student_id,
                "grade_level": "Nursery 1",
                "gender": gender if gender != "Not Provided" else "Not Specified",
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Montessori Early Years",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "Nursery 1"
        profile.gender = gender if gender != "Not Provided" else "Not Specified"
        profile.parent_name = parent_name
        profile.parent_phone = parent_phone
        profile.programme = "Montessori Early Years"
        profile.study_mode = "Full Time"
        if dob_str and dob_str != "Not Provided":
            try:
                profile.date_of_birth = dob_str
            except Exception:
                pass
        profile.save()

        if created:
            created_count += 1
        else:
            updated_count += 1

        print(f"  [{idx}/19] {student_id} - {name}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated (19 total Nursery 1 pupils).", flush=True)

if __name__ == "__main__":
    seed_nursery_1_pupils()

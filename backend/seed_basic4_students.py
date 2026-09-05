import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

BASIC_4_PUPILS = [
    {
        "name": "John David Ebanyu",
        "code": "3383",
        "dob": "2018-02-25",
        "gender": "Male",
        "parent_name": "Mr & Mrs John",
        "parent_phone": "08136912605",
    },
    {
        "name": "Isaiah Josephine",
        "code": "4024",
        "dob": "2018-06-13",
        "gender": "Female",
        "parent_name": "Mr & Mrs Isaiah",
        "parent_phone": "07015925138",
    },
    {
        "name": "Sawei Valeria",
        "code": "3938",
        "dob": "2018-02-14",
        "gender": "Female",
        "parent_name": "Fawei James",
        "parent_phone": "08032555045",
    },
    {
        "name": "Ukaegbu God's Favour",
        "code": "2039",
        "dob": "2017-06-06",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ukaegbu",
        "parent_phone": "08034835134",
    },
    {
        "name": "Ojokai Seth",
        "code": "3010",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ojokai",
        "parent_phone": "08035408420",
    },
    {
        "name": "Samuel Excel",
        "code": "3807",
        "dob": "2019-05-04",
        "gender": "Male",
        "parent_name": "Patricia Ezekiel",
        "parent_phone": "07031144737",
    },
    {
        "name": "Kelvin Excellent Victory",
        "code": "3591",
        "dob": "2018-05-21",
        "gender": "Male",
        "parent_name": "Kelvin Benedict",
        "parent_phone": "08060926240",
    },
    {
        "name": "Gbeji-Dan Karen",
        "code": "3469",
        "dob": "2017-12-04",
        "gender": "Female",
        "parent_name": "Mr & Mrs Gbeji-Dan",
        "parent_phone": "07032048843",
    },
    {
        "name": "Izebenua Gwegwe",
        "code": "2995",
        "dob": "2018-05-18",
        "gender": "Male",
        "parent_name": "Mr & Mrs Gwegwe",
        "parent_phone": "08166603421",
    },
    {
        "name": "Emmanuel Flourish",
        "code": "3560",
        "dob": "2017-06-30",
        "gender": "Female",
        "parent_name": "Mr Emmanuel Blessing",
        "parent_phone": "08036167177",
    },
    {
        "name": "Ikechukwu Jessica",
        "code": "2306",
        "dob": "2018-02-27",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ikechukwu",
        "parent_phone": "08106404427",
    },
    {
        "name": "Arinze Delight Chukwugozim",
        "code": "3307",
        "dob": "2018-02-10",
        "gender": "Female",
        "parent_name": "Mr & Mrs Arinze",
        "parent_phone": "08067102216",
    },
    {
        "name": "Johnbo Oweikani Jeandre",
        "code": "3985",
        "dob": "2017-06-15",
        "gender": "Male",
        "parent_name": "Mr & Mrs Johnbo",
        "parent_phone": "08032176536",
    },
    {
        "name": "Oginki Abrumdu Ebiweni",
        "code": "BSC4F-014",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Osangue Ewaren",
        "code": "BSC4F-015",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Beifie Gabriella",
        "code": "2912",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr & Mrs Beifie",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Ubokun Saviour",
        "code": "BSC4F-017",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Perekeseye Eliana",
        "code": "2378",
        "dob": "2018-02-21",
        "gender": "Female",
        "parent_name": "Mr & Mrs Perekeseye",
        "parent_phone": "07031093986",
    },
    {
        "name": "Perekeseye Elinora",
        "code": "2377",
        "dob": "2018-02-21",
        "gender": "Female",
        "parent_name": "Mr & Mrs Perekeseye",
        "parent_phone": "07031093986",
    },
    {
        "name": "Uchenna Dominion",
        "code": "3627",
        "dob": "2018-09-24",
        "gender": "Male",
        "parent_name": "Mrs Uchenna",
        "parent_phone": "08037348110",
    },
    {
        "name": "Alohan Uyiosa Nosa",
        "code": "1262",
        "dob": "2017-06-28",
        "gender": "Male",
        "parent_name": "Mr & Mrs Nosa Alohan",
        "parent_phone": "08034511255",
    },
    {
        "name": "Emmanuel Joseph Kingston U",
        "code": "3071",
        "dob": "2018-06-02",
        "gender": "Male",
        "parent_name": "Mr & Mrs Emmanuel",
        "parent_phone": "08037948442",
    },
]

def seed_basic_4_pupils():
    print(f"[*] Starting Basic 4 student seeding (22 pupils)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, pupil in enumerate(BASIC_4_PUPILS, 1):
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

        student_id = f"TMS/BSC4/{code}"

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
                "grade_level": "Basic 4",
                "gender": gender if gender != "Not Provided" else "Not Specified",
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Montessori Primary Basic Education",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "Basic 4"
        profile.gender = gender if gender != "Not Provided" else "Not Specified"
        profile.parent_name = parent_name
        profile.parent_phone = parent_phone
        profile.programme = "Montessori Primary Basic Education"
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

        print(f"  [{idx}/22] {student_id} - {name}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated (22 total Basic 4 pupils).", flush=True)

if __name__ == "__main__":
    seed_basic_4_pupils()

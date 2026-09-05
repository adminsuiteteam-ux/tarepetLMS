import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

JSS1_PUPILS = [
    {
        "name": "Tom-Amaegbe Tamara",
        "code": "2626",
        "dob": "2016-12-08",
        "gender": "Male",
        "parent_name": "Mr & Mrs Tom Amaegbe",
        "parent_phone": "08036665721",
    },
    {
        "name": "Biso Jeremiah Eloba",
        "code": "3279",
        "dob": "2015-02-11",
        "gender": "Male",
        "parent_name": "Mrs Victoria Biso",
        "parent_phone": "08066257930",
    },
    {
        "name": "Edward Saviour Alaere",
        "code": "JSS1-003",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Suma Dan-eye",
        "code": "3614",
        "dob": "2015-10-05",
        "gender": "Male",
        "parent_name": "Mr & Mrs Suma",
        "parent_phone": "09021387642",
    },
    {
        "name": "Williams Oyinkrozie",
        "code": "JSS1-005",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Lawson Success",
        "code": "3573",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "08038848281",
    },
    {
        "name": "Singerbate Kamella",
        "code": "JSS1-007",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Dimene Famous",
        "code": "JSS1-008",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Nwosu Mildred Chinony",
        "code": "JSS1-009",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Ogbu Mmesoma",
        "code": "2589",
        "dob": "2015-02-24",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ogbu",
        "parent_phone": "08035985167",
    },
    {
        "name": "Johnbo Oyintekemi",
        "code": "2936",
        "dob": "2015-07-22",
        "gender": "Female",
        "parent_name": "Mr & Mrs Johnbo",
        "parent_phone": "08032176536",
    },
    {
        "name": "Wisdom Nathan",
        "code": "JSS1-012",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Peter Eladebi Misi",
        "code": "2284",
        "dob": "2015-03-22",
        "gender": "Female",
        "parent_name": "Peter",
        "parent_phone": "07630362998",
    },
    {
        "name": "Miphoro Emmanuel",
        "code": "3516",
        "dob": "2014-05-16",
        "gender": "Male",
        "parent_name": "Mr & Mrs Miphoro",
        "parent_phone": "07065825306",
    },
    {
        "name": "Komonibo Esther",
        "code": "3728",
        "dob": "2015-04-15",
        "gender": "Female",
        "parent_name": "Dr Frances Komonibo",
        "parent_phone": "08100100609",
    },
    {
        "name": "Toromaye Woyengiemi",
        "code": "3203",
        "dob": "2015-09-09",
        "gender": "Female",
        "parent_name": "Mr & Mrs Toromaye",
        "parent_phone": "08037748807",
    },
    {
        "name": "Gabriel Douye",
        "code": "JSS1-017",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Olukaye Judith",
        "code": "3086",
        "dob": "2015-06-15",
        "gender": "Female",
        "parent_name": "Mrs Layefa T",
        "parent_phone": "08129180210",
    },
    {
        "name": "Gbeji-Dan Ketta",
        "code": "3468",
        "dob": "2015-05-29",
        "gender": "Female",
        "parent_name": "Mr & Mrs Gbeji-Dan",
        "parent_phone": "07032048843",
    },
    {
        "name": "Mbonu Chiniene",
        "code": "2587",
        "dob": "2015-07-16",
        "gender": "Female",
        "parent_name": "Mr & Mrs Mbonu",
        "parent_phone": "08038347663",
    },
    {
        "name": "Pekene Ayebatonye",
        "code": "JSS1-021",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Adiki Joshua",
        "code": "3687",
        "dob": "2014-10-23",
        "gender": "Male",
        "parent_name": "Mr & Mrs Adiki",
        "parent_phone": "08037799333",
    },
    {
        "name": "Akuna Oyintari",
        "code": "3919",
        "dob": "2014-11-14",
        "gender": "Female",
        "parent_name": "Mrs Akuna",
        "parent_phone": "08035446639",
    },
    {
        "name": "Valentine Esther",
        "code": "3276",
        "dob": "2014-05-27",
        "gender": "Female",
        "parent_name": "Mr & Mrs Valentine",
        "parent_phone": "08067036012",
    },
    {
        "name": "Bennett Orezibe",
        "code": "JSS1-025",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Fawei Juliet",
        "code": "2925",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr & Mrs Fawei",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Emeka Kamsi",
        "code": "4070",
        "dob": "2016-03-31",
        "gender": "Male",
        "parent_name": "Mr & Mrs Emeka Ibiam",
        "parent_phone": "08038931557",
    },
    {
        "name": "Briggs Esaziloi",
        "code": "3394",
        "dob": "2015-10-21",
        "gender": "Male",
        "parent_name": "Mr & Mrs Mcfall",
        "parent_phone": "08037219680",
    },
    {
        "name": "James Oritese",
        "code": "2817",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr & Mrs James",
        "parent_phone": "09035919316",
    },
    {
        "name": "Beketain Binalayefa",
        "code": "JSS1-030",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Epidi Caleb",
        "code": "JSS1-031",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Omiedemi Perfect",
        "code": "3319",
        "dob": "2014-05-02",
        "gender": "Female",
        "parent_name": "Hon Omiediekuma",
        "parent_phone": "07068091990",
    },
    {
        "name": "Chigozie Ezonunye",
        "code": "3719",
        "dob": "2014-11-16",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ozuruonye",
        "parent_phone": "09065540385",
    },
    {
        "name": "Boboyelafa Annaba",
        "code": "3746",
        "dob": "2012-01-12",
        "gender": "Female",
        "parent_name": "Victor Boboyelayefa",
        "parent_phone": "08032288330",
    },
    {
        "name": "Ovoh Ebiowa",
        "code": "JSS1-035",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "07034268224",
    },
    {
        "name": "James Azibapu",
        "code": "3847",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Richard Ugochukwu",
        "code": "JSS1-037",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Disi Oyintemi",
        "code": "3234",
        "dob": "2013-06-19",
        "gender": "Female",
        "parent_name": "Mrs Gordon Disi",
        "parent_phone": "08035676612",
    },
    {
        "name": "Sagay Divine",
        "code": "JSS1-039",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
]

def seed_jss1_pupils():
    print(f"[*] Starting JSS 1 student seeding (39 pupils)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, pupil in enumerate(JSS1_PUPILS, 1):
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

        student_id = f"TMS/JSS1/{code}"

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
                "grade_level": "JSS 1",
                "gender": gender if gender != "Not Provided" else "Not Specified",
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Junior Secondary School (JSS)",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "JSS 1"
        profile.gender = gender if gender != "Not Provided" else "Not Specified"
        profile.parent_name = parent_name
        profile.parent_phone = parent_phone
        profile.programme = "Junior Secondary School (JSS)"
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

        print(f"  [{idx}/39] {student_id} - {name}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated (39 total JSS 1 pupils).", flush=True)

if __name__ == "__main__":
    seed_jss1_pupils()

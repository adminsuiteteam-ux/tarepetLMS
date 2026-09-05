import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

NURSERY_2_PUPILS = [
    {
        "name": "Bright Charles Ayebatmiete",
        "code": "3700",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Tariayefa Franca",
        "parent_phone": "07033777699",
    },
    {
        "name": "Reign Perewari Kerekubuna",
        "code": "3597",
        "dob": "2021-07-25",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Godspower Godspower",
        "code": "NUR2F-003",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Wealth Cambo Jiden",
        "code": "3776",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Romeo Izokumo",
        "code": "3891",
        "dob": "2021-09-30",
        "gender": "Male",
        "parent_name": "Izokumo Romeo",
        "parent_phone": "08144033432",
    },
    {
        "name": "Omiete Boma Dahene",
        "code": "3871",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "07077199502",
    },
    {
        "name": "Ezike Supreme Chimamanda",
        "code": "3631",
        "dob": "2022-04-06",
        "gender": "Female",
        "parent_name": "Mr/Mrs Ezike",
        "parent_phone": "07031901939",
    },
    {
        "name": "Idama Ifetobore Blessing",
        "code": "3747",
        "dob": "2022-07-23",
        "gender": "Female",
        "parent_name": "Mr/Mrs Idama",
        "parent_phone": "08051088290",
    },
    {
        "name": "Torubeli Derek",
        "code": "3997",
        "dob": "2021-06-11",
        "gender": "Male",
        "parent_name": "Torubeli Adolphus",
        "parent_phone": "07015930035",
    },
    {
        "name": "Peter Andem Deborah",
        "code": "NUR2F-010",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Daniella Egbakhume",
        "code": "3730",
        "dob": "2022-07-09",
        "gender": "Female",
        "parent_name": "Egbakhume Joy",
        "parent_phone": "08033957957",
    },
    {
        "name": "John Miki Ayebaifie",
        "code": "3767",
        "dob": "2022-04-10",
        "gender": "Male",
        "parent_name": "Mr/Mrs John",
        "parent_phone": "07035004545",
    },
    {
        "name": "Kenneth Ilino-Ojo Emmanuel",
        "code": "NUR2F-013",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Victory Ebiowei",
        "code": "NUR2F-014",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Moko Gavin",
        "code": "3805",
        "dob": "2022-08-26",
        "gender": "Male",
        "parent_name": "Mr & Mrs Moko",
        "parent_phone": "08038465322",
    },
    {
        "name": "Ewgen Fsohe Ewaen",
        "code": "NUR2F-016",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Dede Ayibanodiafin Andre",
        "code": "3760",
        "dob": "2022-04-23",
        "gender": "Male",
        "parent_name": "Mr/Mrs Claudius Dede",
        "parent_phone": "08067550948",
    },
    {
        "name": "Odum Mirabel Chioma",
        "code": "3657",
        "dob": "2021-07-07",
        "gender": "Female",
        "parent_name": "Mr/Mrs Odum",
        "parent_phone": "08036934000",
    },
    {
        "name": "Bissong Cherrish",
        "code": "3802",
        "dob": "2021-10-21",
        "gender": "Female",
        "parent_name": "Mr/Mrs Bissong",
        "parent_phone": "08163302700",
    },
    {
        "name": "Deemua Samuel",
        "code": "3898",
        "dob": "2019-09-10",
        "gender": "Male",
        "parent_name": "Deemua Regina",
        "parent_phone": "08037696572",
    },
    {
        "name": "Umuwe Hadassah",
        "code": "4090",
        "dob": "2021-03-05",
        "gender": "Female",
        "parent_name": "Mr/Mrs Umuwe",
        "parent_phone": "09030578840",
    },
    {
        "name": "Ateigobo Miracle",
        "code": "3799",
        "dob": "2021-08-21",
        "gender": "Female",
        "parent_name": "Mr/Mrs Ateigbo",
        "parent_phone": "08038698295",
    },
    {
        "name": "Okoronkwo Ruth",
        "code": "4079",
        "dob": "2021-04-27",
        "gender": "Female",
        "parent_name": "Mr/Mrs Ahamefula",
        "parent_phone": "08161655708",
    },
    {
        "name": "Tenazibe Shadrack",
        "code": "3707",
        "dob": "2021-06-22",
        "gender": "Male",
        "parent_name": "Mr/Mrs Victory",
        "parent_phone": "08061166929",
    },
    {
        "name": "Thompson Gabriella",
        "code": "4092",
        "dob": "2021-01-31",
        "gender": "Female",
        "parent_name": "Mr/Mrs Thompson",
        "parent_phone": "07065252362",
    },
    {
        "name": "Omiediefa Pekene",
        "code": "3733",
        "dob": "2021-02-12",
        "gender": "Female",
        "parent_name": "Mr/Mrs Pekene",
        "parent_phone": "08036660975",
    },
    {
        "name": "Jame Frank",
        "code": "3612",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr James",
        "parent_phone": "09035919316",
    },
    {
        "name": "Diri Dominion",
        "code": "NUR2G-011",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Nwakor Ebubechukwu",
        "code": "3797",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr/Mrs Nwakor",
        "parent_phone": "08030596606",
    },
    {
        "name": "Kevin Samuel",
        "code": "3406",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Davidson Sunday",
        "code": "3725",
        "dob": "2022-04-09",
        "gender": "Male",
        "parent_name": "Mr/Mrs Sunday",
        "parent_phone": "07033255078",
    },
    {
        "name": "Iduate Ayibanemi",
        "code": "3759",
        "dob": "2021-10-09",
        "gender": "Female",
        "parent_name": "Mrs Enweh",
        "parent_phone": "07031617981",
    },
    {
        "name": "Reuben Favour",
        "code": "3892",
        "dob": "2020-11-10",
        "gender": "Female",
        "parent_name": "Mr/Mrs Reuben",
        "parent_phone": "07087914435",
    },
    {
        "name": "Ukaegbu Chimaobi",
        "code": "3726",
        "dob": "2022-08-31",
        "gender": "Male",
        "parent_name": "Mr/Mrs Ukaegbu",
        "parent_phone": "08062451584",
    },
    {
        "name": "Kei Nissi",
        "code": "NUR2G-018",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Johnson Great",
        "code": "3734",
        "dob": "2022-03-16",
        "gender": "Male",
        "parent_name": "Johnson Agoriyo",
        "parent_phone": "08139122073",
    },
    {
        "name": "Ide Alonariato Theodora",
        "code": "3908",
        "dob": "2021-09-21",
        "gender": "Female",
        "parent_name": "Mr/Mrs Ide",
        "parent_phone": "08064638714",
    },
    {
        "name": "Moneyman Treasure",
        "code": "3886",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr/Mrs Moneyman",
        "parent_phone": "08032717593",
    },
    {
        "name": "Egbegi Britta",
        "code": "3692",
        "dob": "2021-06-09",
        "gender": "Female",
        "parent_name": "Mr/Mrs Egbegi",
        "parent_phone": "08100882100",
    },
    {
        "name": "Arinyo Lang-May",
        "code": "3736",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr Lanmay",
        "parent_phone": "08064424823",
    },
    {
        "name": "Ayadtei Numberebiye",
        "code": "NUR2L-005",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Jesse Chisinndi Deinyeefa",
        "code": "3993",
        "dob": "2021-10-17",
        "gender": "Male",
        "parent_name": "Mrs Jane Peters",
        "parent_phone": "07069789781",
    },
    {
        "name": "Efose Odehi",
        "code": "4028",
        "dob": "2021-03-31",
        "gender": "Female",
        "parent_name": "Mr/Mrs Efose",
        "parent_phone": "07060789943",
    },
    {
        "name": "Odooh Sharon",
        "code": "3709",
        "dob": "2021-04-20",
        "gender": "Female",
        "parent_name": "Mr/Mrs Odooh",
        "parent_phone": "08065721406",
    },
    {
        "name": "Ugwu Chikamso Faith",
        "code": "3897",
        "dob": "2021-03-18",
        "gender": "Female",
        "parent_name": "Ugwu Peter",
        "parent_phone": "08030588602",
    },
    {
        "name": "Dhangere Chioma Kemela",
        "code": "3982",
        "dob": "2021-12-10",
        "gender": "Female",
        "parent_name": "Mr/Mrs Chubuzo",
        "parent_phone": "08061206675",
    },
    {
        "name": "Ipidei Ayibanua Patrick",
        "code": "3691",
        "dob": "2021-05-05",
        "gender": "Male",
        "parent_name": "Mr/Mrs Ipidei",
        "parent_phone": "07032968966",
    },
    {
        "name": "Whayta Trophy",
        "code": "3690",
        "dob": "2021-12-31",
        "gender": "Female",
        "parent_name": "Mr/Mrs Whayta",
        "parent_phone": "08067485867",
    },
    {
        "name": "Edet Augustine Victoria",
        "code": "3925",
        "dob": "2021-01-29",
        "gender": "Female",
        "parent_name": "Mr/Mrs Nsikak",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Okeziri Chimaobi Angelo",
        "code": "3731",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr/Mrs Okeziri",
        "parent_phone": "07032141633",
    },
    {
        "name": "Ebisike Emmanuel",
        "code": "3780",
        "dob": "2021-06-16",
        "gender": "Male",
        "parent_name": "Mr Ebisike",
        "parent_phone": "07035026542",
    },
    {
        "name": "Ezekiel Samuel David",
        "code": "3769",
        "dob": "2021-08-10",
        "gender": "Male",
        "parent_name": "Patricia Ezekiel",
        "parent_phone": "07031144737",
    },
    {
        "name": "Agbanoma Oghenekome Williams",
        "code": "3754",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr Williams",
        "parent_phone": "08137006420",
    },
    {
        "name": "Akpezi Oghenekome",
        "code": "3656",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Ogaga Omena",
        "parent_phone": "08036797298",
    },
    {
        "name": "Eide Ayo-oluwa David",
        "code": "3752",
        "dob": "2022-01-21",
        "gender": "Male",
        "parent_name": "Dr/Mrs Eide",
        "parent_phone": "08030973195",
    },
    {
        "name": "Osia Eliana",
        "code": "3895",
        "dob": "2021-04-25",
        "gender": "Female",
        "parent_name": "Mr/Mrs Osia",
        "parent_phone": "07014256308",
    },
    {
        "name": "Ibetoi Ebitonye",
        "code": "3712",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
]

def seed_nursery_2_pupils():
    print(f"[*] Starting Nursery 2 student seeding (57 pupils)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, pupil in enumerate(NURSERY_2_PUPILS, 1):
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

        student_id = f"TMS/NUR2/{code}"

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
                "grade_level": "Nursery 2",
                "gender": gender if gender != "Not Provided" else "Not Specified",
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Montessori Early Years",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "Nursery 2"
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

        print(f"  [{idx}/57] {student_id} - {name}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated (57 total Nursery 2 pupils).", flush=True)

if __name__ == "__main__":
    seed_nursery_2_pupils()

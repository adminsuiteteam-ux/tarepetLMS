import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

BASIC6_PUPILS = [
    # ── Page 1: Entries 1 to 22 ──
    {
        "name": "Ebemo Rebekah",
        "code": "4201",
        "dob": "2016-03-15",
        "gender": "Female",
        "email": "rebekah.ebemo@tarepet.com",
        "parent_name": "Mr & Mrs Ebemo",
        "parent_phone": "08038107252",
    },
    {
        "name": "Subi Bonita",
        "code": "3215",
        "dob": "2016-04-27",
        "gender": "Female",
        "email": "bonita.subi@tarepet.com",
        "parent_name": "Mr & Mrs Subi",
        "parent_phone": "08038107252",
    },
    {
        "name": "Tonkumu Sophia",
        "code": "2305",
        "dob": "2016-04-27",
        "gender": "Female",
        "email": "sophia.tonkumu@tarepet.com",
        "parent_name": "Mr & Mrs Tonkumu",
        "parent_phone": "09038674511",
    },
    {
        "name": "Mallati Jessica",
        "code": "3629",
        "dob": "2016-03-12",
        "gender": "Female",
        "email": "jessica.mallati@tarepet.com",
        "parent_name": "Mr & Mrs Mallati",
        "parent_phone": "08067275242",
    },
    {
        "name": "Regent Jean",
        "code": "3454",
        "dob": "2016-05-17",
        "gender": "Female",
        "email": "jean.regent@tarepet.com",
        "parent_name": "Mr & Mrs Regent",
        "parent_phone": "08034116576",
    },
    {
        "name": "Ojokai Matthew",
        "code": "4202",
        "dob": "2016-06-20",
        "gender": "Male",
        "email": "matthew.ojokai@tarepet.com",
        "parent_name": "Mr & Mrs Ojokai",
        "parent_phone": "08034116576",
    },
    {
        "name": "Wari Bolakabi",
        "code": "3872",
        "dob": "2016-12-27",
        "gender": "Male",
        "email": "bolakabi.wari@tarepet.com",
        "parent_name": "Wari Stephen",
        "parent_phone": "08035260894",
    },
    {
        "name": "Hephzibah Koru",
        "code": "3720",
        "dob": "2016-07-04",
        "gender": "Female",
        "email": "hephzibah.koru@tarepet.com",
        "parent_name": "Mr & Mrs Koru",
        "parent_phone": "08035659604",
    },
    {
        "name": "Isaiah Jamie B.",
        "code": "4009",
        "dob": "2016-09-04",
        "gender": "Male",
        "email": "jamie.isaiah@tarepet.com",
        "parent_name": "Mr & Mrs James Isaiah",
        "parent_phone": "07065925130",
    },
    {
        "name": "Alfred Eto-Etana",
        "code": "2310",
        "dob": "2016-01-13",
        "gender": "Male",
        "email": "etoetana.alfred@tarepet.com",
        "parent_name": "Alfred Eto Danapu",
        "parent_phone": "07039943621",
    },
    {
        "name": "Clement Davies Esther",
        "code": "3443",
        "dob": "2016-08-08",
        "gender": "Female",
        "email": "esther.clementdavies@tarepet.com",
        "parent_name": "Apostle Davies",
        "parent_phone": "08165494601",
    },
    {
        "name": "Tebeda Henry",
        "code": "4012",
        "dob": "2015-05-15",
        "gender": "Male",
        "email": "henry.tebeda@tarepet.com",
        "parent_name": "Mrs Kate Tebeda",
        "parent_phone": "08126107985",
    },
    {
        "name": "Diri Queen Chimuanya",
        "code": "3930",
        "dob": "2015-12-09",
        "gender": "Female",
        "email": "queen.diri@tarepet.com",
        "parent_name": "Mr & Mrs Chuks",
        "parent_phone": "09071022308",
    },
    {
        "name": "Mieypa Samuel",
        "code": "2276",
        "dob": "2016-01-20",
        "gender": "Male",
        "email": "samuel.mieypa@tarepet.com",
        "parent_name": "Mr & Mrs Mieypa",
        "parent_phone": "07067000008",
    },
    {
        "name": "Ogiuwie Olasu Lydia",
        "code": "2971",
        "dob": "2016-05-07",
        "gender": "Female",
        "email": "lydia.ogiuwie@tarepet.com",
        "parent_name": "Mr & Mrs Ogiuwie",
        "parent_phone": "08064191819",
    },
    {
        "name": "Iwu Gift",
        "code": "2751",
        "dob": "2016-06-18",
        "gender": "Female",
        "email": "gift.iwu@tarepet.com",
        "parent_name": "Mr & Mrs Iwu",
        "parent_phone": "08064191819",
    },
    {
        "name": "Asia Treasure Edowere",
        "code": "4053",
        "dob": "2016-09-21",
        "gender": "Female",
        "email": "treasure.asia@tarepet.com",
        "parent_name": "Mr & Mrs Asia",
        "parent_phone": "07036543578",
    },
    {
        "name": "Eniseigha Imomotimi",
        "code": "4058",
        "dob": "2016-04-08",
        "gender": "Male",
        "email": "imomotimi.eniseigha@tarepet.com",
        "parent_name": "Dan Eniseigha",
        "parent_phone": "08122980023",
    },
    {
        "name": "Omuedekumo Eminency",
        "code": "3333",
        "dob": "2015-05-27",
        "gender": "Female",
        "email": "eminency.omuedekumo@tarepet.com",
        "parent_name": "Hon Omuedekuma",
        "parent_phone": "07068091990",
    },
    {
        "name": "Adonis Esther",
        "code": "3558",
        "dob": "2017-04-14",
        "gender": "Female",
        "email": "esther.adonis@tarepet.com",
        "parent_name": "Mr & Mrs Adonis",
        "parent_phone": "08035047336",
    },
    {
        "name": "Ibokan God's Love",
        "code": "2984",
        "dob": "2016-04-27",
        "gender": "Female",
        "email": "godslove.ibokan@tarepet.com",
        "parent_name": "Mr & Mrs Ibokan",
        "parent_phone": "08038005912",
    },
    {
        "name": "Ukaegbu George",
        "code": "2638",
        "dob": "2015-09-06",
        "gender": "Male",
        "email": "george.ukaegbu@tarepet.com",
        "parent_name": "Mr & Mrs Ukaegbu",
        "parent_phone": "08160083337",
    },

    # ── Page 2: Entries 23 to 31 ──
    {
        "name": "Timi David",
        "code": "3816",
        "dob": "2015-11-14",
        "gender": "Male",
        "email": "david.timi@tarepet.com",
        "parent_name": "Mr & Mrs Timi",
        "parent_phone": "07038078427",
    },
    {
        "name": "Baralatari Esther",
        "code": "3929",
        "dob": "2015-09-07",
        "gender": "Female",
        "email": "esther.baralatari@tarepet.com",
        "parent_name": "Mr Baralatari",
        "parent_phone": "07062176112",
    },
    {
        "name": "Oyinperebi Perekeme",
        "code": "3657",
        "dob": "2014-10-25",
        "gender": "Male",
        "email": "perekeme.oyinperebi@tarepet.com",
        "parent_name": "Emberru Sezeragi",
        "parent_phone": "0805354306",
    },
    {
        "name": "Whyte Olivia",
        "code": "3347",
        "dob": "2016-07-18",
        "gender": "Female",
        "email": "olivia.whyte@tarepet.com",
        "parent_name": "Mr & Mrs Whyte",
        "parent_phone": "08067465867",
    },
    {
        "name": "Delimua Prince",
        "code": "3148",
        "dob": "2015-08-20",
        "gender": "Male",
        "email": "prince.delimua@tarepet.com",
        "parent_name": "Mr & Mrs Delimua",
        "parent_phone": "07062631065",
    },
    {
        "name": "Ayibanaiyn Erefamote",
        "code": "3303",
        "dob": "2014-04-23",
        "gender": "Female",
        "email": "erefamote.ayibanaiyn@tarepet.com",
        "parent_name": "Garsuch Erefamote",
        "parent_phone": "08035159514",
    },
    {
        "name": "Kei Keseizibe",
        "code": "3073",
        "dob": "2015-12-05",
        "gender": "Female",
        "email": "keseizibe.kei@tarepet.com",
        "parent_name": "Mr & Mrs Kei",
        "parent_phone": "08035159514",
    },
    {
        "name": "Eto Royal",
        "code": "4203",
        "dob": "2016-02-18",
        "gender": "Male",
        "email": "royal.eto@tarepet.com",
        "parent_name": "Mr & Mrs Eto",
        "parent_phone": "08032927475",
    },
    {
        "name": "Isaiah Deriery",
        "code": "3750",
        "dob": "2015-03-16",
        "gender": "Male",
        "email": "deriery.isaiah@tarepet.com",
        "parent_name": "Mr & Mrs Isaiah",
        "parent_phone": "08032927475",
    },
]

def clean_email(email_str):
    parts = email_str.split('@')
    name_part = re.sub(r'[^a-z.]', '', parts[0].lower())
    domain = parts[1] if len(parts) > 1 else 'tarepet.com'
    return f"{name_part}@{domain}"

def seed_basic6():
    print(f"[SEED] Seeding {len(BASIC6_PUPILS)} Basic 6 Pupils into Tarepet LMS (ID format: TMS/BSC6/<code >)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, item in enumerate(BASIC6_PUPILS, start=1):
        name = item["name"]
        code = item["code"]
        dob = item.get("dob")
        gender = item.get("gender", "Male")
        email = clean_email(item.get("email", ""))
        parent_name = item.get("parent_name", "")
        parent_phone = item.get("parent_phone", "")

        # Format requested by user: TMS/BSC6/(4DIGITS)
        student_id = f"TMS/BSC6/{code}"

        name_parts = name.split()
        first_name = name_parts[0] if name_parts else name
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Student"

        user = User.objects.filter(username=student_id).first()
        created = False

        if user is None:
            user = User.objects.filter(email=email).first()
            if user is not None:
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

        profile, prof_created = StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                "student_id": student_id,
                "grade_level": "Basic 6",
                "stream": "General",
                "gender": gender,
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Montessori Primary Basic Education",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "Basic 6"
        profile.stream = "General"
        profile.gender = gender
        profile.parent_name = parent_name
        profile.parent_phone = parent_phone
        profile.programme = "Montessori Primary Basic Education"
        profile.study_mode = "Full Time"
        if dob:
            try:
                profile.date_of_birth = dob
            except Exception:
                pass
        profile.save()

        if created:
            created_count += 1
        else:
            updated_count += 1

        print(f"  [{idx}/{len(BASIC6_PUPILS)}] {student_id} - {name} (Basic 6) -> {email}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated ({len(BASIC6_PUPILS)} total Basic 6 pupils).", flush=True)

if __name__ == "__main__":
    seed_basic6()

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

SS3_PUPILS = [
    # 1 to 14: Art Stream
    {
        "name": "Aladei Perekedoumini Excel",
        "code": "2937",
        "dob": "2011-10-27",
        "gender": "Male",
        "stream": "Arts",
        "email": "excel.aladei@tarepet.com",
        "parent_name": "Mr & Mrs Aladei",
        "parent_phone": "08035107455",
    },
    {
        "name": "Gwegwe Inifiebaiya",
        "code": "1478",
        "dob": "2011-05-14",
        "gender": "Male",
        "stream": "Arts",
        "email": "inifiebaiya.gwegwe@tarepet.com",
        "parent_name": "Mr & Mrs Gwegwe",
        "parent_phone": "08035107455",
    },
    {
        "name": "Okeke Bright",
        "code": "1479",
        "dob": "2012-09-12",
        "gender": "Male",
        "stream": "Arts",
        "email": "bright.okeke@tarepet.com",
        "parent_name": "Mr & Mrs Okeke",
        "parent_phone": "08035428895",
    },
    {
        "name": "Ogiriki Victor",
        "code": "1853",
        "dob": "2012-09-12",
        "gender": "Male",
        "stream": "Arts",
        "email": "victor.ogiriki@tarepet.com",
        "parent_name": "Mr & Mrs Ogiriki",
        "parent_phone": "08035428895",
    },
    {
        "name": "Irophy Emmanuella",
        "code": "3213",
        "dob": "2009-08-07",
        "gender": "Female",
        "stream": "Arts",
        "email": "emmanuella.irophy@tarepet.com",
        "parent_name": "Mr & Mrs Irophy",
        "parent_phone": "08035428895",
    },
    {
        "name": "Emmanuel Success",
        "code": "3251",
        "dob": "2011-04-15",
        "gender": "Female",
        "stream": "Arts",
        "email": "success.emmanuel@tarepet.com",
        "parent_name": "Mr & Mrs Igedu",
        "parent_phone": "08033923760",
    },
    {
        "name": "Akpoghire Victory",
        "code": "2057",
        "dob": "2011-02-23",
        "gender": "Female",
        "stream": "Arts",
        "email": "victory.akpoghire@tarepet.com",
        "parent_name": "Mr & Mrs Akpoghire",
        "parent_phone": "07065325306",
    },
    {
        "name": "Irophy Precious",
        "code": "3214",
        "dob": "2010-06-18",
        "gender": "Female",
        "stream": "Arts",
        "email": "precious.irophy@tarepet.com",
        "parent_name": "Mr & Mrs Irophy",
        "parent_phone": "08035425895",
    },
    {
        "name": "Irene Timiayebapre",
        "code": "2921",
        "dob": "2011-03-20",
        "gender": "Female",
        "stream": "Arts",
        "email": "timiayebapre.irene@tarepet.com",
        "parent_name": "Mr & Mrs Irene",
        "parent_phone": "08033362073",
    },
    {
        "name": "Iwara Benedicta",
        "code": "2920",
        "dob": "2011-03-20",
        "gender": "Female",
        "stream": "Arts",
        "email": "benedicta.iwara@tarepet.com",
        "parent_name": "Mr & Mrs Iwara",
        "parent_phone": "08033362073",
    },
    {
        "name": "Ikogi Esther",
        "code": "3491",
        "dob": "2014-03-20",
        "gender": "Female",
        "stream": "Arts",
        "email": "esther.ikogi@tarepet.com",
        "parent_name": "Mr & Mrs Ikogi",
        "parent_phone": "08033362073",
    },
    {
        "name": "Aseghreen Lewis",
        "code": "3492",
        "dob": "2012-08-15",
        "gender": "Male",
        "stream": "Arts",
        "email": "lewis.aseghreen@tarepet.com",
        "parent_name": "Mr & Mrs Jonathan",
        "parent_phone": "08038297361",
    },
    {
        "name": "Gabice Abundance",
        "code": "3842",
        "dob": "2012-03-18",
        "gender": "Female",
        "stream": "Arts",
        "email": "abundance.gabice@tarepet.com",
        "parent_name": "Mr & Mrs Gabice",
        "parent_phone": "08108002112",
    },
    {
        "name": "Obama Morris",
        "code": "3220",
        "dob": "2013-03-28",
        "gender": "Male",
        "stream": "Arts",
        "email": "morris.obama@tarepet.com",
        "parent_name": "Mr & Mrs Obama",
        "parent_phone": "08108002112",
    },

    # 15 to 60: Science Stream
    {
        "name": "Azagba Denzel",
        "code": "3239",
        "dob": "2012-05-19",
        "gender": "Male",
        "stream": "Science",
        "email": "denzel.azagba@tarepet.com",
        "parent_name": "Nelly Puskin",
        "parent_phone": "08108002112",
    },
    {
        "name": "Diata Michelle",
        "code": "3503",
        "dob": "2010-04-13",
        "gender": "Female",
        "stream": "Science",
        "email": "michelle.diata@tarepet.com",
        "parent_name": "Mr & Mrs Diata",
        "parent_phone": "08066747864",
    },
    {
        "name": "Ndubuaku Phlegon I.",
        "code": "3440",
        "dob": "2011-09-08",
        "gender": "Male",
        "stream": "Science",
        "email": "phlegon.ndubuaku@tarepet.com",
        "parent_name": "Mr & Mrs Ndubuaku",
        "parent_phone": "08034573472",
    },
    {
        "name": "Subi Princess",
        "code": "3396",
        "dob": "2011-07-29",
        "gender": "Female",
        "stream": "Science",
        "email": "princess.subi@tarepet.com",
        "parent_name": "Mr & Mrs Subi",
        "parent_phone": "08038107252",
    },
    {
        "name": "Leghemo Stephen",
        "code": "3504",
        "dob": "2011-04-13",
        "gender": "Male",
        "stream": "Science",
        "email": "stephen.leghemo@tarepet.com",
        "parent_name": "Mr & Mrs Leghemo",
        "parent_phone": "09033507976",
    },
    {
        "name": "Goodluck Koru",
        "code": "3442",
        "dob": "2011-08-19",
        "gender": "Male",
        "stream": "Science",
        "email": "koru.goodluck@tarepet.com",
        "parent_name": "Mr & Mrs Goodluck",
        "parent_phone": "07066989342",
    },
    {
        "name": "Isaac Oyinwariyamo",
        "code": "3443",
        "dob": "2011-08-19",
        "gender": "Male",
        "stream": "Science",
        "email": "oyinwariyamo.isaac@tarepet.com",
        "parent_name": "Gesiese Ominah",
        "parent_phone": "07066989342",
    },
    {
        "name": "Okringa Francis",
        "code": "3397",
        "dob": "2011-07-29",
        "gender": "Male",
        "stream": "Science",
        "email": "francis.okringa@tarepet.com",
        "parent_name": "Mr & Mrs Okuringya",
        "parent_phone": "08035712142",
    },
    {
        "name": "Daitimi Ayibafie Godspower",
        "code": "3317",
        "dob": "2014-01-04",
        "gender": "Male",
        "stream": "Science",
        "email": "godspower.daitimi@tarepet.com",
        "parent_name": "Mr Doutimifi",
        "parent_phone": "07037599751",
    },
    {
        "name": "Godknows Celimonowei Michael",
        "code": "2336",
        "dob": "2014-04-07",
        "gender": "Male",
        "stream": "Science",
        "email": "michael.godknows@tarepet.com",
        "parent_name": "Mr Michael",
        "parent_phone": "07035699425",
    },
    {
        "name": "Bennett Kesowie",
        "code": "1476",
        "dob": "2013-05-18",
        "gender": "Male",
        "stream": "Science",
        "email": "kesowie.bennett@tarepet.com",
        "parent_name": "Mr & Mrs Bennett",
        "parent_phone": "07035699425",
    },
    {
        "name": "Dick David Abadan",
        "code": "2043",
        "dob": "2013-01-24",
        "gender": "Male",
        "stream": "Science",
        "email": "david.dick@tarepet.com",
        "parent_name": "Dick Abandani",
        "parent_phone": "07066848221",
    },
    {
        "name": "Christopher Opukeme",
        "code": "3857",
        "dob": "2014-01-07",
        "gender": "Male",
        "stream": "Science",
        "email": "opukeme.christopher@tarepet.com",
        "parent_name": "Mr & Mrs Christopher",
        "parent_phone": "08100100607",
    },
    {
        "name": "Komonibo Evidence",
        "code": "3858",
        "dob": "2014-01-07",
        "gender": "Female",
        "stream": "Science",
        "email": "evidence.komonibo@tarepet.com",
        "parent_name": "Dr Frances Komonibo",
        "parent_phone": "08100100607",
    },
    {
        "name": "Onouha Emmanuel",
        "code": "3438",
        "dob": "2012-03-12",
        "gender": "Male",
        "stream": "Science",
        "email": "emmanuel.onouha@tarepet.com",
        "parent_name": "Mr & Mrs Onouha",
        "parent_phone": "07035081582",
    },
    {
        "name": "Morris Perekeme",
        "code": "3895",
        "dob": "2014-09-29",
        "gender": "Male",
        "stream": "Science",
        "email": "perekeme.morris@tarepet.com",
        "parent_name": "Mr & Mrs Morris",
        "parent_phone": "07035081582",
    },
    {
        "name": "Afamukoro Peremobowei Derick",
        "code": "3439",
        "dob": "2012-03-12",
        "gender": "Male",
        "stream": "Science",
        "email": "derick.afamukoro@tarepet.com",
        "parent_name": "Mr & Mrs Suobou",
        "parent_phone": "07035081582",
    },
    {
        "name": "Afuluchukwu Emmanuel",
        "code": "3896",
        "dob": "2014-09-29",
        "gender": "Male",
        "stream": "Science",
        "email": "emmanuel.afuluchukwu@tarepet.com",
        "parent_name": "Mr & Mrs Afuluchukwu",
        "parent_phone": "08037754762",
    },
    {
        "name": "Igweshi Mary Obiageli",
        "code": "3920",
        "dob": "2014-01-30",
        "gender": "Female",
        "stream": "Science",
        "email": "mary.igweshi@tarepet.com",
        "parent_name": "Mr & Mrs Igweshi",
        "parent_phone": "08035446039",
    },
    {
        "name": "Akuna Jethro",
        "code": "4020",
        "dob": "2014-07-08",
        "gender": "Male",
        "stream": "Science",
        "email": "jethro.akuna@tarepet.com",
        "parent_name": "Mr & Mrs Akuna",
        "parent_phone": "08035446039",
    },
    {
        "name": "Beniangba Wealth",
        "code": "2322",
        "dob": "2010-02-12",
        "gender": "Female",
        "stream": "Science",
        "email": "wealth.beniangba@tarepet.com",
        "parent_name": "Mr & Mrs Beniangba",
        "parent_phone": "08037725554",
    },
    {
        "name": "Okon Bethel",
        "code": "1460",
        "dob": "2012-06-18",
        "gender": "Female",
        "stream": "Science",
        "email": "bethel.okon@tarepet.com",
        "parent_name": "Mr & Mrs Okon",
        "parent_phone": "08037727138",
    },
    {
        "name": "Peters Godstour",
        "code": "2989",
        "dob": "2011-02-26",
        "gender": "Male",
        "stream": "Science",
        "email": "godstour.peters@tarepet.com",
        "parent_name": "Mr & Mrs Peters",
        "parent_phone": "08035517663",
    },
    {
        "name": "Onoro Flourish",
        "code": "2085",
        "dob": "2011-03-08",
        "gender": "Female",
        "stream": "Science",
        "email": "flourish.onoro@tarepet.com",
        "parent_name": "Mr & Mrs Flourish",
        "parent_phone": "08035517663",
    },
    {
        "name": "Benjamin Shalom",
        "code": "1831",
        "dob": "2011-05-20",
        "gender": "Male",
        "stream": "Science",
        "email": "shalom.benjamin@tarepet.com",
        "parent_name": "Mr & Mrs Benjamin",
        "parent_phone": "08080673154",
    },
    {
        "name": "Zebedee Gershon",
        "code": "1823",
        "dob": "2011-05-20",
        "gender": "Male",
        "stream": "Science",
        "email": "gershon.zebedee@tarepet.com",
        "parent_name": "Mr & Mrs Zebedee",
        "parent_phone": "08080673154",
    },
    {
        "name": "Okechukwu Amarachi",
        "code": "3131",
        "dob": "2010-02-10",
        "gender": "Female",
        "stream": "Science",
        "email": "amarachi.okechukwu@tarepet.com",
        "parent_name": "Mr & Mrs Okechukwu",
        "parent_phone": "08035804822",
    },
    {
        "name": "Okani Bradford",
        "code": "3132",
        "dob": "2010-02-10",
        "gender": "Male",
        "stream": "Science",
        "email": "bradford.okani@tarepet.com",
        "parent_name": "Mr & Mrs Okani",
        "parent_phone": "08035804822",
    },
    {
        "name": "Osakwe Blessing",
        "code": "3133",
        "dob": "2010-02-10",
        "gender": "Female",
        "stream": "Science",
        "email": "blessing.osakwe@tarepet.com",
        "parent_name": "Mr Eboye Osakwe",
        "parent_phone": "08035804822",
    },
    {
        "name": "Johnny Emmanuel",
        "code": "3134",
        "dob": "2010-02-10",
        "gender": "Male",
        "stream": "Science",
        "email": "emmanuel.johnny@tarepet.com",
        "parent_name": "Mr & Mrs Johnny",
        "parent_phone": "08035804822",
    },
    {
        "name": "Samson Happiness",
        "code": "1888",
        "dob": "2011-02-28",
        "gender": "Female",
        "stream": "Science",
        "email": "happiness.samson@tarepet.com",
        "parent_name": "Dr Evans Osaisai",
        "parent_phone": "07066658661",
    },
    {
        "name": "Osaisai Kathleen",
        "code": "3461",
        "dob": "2011-07-09",
        "gender": "Female",
        "stream": "Science",
        "email": "kathleen.osaisai@tarepet.com",
        "parent_name": "Dr Evans Osaisai",
        "parent_phone": "07066658661",
    },
    {
        "name": "Iwuchukwu Riola",
        "code": "3520",
        "dob": "2010-08-10",
        "gender": "Female",
        "stream": "Science",
        "email": "riola.iwuchukwu@tarepet.com",
        "parent_name": "Mr & Mrs Michael",
        "parent_phone": "08031990852",
    },
    {
        "name": "Samuel Collins",
        "code": "2215",
        "dob": "2010-08-10",
        "gender": "Male",
        "stream": "Science",
        "email": "collins.samuel@tarepet.com",
        "parent_name": "Samuel O. Samuel",
        "parent_phone": "08058705109",
    },
    {
        "name": "Ashimi Oluwagbotahan",
        "code": "3846",
        "dob": "2010-08-10",
        "gender": "Male",
        "stream": "Science",
        "email": "oluwagbotahan.ashimi@tarepet.com",
        "parent_name": "Mr & Mrs Ashimi",
        "parent_phone": "08036744931",
    },
    {
        "name": "Ogiuwie Michelle",
        "code": "3335",
        "dob": "2009-07-26",
        "gender": "Female",
        "stream": "Science",
        "email": "michelle.ogiuwie@tarepet.com",
        "parent_name": "Mr & Mrs Ogiuwie",
        "parent_phone": "08036744931",
    },
    {
        "name": "James Delight",
        "code": "3840",
        "dob": "2009-07-26",
        "gender": "Female",
        "stream": "Science",
        "email": "delight.james@tarepet.com",
        "parent_name": "Mr & Mrs James",
        "parent_phone": "08036744931",
    },
    {
        "name": "Biso Eric",
        "code": "3112",
        "dob": "2009-08-25",
        "gender": "Male",
        "stream": "Science",
        "email": "eric.biso@tarepet.com",
        "parent_name": "Mr & Mrs Biso",
        "parent_phone": "08036744931",
    },
    {
        "name": "Lawson Favour",
        "code": "3834",
        "dob": "2012-04-26",
        "gender": "Female",
        "stream": "Science",
        "email": "favour.lawson@tarepet.com",
        "parent_name": "Mr & Mrs Lawson",
        "parent_phone": "09038045041",
    },
    {
        "name": "Ayakpo Emmanuel",
        "code": "3861",
        "dob": "2012-04-26",
        "gender": "Male",
        "stream": "Science",
        "email": "emmanuel.ayakpo@tarepet.com",
        "parent_name": "Mr & Mrs Ayakpo",
        "parent_phone": "08033178062",
    },
    {
        "name": "Ayebatonye Ginah",
        "code": "3762",
        "dob": "2011-10-23",
        "gender": "Female",
        "stream": "Science",
        "email": "ginah.ayebatonye@tarepet.com",
        "parent_name": "Ginah Banasin-Opre",
        "parent_phone": "08083749680",
    },
    {
        "name": "Akpobolokeme Brightness",
        "code": "3862",
        "dob": "2011-10-23",
        "gender": "Female",
        "stream": "Science",
        "email": "brightness.akpobolokeme@tarepet.com",
        "parent_name": "Suba Akpobolokeme",
        "parent_phone": "08160238111",
    },
    {
        "name": "Amasomaowei Deborah",
        "code": "3863",
        "dob": "2011-10-23",
        "gender": "Female",
        "stream": "Science",
        "email": "deborah.amasomaowei@tarepet.com",
        "parent_name": "Mr & Mrs Amasomaowei",
        "parent_phone": "08160238111",
    },
    {
        "name": "Olukpo Desire",
        "code": "3864",
        "dob": "2011-10-23",
        "gender": "Female",
        "stream": "Science",
        "email": "desire.olukpo@tarepet.com",
        "parent_name": "Mr & Mrs Olukpo",
        "parent_phone": "08038195580",
    },
    {
        "name": "Yongosi Kingdavid",
        "code": "3865",
        "dob": "2011-10-23",
        "gender": "Male",
        "stream": "Science",
        "email": "kingdavid.yongosi@tarepet.com",
        "parent_name": "Yongosi Joyful",
        "parent_phone": "08038195580",
    },
    {
        "name": "Oweifawari Tariebi",
        "code": "3866",
        "dob": "2011-10-23",
        "gender": "Male",
        "stream": "Science",
        "email": "tariebi.oweifawari@tarepet.com",
        "parent_name": "Mr & Mrs Oweifawari",
        "parent_phone": "07038421059",
    },
]

def seed_ss3():
    print(f"[SEED] Seeding {len(SS3_PUPILS)} SS3 Students into Tarepet LMS (1-14 Art, 15-60 Science)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, item in enumerate(SS3_PUPILS, start=1):
        name = item["name"]
        code = item["code"]
        dob = item.get("dob")
        gender = item.get("gender", "Male")
        stream = item.get("stream", "Science")
        email = item.get("email", "")
        parent_name = item.get("parent_name", "")
        parent_phone = item.get("parent_phone", "")

        # Build proper school ID format: TMS/SS3/ART/{code} or TMS/SS3/SCI/{code}
        stream_code = "ART" if stream == "Arts" else "SCI"
        student_id = f"TMS/SS3/{stream_code}/{code}"

        name_parts = name.split()
        first_name = name_parts[0] if name_parts else name
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Student"

        # Try by exact new username first
        user = User.objects.filter(username=student_id).first()
        created = False

        if user is None:
            # Fall back: find existing record seeded with old format (TMS-SS3-{code})
            user = User.objects.filter(email=email).first()
            if user is not None:
                # Update username to the correct school ID format
                user.username = student_id
            else:
                user = User(username=student_id, email=email, role=User.Role.STUDENT)
                created = True

        user.set_password(code)  # Unique 4-digit code is their portal password
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.role = User.Role.STUDENT
        user.save()

        profile, prof_created = StudentProfile.objects.get_or_create(
            user=user,
            defaults={
                "student_id": student_id,
                "grade_level": "SS3",
                "stream": stream,
                "gender": gender,
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Senior Secondary Certificate (SSCE)",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "SS3"
        profile.stream = stream
        profile.gender = gender
        profile.parent_name = parent_name
        profile.parent_phone = parent_phone
        profile.programme = "Senior Secondary Certificate (SSCE)"
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

        print(f"  [{idx}/{len(SS3_PUPILS)}] {student_id} - {name} ({stream}) -> {email}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated ({len(SS3_PUPILS)} total SS3 students).", flush=True)

if __name__ == "__main__":
    seed_ss3()

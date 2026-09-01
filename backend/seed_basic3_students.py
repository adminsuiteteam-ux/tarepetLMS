import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile, ParentProfile

User = get_user_model()

BASIC_3_PUPILS = [
    {
        "name": "Shedrach Pereilaou",
        "code": "3254",
        "dob": "2016-04-28",
        "gender": "Male",
        "parent_name": "Mr & Mrs Victory",
        "parent_phone": "08061166929",
    },
    {
        "name": "Churchill N. Blossom",
        "code": "3211",
        "dob": "2016-10-31",
        "gender": "Female",
        "parent_name": "Mr & Mrs Churchill",
        "parent_phone": "08061329161",
    },
    {
        "name": "Okoruwa S. Deborah",
        "code": "3324",
        "dob": "2019-05-08",
        "gender": "Female",
        "parent_name": "Mr & Mrs Okoruwa",
        "parent_phone": "08069320112",
    },
    {
        "name": "Akhimien Eliana",
        "code": "3581",
        "dob": "2019-02-16",
        "gender": "Female",
        "parent_name": "Mr & Mrs Akhimien",
        "parent_phone": "07032615797",
    },
    {
        "name": "Kika Tamara",
        "code": "4006",
        "dob": "2019-07-12",
        "gender": "Female",
        "parent_name": "Bobby Kika",
        "parent_phone": "08037890628",
    },
    {
        "name": "Johnbo B. Jeanetta",
        "code": "3984",
        "dob": "2015-11-28",
        "gender": "Female",
        "parent_name": "Mr & Mrs Johnbo",
        "parent_phone": "08032576536",
    },
    {
        "name": "Dressman P. Ebibo",
        "code": "3300",
        "dob": "2019-05-24",
        "gender": "Male",
        "parent_name": "Mr & Mrs Dressman",
        "parent_phone": "08063607380",
    },
    {
        "name": "Okeziri Treasure",
        "code": "3301",
        "dob": "2019-05-24",
        "gender": "Female",
        "parent_name": "Mr & Mrs Okeziri",
        "parent_phone": "08063607380",
    },
    {
        "name": "Eboboro Christabel",
        "code": "3703",
        "dob": "2017-07-07",
        "gender": "Female",
        "parent_name": "Ebotoro Gerald",
        "parent_phone": "09013608818",
    },
    {
        "name": "Abadi P. Perekowei",
        "code": "3953",
        "dob": "2018-10-17",
        "gender": "Male",
        "parent_name": "Ebonce Agboye",
        "parent_phone": "07031102194",
    },
    {
        "name": "Menkinda Ambriel",
        "code": "3329",
        "dob": "2018-10-16",
        "gender": "Female",
        "parent_name": "Mr & Mrs West",
        "parent_phone": "08032715190",
    },
    {
        "name": "Michael Precious",
        "code": "3024",
        "dob": "2019-01-05",
        "gender": "Female",
        "parent_name": "Mr & Mrs Michael",
        "parent_phone": "08102326088",
    },
    {
        "name": "Columbus Joseph",
        "code": "3058",
        "dob": "2017-12-15",
        "gender": "Male",
        "parent_name": "Mr & Mrs Columbus",
        "parent_phone": "08036665427",
    },
    {
        "name": "Timothy Orji Mordecai",
        "code": "3811",
        "dob": "2017-12-15",
        "gender": "Male",
        "parent_name": "Mr & Mrs Timothy",
        "parent_phone": "08031903644",
    },
    {
        "name": "Nsikak Emmanuel Destiny",
        "code": "3968",
        "dob": "2018-06-11",
        "gender": "Male",
        "parent_name": "Mr & Mrs Nsikak",
        "parent_phone": "08038667428",
    },
    {
        "name": "Osita Omasirichukwu",
        "code": "3125",
        "dob": "2019-02-03",
        "gender": "Male",
        "parent_name": "Mr & Mrs Osita",
        "parent_phone": "07067278391",
    },
    {
        "name": "Kian Ebikpo C. Thompson",
        "code": "4093",
        "dob": "2015-04-17",
        "gender": "Male",
        "parent_name": "Mr & Mrs Thompson",
        "parent_phone": "07065252362",
    },
    {
        "name": "Bennett Ayimoni",
        "code": "3166",
        "dob": "2018-08-14",
        "gender": "Male",
        "parent_name": "Mr & Mrs Bennett",
        "parent_phone": "07069789781",
    },
    {
        "name": "Pekene Ayibakuro",
        "code": "3167",
        "dob": "2018-05-19",
        "gender": "Male",
        "parent_name": "Mr & Mrs Pekene",
        "parent_phone": "07069789781",
    },
    {
        "name": "Jeremy Chimdike",
        "code": "3972",
        "dob": "2019-03-19",
        "gender": "Male",
        "parent_name": "Mrs Jane Peters",
        "parent_phone": "07069789781",
    },
    {
        "name": "Odi Audriann",
        "code": "3441",
        "dob": "2019-07-11",
        "gender": "Female",
        "parent_name": "Mr & Mrs Odi",
        "parent_phone": "07030981881",
    },
    {
        "name": "Precious Joseph",
        "code": "3025",
        "dob": "2018-09-20",
        "gender": "Female",
        "parent_name": "Mr & Mrs Joseph",
        "parent_phone": "08035580967",
    },
    {
        "name": "Daniella Ogolo",
        "code": "3026",
        "dob": "2014-09-20",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ogolo",
        "parent_phone": "08035580967",
    },
    {
        "name": "Opuofia Diepreye",
        "code": "3270",
        "dob": "2016-07-08",
        "gender": "Male",
        "parent_name": "Mr Opuofia",
        "parent_phone": "08035580967",
    },
    {
        "name": "Ajuju Princess",
        "code": "3135",
        "dob": "2017-06-22",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ajuju",
        "parent_phone": "08036113305",
    },
    {
        "name": "Odum Laura Kamsi",
        "code": "3110",
        "dob": "2016-05-26",
        "gender": "Female",
        "parent_name": "Mr & Mrs Odum",
        "parent_phone": "07037252140",
    },
    {
        "name": "Ezike Khillah",
        "code": "3823",
        "dob": "2019-05-19",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ezike",
        "parent_phone": "07065206876",
    },
    {
        "name": "Joel Brielle Keleebari",
        "code": "3193",
        "dob": "2019-03-25",
        "gender": "Female",
        "parent_name": "Joel Barkpoa",
        "parent_phone": "08039417329",
    },
    {
        "name": "Lawson Oyenmomeni",
        "code": "3943",
        "dob": "2019-03-25",
        "gender": "Female",
        "parent_name": "Mr & Mrs Lawson",
        "parent_phone": "09038045041",
    },
    {
        "name": "Nwanyibo Sochikanyima",
        "code": "3165",
        "dob": "2019-02-14",
        "gender": "Female",
        "parent_name": "Chief Obrekwe",
        "parent_phone": "08039106445",
    },
    {
        "name": "Adikoko Seiyefa",
        "code": "3969",
        "dob": "2018-06-11",
        "gender": "Female",
        "parent_name": "Adikoko Ebitimi",
        "parent_phone": "08055546562",
    },
    {
        "name": "Diwene Nsikak E.",
        "code": "3156",
        "dob": "2017-09-08",
        "gender": "Male",
        "parent_name": "Mr & Mrs Nsikak",
        "parent_phone": "08038667428",
    },
    {
        "name": "Marksonel Pere-ere",
        "code": "3582",
        "dob": "2019-02-16",
        "gender": "Female",
        "parent_name": "Mr & Mrs Markson",
        "parent_phone": "07031921596",
    },
    {
        "name": "Akhimien Eliora",
        "code": "3326",
        "dob": "2019-01-27",
        "gender": "Female",
        "parent_name": "Pst & Mrs Akhimien",
        "parent_phone": "07032615797",
    },
    {
        "name": "Bright Ayebakuro",
        "code": "3048",
        "dob": "2018-08-15",
        "gender": "Male",
        "parent_name": "Mr & Mrs Bright",
        "parent_phone": "08137503522",
    },
    {
        "name": "Elaye Dewon",
        "code": "3812",
        "dob": "2018-08-15",
        "gender": "Male",
        "parent_name": "Mr & Mrs Bright",
        "parent_phone": "08038009671",
    },
    {
        "name": "Ozori Woyengivari",
        "code": "3451",
        "dob": "2018-11-11",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ozori",
        "parent_phone": "08067983219",
    },
    {
        "name": "Lucious Johnbull",
        "code": "3216",
        "dob": "2018-10-09",
        "gender": "Male",
        "parent_name": "Mr & Mrs Johnbull",
        "parent_phone": "08060829850",
    },
    {
        "name": "Alfred Evo-Dabo",
        "code": "3868",
        "dob": "2019-01-30",
        "gender": "Male",
        "parent_name": "Alfred Ebi Dan-Apu",
        "parent_phone": "07030943601",
    },
    {
        "name": "Gregory A. Moko",
        "code": "3277",
        "dob": "2019-04-09",
        "gender": "Male",
        "parent_name": "Mr & Mrs Moko",
        "parent_phone": "08038465522",
    },
    {
        "name": "Caleb Valentine",
        "code": "3914",
        "dob": "2019-04-09",
        "gender": "Male",
        "parent_name": "Mr & Mrs Valentine",
        "parent_phone": "08060703608",
    },
    {
        "name": "James Brisibe",
        "code": "3720",
        "dob": "2019-05-26",
        "gender": "Male",
        "parent_name": "Royal James",
        "parent_phone": "07034268229",
    },
    {
        "name": "Akuna Tokoni Jody",
        "code": "3721",
        "dob": "2019-05-26",
        "gender": "Female",
        "parent_name": "Mr & Mrs Akuna",
        "parent_phone": "08035446039",
    },
    {
        "name": "Elekambote Kporodioti",
        "code": "3144",
        "dob": "2018-10-02",
        "gender": "Male",
        "parent_name": "Mr & Mrs Elekambote",
        "parent_phone": "08132420708",
    },
    {
        "name": "Ayebakuro OS Pekene",
        "code": "3167-2",
        "dob": "2018-05-19",
        "gender": "Male",
        "parent_name": "Mr & Mrs Pekene",
        "parent_phone": "07069789781",
    },
]

def format_student_email(full_name, code=None):
    clean = full_name.lower().replace('.', ' ').replace('-', ' ')
    clean = ''.join([c for c in clean if c.isalpha() or c.isspace()])
    parts = [p.strip() for p in clean.split() if p.strip()]
    if not parts:
        return "student@tarepet.com"
    if len(parts) == 1:
        return f"{parts[0]}@tarepet.com"
    return f"{parts[0]}.{parts[-1]}@tarepet.com"

# Explicit purely-alphabetic emails for all Basic 3 pupils
STUDENT_EMAILS = {
    "3254": "shedrach.pereilaou@tarepet.com",
    "3211": "churchill.blossom@tarepet.com",
    "3324": "okoruwa.deborah@tarepet.com",
    "3581": "eliana.akhimien@tarepet.com",
    "4006": "tamara.kika@tarepet.com",
    "3984": "jeanetta.johnbo@tarepet.com",
    "3300": "ebibo.dressman@tarepet.com",
    "3301": "treasure.okeziri@tarepet.com",
    "3703": "christabel.eboboro@tarepet.com",
    "3953": "perekowei.abadi@tarepet.com",
    "3329": "ambriel.menkinda@tarepet.com",
    "3024": "precious.michael@tarepet.com",
    "3058": "joseph.columbus@tarepet.com",
    "3811": "mordecai.timothy@tarepet.com",
    "3968": "destiny.nsikak@tarepet.com",
    "3125": "omasirichukwu.osita@tarepet.com",
    "4093": "kian.thompson@tarepet.com",
    "3166": "ayimoni.bennett@tarepet.com",
    "3167": "ayibakuro.pekene@tarepet.com",
    "3972": "jeremy.chimdike@tarepet.com",
    "3441": "audriann.odi@tarepet.com",
    "3025": "precious.joseph@tarepet.com",
    "3026": "daniella.ogolo@tarepet.com",
    "3270": "diepreye.opuofia@tarepet.com",
    "3135": "princess.ajuju@tarepet.com",
    "3110": "laura.odum@tarepet.com",
    "3823": "khillah.ezike@tarepet.com",
    "3193": "brielle.joel@tarepet.com",
    "3943": "oyenmomeni.lawson@tarepet.com",
    "3165": "sochikanyima.nwanyibo@tarepet.com",
    "3969": "seiyefa.adikoko@tarepet.com",
    "3156": "diwene.nsikak@tarepet.com",
    "3582": "pereere.marksonel@tarepet.com",
    "3326": "eliora.akhimien@tarepet.com",
    "3048": "ayebakuro.bright@tarepet.com",
    "3812": "elaye.dewon@tarepet.com",
    "3451": "woyengivari.ozori@tarepet.com",
    "3216": "lucious.johnbull@tarepet.com",
    "3868": "alfred.evodabo@tarepet.com",
    "3277": "gregory.moko@tarepet.com",
    "3914": "caleb.valentine@tarepet.com",
    "3720": "james.brisibe@tarepet.com",
    "3721": "tokoni.akuna@tarepet.com",
    "3144": "kporodioti.elekambote@tarepet.com",
    "3167-2": "ayebakuro.os.pekene@tarepet.com",
}

def seed_basic3():
    print(f"[SEED] Seeding {len(BASIC_3_PUPILS)} Basic 3 Pupils into Tarepet LMS (No Numbers in Emails)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, item in enumerate(BASIC_3_PUPILS, start=1):
        name = item["name"]
        code = item["code"]
        dob = item.get("dob")
        gender = item.get("gender", "Male")
        parent_name = item.get("parent_name", "")
        parent_phone = item.get("parent_phone", "")

        student_id = f"TMS/BSC3/{code}"
        email = STUDENT_EMAILS.get(code, format_student_email(name))
        name_parts = name.split()
        first_name = name_parts[0] if name_parts else name
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Student"

        # Try by exact new username first
        user = User.objects.filter(username=student_id).first()
        created = False

        if user is None:
            user = User.objects.filter(email=email).first()
            if user is not None:
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
                "grade_level": "Basic 3",
                "gender": gender,
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Montessori Primary Basic Education",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "Basic 3"
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

        print(f"  [{idx}/{len(BASIC_3_PUPILS)}] {student_id} - {name} ({email})", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated ({len(BASIC_3_PUPILS)} total Basic 3 pupils).", flush=True)

if __name__ == "__main__":
    seed_basic3()

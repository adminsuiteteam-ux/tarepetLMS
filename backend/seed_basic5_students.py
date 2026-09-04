import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

BASIC_5_PUPILS = [
    {
        "name": "Polo Erica",
        "code": "2718",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Odi Ellora",
        "code": "3445",
        "dob": "2017-06-02",
        "gender": "Female",
        "parent_name": "Mr & Mrs Odi",
        "parent_phone": "07030981581",
    },
    {
        "name": "Wanogho Arabella",
        "code": "2286",
        "dob": "2017-04-18",
        "gender": "Female",
        "parent_name": "Mr & Mrs Wanogho",
        "parent_phone": "08063915395",
    },
    {
        "name": "Eder Gabriella",
        "code": "2720",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Jim-Dorgu Divine",
        "code": "4065",
        "dob": "2016-07-11",
        "gender": "Female",
        "parent_name": "Mr & Mrs Jim-Dorgu",
        "parent_phone": "08032338313",
    },
    {
        "name": "Okon Favour Bassey",
        "code": "2304",
        "dob": "2016-07-20",
        "gender": "Female",
        "parent_name": "Mr & Mrs Okon",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Nelson Abel Sikpi",
        "code": "3352",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr & Mrs Sikpi",
        "parent_phone": "07066770510",
    },
    {
        "name": "Chico Treasure E.",
        "code": "3528",
        "dob": "2017-11-25",
        "gender": "Female",
        "parent_name": "Mr & Mrs Chico",
        "parent_phone": "08064305584",
    },
    {
        "name": "Agodo Chidera M.",
        "code": "3818",
        "dob": "2017-07-07",
        "gender": "Male",
        "parent_name": "Mr & Mrs Agodo",
        "parent_phone": "08208461604",
    },
    {
        "name": "Isowo Abigail E.",
        "code": "3219",
        "dob": "2017-02-07",
        "gender": "Female",
        "parent_name": "Mr & Mrs Isowo",
        "parent_phone": "08056077780",
    },
    {
        "name": "Gesuye Bliss",
        "code": "4060",
        "dob": "2018-02-19",
        "gender": "Female",
        "parent_name": "Mr Gesuye Amgbare",
        "parent_phone": "08035425884",
    },
    {
        "name": "Trophy Emmanuel",
        "code": "3411",
        "dob": "2017-04-11",
        "gender": "Male",
        "parent_name": "Trophy Kimifagha",
        "parent_phone": "07062469494",
    },
    {
        "name": "Kika Nathan",
        "code": "3913",
        "dob": "2017-03-20",
        "gender": "Male",
        "parent_name": "Bobby O. Kika",
        "parent_phone": "08035119945",
    },
    {
        "name": "Lisa Ekiye",
        "code": "3910",
        "dob": "2017-09-17",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ekiye",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Tom-Ama-ebe Tonye",
        "code": "2626",
        "dob": "2016-12-08",
        "gender": "Male",
        "parent_name": "Mr & Mrs Tonye-Amaegbe",
        "parent_phone": "08036665721",
    },
    {
        "name": "Houmo Derick",
        "code": "3138",
        "dob": "2017-05-14",
        "gender": "Male",
        "parent_name": "Captain Mary",
        "parent_phone": "07032239047",
    },
    {
        "name": "Famobio Abike",
        "code": "2314",
        "dob": "2017-04-13",
        "gender": "Female",
        "parent_name": "Mr & Mrs Famobio",
        "parent_phone": "08035416683",
    },
    {
        "name": "Woyungimieye Hanye",
        "code": "3706",
        "dob": "2017-04-13",
        "gender": "Female",
        "parent_name": "Hanye Nmiemo",
        "parent_phone": "08032636194",
    },
    {
        "name": "Kenneth Onizibe",
        "code": "2264",
        "dob": "2016-07-17",
        "gender": "Male",
        "parent_name": "Mr Kenneth",
        "parent_phone": "07062850557",
    },
    {
        "name": "Agibatari Tamunoemi",
        "code": "2991",
        "dob": "2017-09-05",
        "gender": "Male",
        "parent_name": "Mr Tamunoemi",
        "parent_phone": "08037973719",
    },
    {
        "name": "Emmanuel Michael",
        "code": "3023",
        "dob": "2016-12-05",
        "gender": "Male",
        "parent_name": "Mr & Mrs Michael",
        "parent_phone": "08102826088",
    },
    {
        "name": "Best-Gift Unique",
        "code": "4001",
        "dob": "2017-04-14",
        "gender": "Female",
        "parent_name": "Felix Bestgift",
        "parent_phone": "07064921762",
    },
    {
        "name": "Woyungiyefa Mebine",
        "code": "4048",
        "dob": "2017-06-02",
        "gender": "Female",
        "parent_name": "Mebine Deinbofa",
        "parent_phone": "08064348447",
    },
    {
        "name": "Precious E. Ayabataye",
        "code": "BSC5L-024",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Melchizedec Timothy",
        "code": "3810",
        "dob": "2016-08-20",
        "gender": "Male",
        "parent_name": "Mrs Timothy",
        "parent_phone": "08031903644",
    },
    {
        "name": "Christopher Bekewei",
        "code": "2765",
        "dob": "2016-12-11",
        "gender": "Male",
        "parent_name": "Bekewei",
        "parent_phone": "08025006692",
    },
    {
        "name": "Alaere Mark-Som",
        "code": "3244",
        "dob": "2018-01-28",
        "gender": "Female",
        "parent_name": "Mrs Marksons",
        "parent_phone": "07031921595",
    },
    {
        "name": "Haveel Tarasele",
        "code": "2871",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr & Mrs Tarasele",
        "parent_phone": "09030065707",
    },
    {
        "name": "Peyton Marie Grace",
        "code": "2948",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr & Mrs Mark",
        "parent_phone": "08032571235",
    },
    {
        "name": "Mitchell Isaiah",
        "code": "3745",
        "dob": "2017-04-14",
        "gender": "Female",
        "parent_name": "Mrs Isaiah",
        "parent_phone": "08032927475",
    },
    {
        "name": "Samuel Lloyd",
        "code": "3865",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr Lloyd",
        "parent_phone": "07062473004",
    },
    {
        "name": "Eugene Moon",
        "code": "3382",
        "dob": "2017-06-19",
        "gender": "Male",
        "parent_name": "Mr & Mrs Eugene",
        "parent_phone": "08064167591",
    },
    {
        "name": "Bogan Ayuju",
        "code": "2882",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ayuju",
        "parent_phone": "07062985529",
    },
    {
        "name": "Nateria Alfred",
        "code": "3120",
        "dob": "2016-10-03",
        "gender": "Female",
        "parent_name": "Mr & Mrs Alfred",
        "parent_phone": "07035329258",
    },
    {
        "name": "Agibatanye Erefamote",
        "code": "2308",
        "dob": "2017-06-19",
        "gender": "Female",
        "parent_name": "Mr & Mrs Erefamote",
        "parent_phone": "08068159504",
    },
    {
        "name": "Delight Tumipere",
        "code": "3153",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Elvis Diri",
        "code": "BSC5F-006",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Angel Forcebray",
        "code": "2850",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr & Mrs Forcebray",
        "parent_phone": "08026520294",
    },
    {
        "name": "Dinyanyeahi Nwafor",
        "code": "2297",
        "dob": "2017-08-14",
        "gender": "Female",
        "parent_name": "Mr & Mrs Nwafor",
        "parent_phone": "09038275896",
    },
    {
        "name": "Markena Walton",
        "code": "BSC5F-009",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Excel Eyego",
        "code": "3282B",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Jude Payebo",
        "code": "3625",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Emmanuella Joseph",
        "code": "3827",
        "dob": "2018-01-09",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Judith Ogbonn",
        "code": "BSC5F-013",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Chensh Kormene",
        "code": "2956",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr & Mrs Kormene",
        "parent_phone": "08035914833",
    },
    {
        "name": "Ayawani Kennedy Ikiriko",
        "code": "3819",
        "dob": "2013-03-03",
        "gender": "Male",
        "parent_name": "Mr & Mrs Ikiriko",
        "parent_phone": "07031144737",
    },
    {
        "name": "Peculiar Ezekiel Samuel",
        "code": "3808",
        "dob": "2017-10-30",
        "gender": "Male",
        "parent_name": "Patricia Ezekiel",
        "parent_phone": "08035084207",
    },
    {
        "name": "Miracle Dakolo",
        "code": "3532",
        "dob": "2017-11-13",
        "gender": "Female",
        "parent_name": "Mr & Mrs Chico",
        "parent_phone": "080335084207",
    },
    {
        "name": "Nwnoghefeite James",
        "code": "2816",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr & Mrs James",
        "parent_phone": "09035919316",
    },
    {
        "name": "Faweri Emmanuel Nsikak",
        "code": "3967",
        "dob": "2016-12-07",
        "gender": "Male",
        "parent_name": "Mr & Mrs Nsikak",
        "parent_phone": "08038667425",
    },
    {
        "name": "Praise Benangba",
        "code": "4022",
        "dob": "2016-07-18",
        "gender": "Male",
        "parent_name": "Mr & Mrs Benangba",
        "parent_phone": "08037729554",
    },
    {
        "name": "Ogbinoyengigh Ebirowo",
        "code": "4041",
        "dob": "2015-07-14",
        "gender": "Female",
        "parent_name": "Mr & Mrs Ebirowo",
        "parent_phone": "07062484153",
    },
    {
        "name": "Tamunowie Williams",
        "code": "3224",
        "dob": "2014-04-23",
        "gender": "Female",
        "parent_name": "Pulinne Williams",
        "parent_phone": "08035800852",
    },
    {
        "name": "Idomu Kelvin",
        "code": "2939",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Mr & Mrs Idomu",
        "parent_phone": "08032347662",
    },
    {
        "name": "Nwachukwu Pencil",
        "code": "BSC5F-024",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Lawson Providence",
        "code": "3713",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Ihim Godstime Uye",
        "code": "3077",
        "dob": "2016-04-26",
        "gender": "Male",
        "parent_name": "Ucleme Uye",
        "parent_phone": "08032134104",
    },
    {
        "name": "Omonfonn Isabella",
        "code": "3436",
        "dob": "2015-06-06",
        "gender": "Female",
        "parent_name": "Omonfom Rebecca",
        "parent_phone": "07039247157",
    },
    {
        "name": "Edidi Clark",
        "code": "3189",
        "dob": "2017-06-12",
        "gender": "Male",
        "parent_name": "Mr & Mrs Edidi",
        "parent_phone": "08034474382",
    },
    {
        "name": "Dede Pere Tann",
        "code": "3111",
        "dob": "2017-10-01",
        "gender": "Male",
        "parent_name": "Kari Monica",
        "parent_phone": "08060533924",
    },
    {
        "name": "Richard Shalom",
        "code": "3142",
        "dob": "2017-02-24",
        "gender": "Female",
        "parent_name": "Mr & Mrs Richard",
        "parent_phone": "08030702751",
    },
    {
        "name": "Nwachukwu Chukwuemerie D",
        "code": "BSC5F-031",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Nwonyeji Ebebechukwuson",
        "code": "3942",
        "dob": "2017-09-03",
        "gender": "Male",
        "parent_name": "Chief Obiekwe",
        "parent_phone": "08081104445",
    },
    {
        "name": "Efeh Nelson Ebitimi",
        "code": "3121",
        "dob": "2018-05-14",
        "gender": "Male",
        "parent_name": "Mr & Mrs Efeh",
        "parent_phone": "07025419687",
    },
    {
        "name": "Diri Greatness",
        "code": "3154",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Michael Unguo Presuedo",
        "code": "3951",
        "dob": "2016-07-14",
        "gender": "Male",
        "parent_name": "Victory George",
        "parent_phone": "08160228607",
    },
    {
        "name": "Amakiri Ibiba Jeremiab",
        "code": "3526",
        "dob": "2017-05-23",
        "gender": "Male",
        "parent_name": "Mercy Thomas",
        "parent_phone": "08067251344",
    },
    {
        "name": "Iferghele Livia",
        "code": "3732",
        "dob": "2019-06-16",
        "gender": "Female",
        "parent_name": "Aferghele O",
        "parent_phone": "08139122013",
    },
    {
        "name": "Jubril Khalifa",
        "code": "3881",
        "dob": "2017-06-14",
        "gender": "Male",
        "parent_name": "Joseph Jubril",
        "parent_phone": "09037949497",
    },
    {
        "name": "Emmanuel Joshua",
        "code": "3870",
        "dob": "2018-01-14",
        "gender": "Male",
        "parent_name": "Emmanuel Balogun",
        "parent_phone": "08066763455",
    },
    {
        "name": "Theophilus Bismarck",
        "code": "3101",
        "dob": "2018-08-11",
        "gender": "Male",
        "parent_name": "Mr & Mrs Theophilus",
        "parent_phone": "08065387160",
    },
    {
        "name": "Epidei Graceous",
        "code": "3290",
        "dob": "2018-01-01",
        "gender": "Female",
        "parent_name": "Mr & Mrs Epidei",
        "parent_phone": "09013122465",
    },
    {
        "name": "Omiediekuma Blissful",
        "code": "3564",
        "dob": "2017-06-04",
        "gender": "Female",
        "parent_name": "David & Mrs Omiediekuma",
        "parent_phone": "08069415574",
    },
    {
        "name": "Ngbemene Okwudili Destiny",
        "code": "3744",
        "dob": "2016-12-14",
        "gender": "Male",
        "parent_name": "Mr Okwudili",
        "parent_phone": "09035062294",
    },
    {
        "name": "Jim-Dorgu Esther Aye",
        "code": "4063",
        "dob": "2018-05-08",
        "gender": "Female",
        "parent_name": "Mr & Mrs Jim-Dorgu",
        "parent_phone": "07036543578",
    },
    {
        "name": "Asiq E. Rejoice",
        "code": "4054",
        "dob": "2018-08-20",
        "gender": "Female",
        "parent_name": "Mr & Mrs Asiq",
        "parent_phone": "07036303791",
    },
    {
        "name": "Osia Dennian A",
        "code": "3900",
        "dob": "2018-05-24",
        "gender": "Male",
        "parent_name": "Mr & Mrs Osia",
        "parent_phone": "07014256308",
    },
    {
        "name": "Lucky Success",
        "code": "BSC5F-047",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Kung-wa Go Emmanuel",
        "code": "BSC5F-048",
        "dob": "Not Provided",
        "gender": "Male",
        "parent_name": "Not Provided",
        "parent_phone": "Not Provided",
    },
    {
        "name": "Johnson Favour",
        "code": "2830",
        "dob": "Not Provided",
        "gender": "Female",
        "parent_name": "Mr & Mrs Johnson",
        "parent_phone": "0708989895",
    },
    {
        "name": "Egbenibo Aurelia",
        "code": "3533",
        "dob": "2017-01-09",
        "gender": "Female",
        "parent_name": "Mrs Egbenibo",
        "parent_phone": "08033621215",
    },
    {
        "name": "Elemchukwu Egunna G",
        "code": "3573",
        "dob": "2017-04-17",
        "gender": "Male",
        "parent_name": "Happiness Ididi",
        "parent_phone": "08152319407",
    },
    {
        "name": "Eyikeme Solomon",
        "code": "3756",
        "dob": "2017-05-10",
        "gender": "Male",
        "parent_name": "Mrs Eyikeme",
        "parent_phone": "08037245695",
    },
    {
        "name": "Eloguene Akpezi",
        "code": "3581",
        "dob": "2019-04-10",
        "gender": "Female",
        "parent_name": "Mr & Mrs Wovusebse",
        "parent_phone": "08120156233",
    },
]

def seed_basic_5_pupils():
    print(f"[*] Starting Basic 5 student seeding (84 pupils)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, pupil in enumerate(BASIC_5_PUPILS, 1):
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

        student_id = f"TMS/BSC5/{code}"

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
                "grade_level": "Basic 5",
                "gender": gender if gender != "Not Provided" else "Not Specified",
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Montessori Primary Basic Education",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "Basic 5"
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

        print(f"  [{idx}/84] {student_id} - {name}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated (84 total Basic 5 pupils).", flush=True)

if __name__ == "__main__":
    seed_basic_5_pupils()

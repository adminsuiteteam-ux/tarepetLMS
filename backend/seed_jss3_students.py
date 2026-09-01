import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

JSS3_PUPILS = [
    # ── Page 1: Entries 1 to 22 ──
    {
        "name": "Briggs Eluan Motu",
        "code": "3394",
        "dob": "2012-05-20",
        "gender": "Male",
        "email": "eluan.briggs@tarepet.com",
        "parent_name": "Mr & Mrs Mcfall",
        "parent_phone": "08037219680",
    },
    {
        "name": "Polo Pearl Tamara",
        "code": "3893",
        "dob": "2011-02-14",
        "gender": "Female",
        "email": "pearl.polo@tarepet.com",
        "parent_name": "Mr & Mrs Ikaebimo",
        "parent_phone": "07060800941",
    },
    {
        "name": "Ikaebimo Ayebaekipreye",
        "code": "3850",
        "dob": "2011-07-23",
        "gender": "Female",
        "email": "ayebaekipreye.ikaebimo@tarepet.com",
        "parent_name": "Chief & Mrs Ere",
        "parent_phone": "07069572455",
    },
    {
        "name": "Ere Glory Oyintonbra",
        "code": "3837",
        "dob": "2013-10-05",
        "gender": "Female",
        "email": "glory.ere@tarepet.com",
        "parent_name": "Engr Jongosi",
        "parent_phone": "08039108040",
    },
    {
        "name": "Yongosi Ebifie Love",
        "code": "4101",
        "dob": "2012-08-15",
        "gender": "Female",
        "email": "love.yongosi@tarepet.com",
        "parent_name": "Mr & Mrs Jongosi",
        "parent_phone": "08039108040",
    },
    {
        "name": "Eke Oyindoubara",
        "code": "3152",
        "dob": "2012-03-18",
        "gender": "Male",
        "email": "oyindoubara.eke@tarepet.com",
        "parent_name": "Mr & Mrs Eke",
        "parent_phone": "08038195580",
    },
    {
        "name": "Diri Stephanie",
        "code": "4102",
        "dob": "2013-04-12",
        "gender": "Female",
        "email": "stephanie.diri@tarepet.com",
        "parent_name": "Mr & Mrs Diri",
        "parent_phone": "08038195580",
    },
    {
        "name": "Nimi Kelly",
        "code": "4103",
        "dob": "2012-11-20",
        "gender": "Male",
        "email": "kelly.nimi@tarepet.com",
        "parent_name": "Mr & Mrs Kelly",
        "parent_phone": "08033707637",
    },
    {
        "name": "Okpara Excel Oluchukwu",
        "code": "3853",
        "dob": "2011-07-29",
        "gender": "Male",
        "email": "excel.okpara@tarepet.com",
        "parent_name": "Mr & Mrs Okpara",
        "parent_phone": "08033707637",
    },
    {
        "name": "Usigbe Rex Cyril",
        "code": "3833",
        "dob": "2014-10-01",
        "gender": "Male",
        "email": "rex.usigbe@tarepet.com",
        "parent_name": "Mr & Mrs Usigbe",
        "parent_phone": "08032624848",
    },
    {
        "name": "Mnabaihe Favour",
        "code": "3717",
        "dob": "2012-09-10",
        "gender": "Female",
        "email": "favour.mnabaihe@tarepet.com",
        "parent_name": "Dr Lawson",
        "parent_phone": "08035985157",
    },
    {
        "name": "Lawson Martha",
        "code": "4104",
        "dob": "2013-01-15",
        "gender": "Female",
        "email": "martha.lawson@tarepet.com",
        "parent_name": "Dr Lawson",
        "parent_phone": "08035985157",
    },
    {
        "name": "Goumenen Oweibo Joy",
        "code": "2189",
        "dob": "2013-01-24",
        "gender": "Female",
        "email": "joy.goumenen@tarepet.com",
        "parent_name": "Digha Nelson",
        "parent_phone": "08035985157",
    },
    {
        "name": "Ogbu Victor",
        "code": "3953",
        "dob": "2014-06-01",
        "gender": "Male",
        "email": "victor.ogbu@tarepet.com",
        "parent_name": "Mr & Mrs Imbimoh",
        "parent_phone": "08035435685",
    },
    {
        "name": "Imbimoh Anthony Adriel",
        "code": "4105",
        "dob": "2013-08-19",
        "gender": "Male",
        "email": "anthony.imbimoh@tarepet.com",
        "parent_name": "Mr & Mrs Imbimoh",
        "parent_phone": "08033911539",
    },
    {
        "name": "Iwu Marcelous",
        "code": "3525",
        "dob": "2013-06-13",
        "gender": "Male",
        "email": "marcelous.iwu@tarepet.com",
        "parent_name": "Mr & Mrs Eze",
        "parent_phone": "08140126070",
    },
    {
        "name": "Eze Jude",
        "code": "3934",
        "dob": "2013-10-12",
        "gender": "Male",
        "email": "jude.eze@tarepet.com",
        "parent_name": "Azza Ogbonna",
        "parent_phone": "08035573019",
    },
    {
        "name": "Ogbonna Precious Nneoma",
        "code": "3848",
        "dob": "2014-05-03",
        "gender": "Female",
        "email": "precious.ogbonna@tarepet.com",
        "parent_name": "Mr & Mrs Owei",
        "parent_phone": "08037860837",
    },
    {
        "name": "Owei Bigboye Merrilyn",
        "code": "4106",
        "dob": "2013-03-22",
        "gender": "Female",
        "email": "merrilyn.owei@tarepet.com",
        "parent_name": "Mr & Mrs Owei",
        "parent_phone": "08037860837",
    },
    {
        "name": "Jideri Godiya",
        "code": "3845",
        "dob": "2012-12-05",
        "gender": "Female",
        "email": "godiya.jideri@tarepet.com",
        "parent_name": "Mr & Mrs Jideri",
        "parent_phone": "07038678427",
    },
    {
        "name": "Agnikpura Oloyinkuro",
        "code": "3839",
        "dob": "2012-06-14",
        "gender": "Male",
        "email": "oloyinkuro.agnikpura@tarepet.com",
        "parent_name": "Opuene Douglas",
        "parent_phone": "08037648708",
    },
    {
        "name": "Opuene Mira Aschinam",
        "code": "4107",
        "dob": "2013-09-28",
        "gender": "Female",
        "email": "mira.opuene@tarepet.com",
        "parent_name": "Opuene Douglas",
        "parent_phone": "08037648708",
    },

    # ── Page 2: Entries 23 to 44 ──
    {
        "name": "Diepreye Praise Titus",
        "code": "2210",
        "dob": "2011-07-15",
        "gender": "Female",
        "email": "praise.diepreye@tarepet.com",
        "parent_name": "Mr Titus",
        "parent_phone": "09068654712",
    },
    {
        "name": "Ogbara Gwon Izibefie",
        "code": "4016",
        "dob": "2010-09-27",
        "gender": "Male",
        "email": "gwon.ogbara@tarepet.com",
        "parent_name": "Chief & Mrs Ogbara",
        "parent_phone": "08066571993",
    },
    {
        "name": "Ezekiel Wilfred Samuel",
        "code": "4045",
        "dob": "2011-04-16",
        "gender": "Male",
        "email": "wilfred.ezekiel@tarepet.com",
        "parent_name": "Patricia Ezekiel",
        "parent_phone": "08086548245",
    },
    {
        "name": "Idauye Clarc Divine",
        "code": "3963",
        "dob": "2012-10-18",
        "gender": "Male",
        "email": "clarc.idauye@tarepet.com",
        "parent_name": "Mr & Mrs Idauye",
        "parent_phone": "08086548245",
    },
    {
        "name": "Joshua Bodongefa",
        "code": "2926",
        "dob": "2011-03-29",
        "gender": "Male",
        "email": "bodongefa.joshua@tarepet.com",
        "parent_name": "Bodongefa Otoi",
        "parent_phone": "08035728200",
    },
    {
        "name": "Fawei Emmanuel",
        "code": "3844",
        "dob": "2014-01-06",
        "gender": "Male",
        "email": "emmanuel.fawei@tarepet.com",
        "parent_name": "Douyari Benjami",
        "parent_phone": "08030852977",
    },
    {
        "name": "Eyindongha Sylvia",
        "code": "4108",
        "dob": "2013-05-11",
        "gender": "Female",
        "email": "sylvia.eyindongha@tarepet.com",
        "parent_name": "Mr & Mrs Eyindongha",
        "parent_phone": "08030852977",
    },
    {
        "name": "Ingiy Gold Chimeremeze",
        "code": "4109",
        "dob": "2012-11-04",
        "gender": "Female",
        "email": "gold.ingiy@tarepet.com",
        "parent_name": "Mr & Mrs Ingiy",
        "parent_phone": "08009689137",
    },
    {
        "name": "Preye Michael",
        "code": "3854",
        "dob": "2014-08-01",
        "gender": "Male",
        "email": "michael.preye@tarepet.com",
        "parent_name": "Mr & Mrs Ezon-ebi",
        "parent_phone": "08009689137",
    },
    {
        "name": "Columbus Wisdom",
        "code": "3626",
        "dob": "2014-02-27",
        "gender": "Male",
        "email": "wisdom.columbus@tarepet.com",
        "parent_name": "Mr & Mrs Uchenna",
        "parent_phone": "08037348110",
    },
    {
        "name": "Ezon-ebi Ebiagerake",
        "code": "4110",
        "dob": "2013-07-19",
        "gender": "Female",
        "email": "ebiagerake.ezonebi@tarepet.com",
        "parent_name": "Mr & Mrs Ezon-ebi",
        "parent_phone": "08037348110",
    },
    {
        "name": "Uchenna Precious",
        "code": "4010",
        "dob": "2011-04-26",
        "gender": "Female",
        "email": "precious.uchenna@tarepet.com",
        "parent_name": "Mr & Mrs Enahoro",
        "parent_phone": "08064256922",
    },
    {
        "name": "Timiebi Tokoni Destiny",
        "code": "4111",
        "dob": "2012-08-23",
        "gender": "Female",
        "email": "tokoni.timiebi@tarepet.com",
        "parent_name": "Mr & Mrs Timiebi",
        "parent_phone": "08064256922",
    },
    {
        "name": "Enahoro Fredrick",
        "code": "3851",
        "dob": "2011-08-25",
        "gender": "Male",
        "email": "fredrick.enahoro@tarepet.com",
        "parent_name": "Edwin Vincent",
        "parent_phone": "08002226442",
    },
    {
        "name": "Konyefa Joseph",
        "code": "4112",
        "dob": "2012-03-17",
        "gender": "Male",
        "email": "joseph.konyefa@tarepet.com",
        "parent_name": "Mr & Mrs Konyefa",
        "parent_phone": "08002226442",
    },
    {
        "name": "Olaedo Pearl Edwin",
        "code": "3836",
        "dob": "2011-08-20",
        "gender": "Female",
        "email": "pearl.olaedo@tarepet.com",
        "parent_name": "Mr & Mrs Udeme",
        "parent_phone": "09066248055",
    },
    {
        "name": "Abraham Johnson I.",
        "code": "3524",
        "dob": "2010-07-16",
        "gender": "Male",
        "email": "johnson.abraham@tarepet.com",
        "parent_name": "Mr & Mrs Eze",
        "parent_phone": "08140126070",
    },
    {
        "name": "Pekene Roseadella",
        "code": "3252",
        "dob": "2011-09-30",
        "gender": "Female",
        "email": "roseadella.pekene@tarepet.com",
        "parent_name": "Mr & Mrs Izedu",
        "parent_phone": "08033923760",
    },
    {
        "name": "Cliflua Udeme Akpan",
        "code": "4055",
        "dob": "2012-07-06",
        "gender": "Male",
        "email": "udeme.cliflua@tarepet.com",
        "parent_name": "Anmiri Edmond",
        "parent_phone": "08037058871",
    },
    {
        "name": "Eze Marycynthia Chizom",
        "code": "4113",
        "dob": "2013-11-12",
        "gender": "Female",
        "email": "marycynthia.eze@tarepet.com",
        "parent_name": "Mr & Mrs Eze",
        "parent_phone": "08037058871",
    },
    {
        "name": "Emmanuel Favour Ombline",
        "code": "4114",
        "dob": "2012-04-19",
        "gender": "Female",
        "email": "favour.emmanuel@tarepet.com",
        "parent_name": "Mr & Mrs Emmanuel",
        "parent_phone": "08037058871",
    },
    {
        "name": "Amirin Fortune T.",
        "code": "4115",
        "dob": "2011-12-02",
        "gender": "Male",
        "email": "fortune.amirin@tarepet.com",
        "parent_name": "Anmiri Edmond",
        "parent_phone": "08037058871",
    },

    # ── Page 3: Entries 45 to 66 ──
    {
        "name": "Ebiware Wisdom Tamara",
        "code": "3935",
        "dob": "2011-04-15",
        "gender": "Male",
        "email": "wisdom.ebiware@tarepet.com",
        "parent_name": "Ebiware Wisdom",
        "parent_phone": "08105913293",
    },
    {
        "name": "Kormene Manuelou C.",
        "code": "2292",
        "dob": "2013-07-22",
        "gender": "Male",
        "email": "manuelou.kormene@tarepet.com",
        "parent_name": "Mr Wanogho",
        "parent_phone": "08063915395",
    },
    {
        "name": "Nelson Wanogho Apotha",
        "code": "3914",
        "dob": "2014-05-07",
        "gender": "Male",
        "email": "wanogho.nelson@tarepet.com",
        "parent_name": "Chief Nwonyibo",
        "parent_phone": "08039106445",
    },
    {
        "name": "Nwonyibo Obiekwe C.",
        "code": "3608",
        "dob": "2012-06-18",
        "gender": "Male",
        "email": "obiekwe.nwonyibo@tarepet.com",
        "parent_name": "Mr & Mrs Egbelegi",
        "parent_phone": "08035373051",
    },
    {
        "name": "Ogogo Treasure Perere",
        "code": "4116",
        "dob": "2013-03-14",
        "gender": "Female",
        "email": "treasure.ogogo@tarepet.com",
        "parent_name": "Mr & Mrs Ogogo",
        "parent_phone": "08035373051",
    },
    {
        "name": "Egbelegi Harold T.",
        "code": "3410",
        "dob": "2014-09-07",
        "gender": "Male",
        "email": "harold.egbelegi@tarepet.com",
        "parent_name": "Irophy Kirifagha",
        "parent_phone": "08035425895",
    },
    {
        "name": "Akabou Abigail T.",
        "code": "4049",
        "dob": "2010-09-30",
        "gender": "Female",
        "email": "abigail.akabou@tarepet.com",
        "parent_name": "Tobon Lucky",
        "parent_phone": "08033860224",
    },
    {
        "name": "Gesige Joshua W.",
        "code": "4117",
        "dob": "2012-10-08",
        "gender": "Male",
        "email": "joshua.gesige@tarepet.com",
        "parent_name": "Mr & Mrs Gesige",
        "parent_phone": "08033860224",
    },
    {
        "name": "Irophy Glory Ebimi",
        "code": "3225",
        "dob": "2011-01-15",
        "gender": "Female",
        "email": "glory.irophy@tarepet.com",
        "parent_name": "Williams Pillome",
        "parent_phone": "08035008552",
    },
    {
        "name": "Tobon Emmanuel L.",
        "code": "3944",
        "dob": "2011-10-26",
        "gender": "Male",
        "email": "emmanuel.tobon@tarepet.com",
        "parent_name": "Patricia Samuel",
        "parent_phone": "07031144737",
    },
    {
        "name": "Abazza Bodisere Praise",
        "code": "2152",
        "dob": "2013-06-20",
        "gender": "Female",
        "email": "bodisere.abazza@tarepet.com",
        "parent_name": "Mr & Mrs Princewill",
        "parent_phone": "08034312287",
    },
    {
        "name": "Isaiah Ezekiel Praise",
        "code": "3916",
        "dob": "2013-06-05",
        "gender": "Male",
        "email": "ezekiel.isaiah@tarepet.com",
        "parent_name": "Mr & Mrs Kenneth",
        "parent_phone": "07014381050",
    },
    {
        "name": "Sinoki Praise A.",
        "code": "3702",
        "dob": "2012-04-04",
        "gender": "Male",
        "email": "praise.sinoki@tarepet.com",
        "parent_name": "Mr & Mrs Sumon",
        "parent_phone": "08034849123",
    },
    {
        "name": "Ezekiel Miracle Samuel",
        "code": "4118",
        "dob": "2013-11-25",
        "gender": "Male",
        "email": "miracle.ezekiel@tarepet.com",
        "parent_name": "Mr & Mrs Ezekiel",
        "parent_phone": "08034849123",
    },
    {
        "name": "Ikogi Janet Isekpar",
        "code": "4119",
        "dob": "2012-08-14",
        "gender": "Female",
        "email": "janet.ikogi@tarepet.com",
        "parent_name": "Mr & Mrs Ikogi",
        "parent_phone": "08034849123",
    },
    {
        "name": "Egbo Sarabom Tecci",
        "code": "4120",
        "dob": "2013-02-28",
        "gender": "Female",
        "email": "sarabom.egbo@tarepet.com",
        "parent_name": "Mr & Mrs Egbo",
        "parent_phone": "08035918305",
    },
    {
        "name": "Kenneth Cynthia U.",
        "code": "4121",
        "dob": "2012-05-17",
        "gender": "Female",
        "email": "cynthia.kenneth@tarepet.com",
        "parent_name": "Mr & Mrs Kenneth",
        "parent_phone": "07014381050",
    },
    {
        "name": "Sumon S. Tibinkonbo-ere",
        "code": "4122",
        "dob": "2013-09-09",
        "gender": "Female",
        "email": "tibinkonboere.sumon@tarepet.com",
        "parent_name": "Mr & Mrs Sumon",
        "parent_phone": "08034849123",
    },
    {
        "name": "Bekewei David",
        "code": "4123",
        "dob": "2012-12-11",
        "gender": "Male",
        "email": "david.bekewei@tarepet.com",
        "parent_name": "Mr & Mrs Bekewei",
        "parent_phone": "08035918305",
    },
    {
        "name": "Baro Deborah",
        "code": "4124",
        "dob": "2013-04-03",
        "gender": "Female",
        "email": "deborah.baro@tarepet.com",
        "parent_name": "Mr & Mrs Baro",
        "parent_phone": "08035918305",
    },
    {
        "name": "Ugwu Faustina",
        "code": "4125",
        "dob": "2012-07-22",
        "gender": "Female",
        "email": "faustina.ugwu@tarepet.com",
        "parent_name": "Mr & Mrs Ugwu",
        "parent_phone": "08035918305",
    },
    {
        "name": "Pario Ayibadaerobra",
        "code": "4126",
        "dob": "2013-10-30",
        "gender": "Female",
        "email": "ayibadaerobra.pario@tarepet.com",
        "parent_name": "Mr & Mrs Pario",
        "parent_phone": "08035918305",
    },

    # ── Page 4: Entries 67 to 79 ──
    {
        "name": "Okafor Munachi",
        "code": "3652",
        "dob": "2012-12-16",
        "gender": "Female",
        "email": "munachi.okafor@tarepet.com",
        "parent_name": "Mr & Mrs Paul Boni Doni",
        "parent_phone": "08035918305",
    },
    {
        "name": "Azibayam Paul D.",
        "code": "4007",
        "dob": "2013-12-11",
        "gender": "Male",
        "email": "paul.azibayam@tarepet.com",
        "parent_name": "Mr & Mrs Ogbonna",
        "parent_phone": "07030867586",
    },
    {
        "name": "Richard Godwin O.",
        "code": "2614",
        "dob": "2013-08-01",
        "gender": "Male",
        "email": "godwin.richard@tarepet.com",
        "parent_name": "Mr & Mrs Ukaegbu",
        "parent_phone": "08034835134",
    },
    {
        "name": "Ukaegbu Sophia O.",
        "code": "3857",
        "dob": "2012-12-16",
        "gender": "Female",
        "email": "sophia.ukaegbu@tarepet.com",
        "parent_name": "Mr & Mrs Akegov",
        "parent_phone": "07069549468",
    },
    {
        "name": "Akegor Godspower D.",
        "code": "4127",
        "dob": "2012-05-19",
        "gender": "Male",
        "email": "godspower.akegor@tarepet.com",
        "parent_name": "Mr & Mrs Akegor",
        "parent_phone": "07069549468",
    },
    {
        "name": "Imeh Daniel Udeme",
        "code": "4064",
        "dob": "2013-01-20",
        "gender": "Male",
        "email": "daniel.imeh@tarepet.com",
        "parent_name": "Mr & Mrs Uchenna",
        "parent_phone": "07035731846",
    },
    {
        "name": "Igweshi Esther Amarachi",
        "code": "3064",
        "dob": "2011-08-20",
        "gender": "Female",
        "email": "esther.igweshi@tarepet.com",
        "parent_name": "Mr & Mrs Tousuo",
        "parent_phone": "08169994444",
    },
    {
        "name": "Oweibekuma Tarelayon",
        "code": "4128",
        "dob": "2013-06-15",
        "gender": "Male",
        "email": "tarelayon.oweibekuma@tarepet.com",
        "parent_name": "Mr & Mrs Oweibekuma",
        "parent_phone": "08169994444",
    },
    {
        "name": "Uchenna Solomon",
        "code": "4072",
        "dob": "2014-07-13",
        "gender": "Male",
        "email": "solomon.uchenna@tarepet.com",
        "parent_name": "Mr & Mrs Azurosi",
        "parent_phone": "08033165880",
    },
    {
        "name": "Win Tousuo Ayibafie",
        "code": "4087",
        "dob": "2011-07-23",
        "gender": "Male",
        "email": "ayibafie.wintousuo@tarepet.com",
        "parent_name": "Mr & Mrs Ahamefula",
        "parent_phone": "08056208530",
    },
    {
        "name": "Tamara Layefa Sinclair",
        "code": "4129",
        "dob": "2012-09-08",
        "gender": "Female",
        "email": "layefa.tamara@tarepet.com",
        "parent_name": "Mr & Mrs Sinclair",
        "parent_phone": "08056208530",
    },
    {
        "name": "Ifiemeya Azibaaei T.",
        "code": "4130",
        "dob": "2013-03-27",
        "gender": "Female",
        "email": "azibaaei.ifiemeya@tarepet.com",
        "parent_name": "Mr & Mrs Ifiemeya",
        "parent_phone": "08056208530",
    },
    {
        "name": "Nwachukwu Chidinma",
        "code": "4131",
        "dob": "2012-11-19",
        "gender": "Female",
        "email": "chidinma.nwachukwu@tarepet.com",
        "parent_name": "Mr & Mrs Nwachukwu",
        "parent_phone": "08056208530",
    },
]

def clean_email(email_str):
    # Strictly alphabetical before the @
    parts = email_str.split('@')
    name_part = re.sub(r'[^a-z.]', '', parts[0].lower())
    domain = parts[1] if len(parts) > 1 else 'tarepet.com'
    return f"{name_part}@{domain}"

def seed_jss3():
    print(f"[SEED] Seeding {len(JSS3_PUPILS)} JSS 3 Students into Tarepet LMS (ID format: TMS/JSS3/<code >)...", flush=True)
    created_count = 0
    updated_count = 0

    for idx, item in enumerate(JSS3_PUPILS, start=1):
        name = item["name"]
        code = item["code"]
        dob = item.get("dob")
        gender = item.get("gender", "Male")
        email = clean_email(item.get("email", ""))
        parent_name = item.get("parent_name", "")
        parent_phone = item.get("parent_phone", "")

        # Format requested by user: TMS/JSS3/(4digits)
        student_id = f"TMS/JSS3/{code}"

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
                "grade_level": "JSS3",
                "stream": "General",
                "gender": gender,
                "parent_name": parent_name,
                "parent_phone": parent_phone,
                "programme": "Junior Secondary Certificate Examination (BECE)",
                "study_mode": "Full Time",
            }
        )

        profile.student_id = student_id
        profile.grade_level = "JSS3"
        profile.stream = "General"
        profile.gender = gender
        profile.parent_name = parent_name
        profile.parent_phone = parent_phone
        profile.programme = "Junior Secondary Certificate Examination (BECE)"
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

        print(f"  [{idx}/{len(JSS3_PUPILS)}] {student_id} - {name} (JSS3) -> {email}", flush=True)

    print(f"[OK] Seeding complete: {created_count} created, {updated_count} updated ({len(JSS3_PUPILS)} total JSS3 students).", flush=True)

if __name__ == "__main__":
    seed_jss3()

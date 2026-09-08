import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
API_BASE_URL = 'https://tarepet-backend-4iw6.onrender.com/api/v1'

def get_admin_token():
    print("[1/3] Authenticating as Administrator with live backend...")
    req = urllib.request.Request(
        f"{API_BASE_URL}/auth/login/",
        data=json.dumps({'email': 'admin@tarepet.com', 'password': 'TarepetAdmin@2026!'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req, context=ctx)
    data = json.loads(res.read().decode('utf-8'))
    print(f"      Authenticated successfully. User: {data.get('user', {}).get('email')}")
    return data['access']

SS_EXAM_REPOSITORY = [
    # ── SS 1 Science ──
    {
        'title': 'SS1 First Term Physics Assessment',
        'description': 'Senior Secondary 1 Physics Continuous Assessment (Mechanics & Measurement)',
        'instructions': 'Attempt all questions. Select the single best option (A, B, C, or D).',
        'course_name': 'Physics',
        'course_code': 'PHY-101',
        'class_name': 'SS1',
        'stream': 'Science',
        'assessment_type': 'TEST',
        'term': '1ST_TERM',
        'duration_minutes': 30,
        'questions_per_page': 2,
        'status': 'PENDING',
        'teacher_name': 'Abiola Adeniyi Adegemo',
        'questions': [
            {
                'order': 1,
                'question_text': 'Which of the following is a fundamental SI physical quantity?',
                'option_a': 'Velocity',
                'option_b': 'Thermodynamic Temperature',
                'option_c': 'Electric Potential',
                'option_d': 'Force',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Thermodynamic temperature (measured in Kelvin) is one of the seven fundamental SI base units.'
            },
            {
                'order': 2,
                'question_text': 'A micrometer screw gauge has a pitch of 0.5 mm and 50 divisions on the circular scale. What is its least count?',
                'option_a': '0.01 mm',
                'option_b': '0.05 mm',
                'option_c': '0.02 mm',
                'option_d': '0.1 mm',
                'correct_option': 'A',
                'points': 2,
                'explanation': 'Least count = Pitch / Total circular scale divisions = 0.5 mm / 50 = 0.01 mm.'
            },
            {
                'order': 3,
                'question_text': 'Which of the following quantities is a vector quantity?',
                'option_a': 'Speed',
                'option_b': 'Electric Current',
                'option_c': 'Displacement',
                'option_d': 'Energy',
                'correct_option': 'C',
                'points': 2,
                'explanation': 'Displacement has both magnitude and specified direction, making it a vector quantity.'
            },
            {
                'order': 4,
                'question_text': 'A car accelerates uniformly from rest to 20 m/s in 5 seconds. What is the acceleration?',
                'option_a': '2 m/s²',
                'option_b': '4 m/s²',
                'option_c': '5 m/s²',
                'option_d': '10 m/s²',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'a = (v - u) / t = (20 - 0) / 5 = 4 m/s².'
            }
        ]
    },
    {
        'title': 'SS1 Chemistry Mid-Term Assessment',
        'description': 'SS1 Chemistry: Particulate Nature of Matter and Chemical Symbols',
        'instructions': 'Read each question carefully before choosing an option.',
        'course_name': 'Chemistry',
        'course_code': 'CHM-101',
        'class_name': 'SS1',
        'stream': 'Science',
        'assessment_type': 'TEST',
        'term': '1ST_TERM',
        'duration_minutes': 35,
        'questions_per_page': 2,
        'status': 'PENDING',
        'teacher_name': 'Abiola Adeniyi Adegemo',
        'questions': [
            {
                'order': 1,
                'question_text': 'The atomic number of an element is determined by the number of:',
                'option_a': 'Neutrons only',
                'option_b': 'Protons in the nucleus',
                'option_c': 'Valence electrons in outer shell',
                'option_d': 'Nucleons in total',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Atomic number (Z) is defined as the number of protons contained in the nucleus of an atom.'
            },
            {
                'order': 2,
                'question_text': 'Which of the following separation techniques is best suited for separating a mixture of kerosene and water?',
                'option_a': 'Fractional distillation',
                'option_b': 'Sublimation',
                'option_c': 'Separating funnel',
                'option_d': 'Chromatography',
                'correct_option': 'C',
                'points': 2,
                'explanation': 'Kerosene and water form immiscible liquids with different densities, easily separated using a separating funnel.'
            },
            {
                'order': 3,
                'question_text': 'Isotopes of the same element possess:',
                'option_a': 'The same mass number but different atomic numbers',
                'option_b': 'The same atomic number but different neutron counts',
                'option_c': 'Different chemical properties',
                'option_d': 'Different numbers of protons',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Isotopes have the same number of protons (atomic number) but different numbers of neutrons.'
            }
        ]
    },
    {
        'title': 'SS1 Biology Diagnostic Examination',
        'description': 'SS1 Biology: Cell Organization and Microscopic Organisms',
        'instructions': 'Answer all objective questions.',
        'course_name': 'Biology',
        'course_code': 'BIO-101',
        'class_name': 'SS1',
        'stream': 'Science',
        'assessment_type': 'EXAM',
        'term': '1ST_TERM',
        'duration_minutes': 45,
        'questions_per_page': 2,
        'status': 'APPROVED',
        'teacher_name': 'Emmanuel U. Joseph',
        'questions': [
            {
                'order': 1,
                'question_text': 'Which organelle is referred to as the powerhouse of the cell?',
                'option_a': 'Ribosome',
                'option_b': 'Mitochondrion',
                'option_c': 'Golgi body',
                'option_d': 'Nucleolus',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Mitochondria are the sites of cellular respiration where ATP energy is synthesized.'
            },
            {
                'order': 2,
                'question_text': 'A plant cell is distinct from an animal cell because it has:',
                'option_a': 'A prominent nucleus',
                'option_b': 'A cellulose cell wall and chloroplasts',
                'option_c': 'Cytoplasm and mitochondria',
                'option_d': 'Cell membrane',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Plant cells possess rigid cellulose walls and chloroplasts for photosynthesis, absent in animal cells.'
            }
        ]
    },

    # ── SS 1 Arts ──
    {
        'title': 'SS1 Literature in English Term Assessment',
        'description': 'Elements of Poetry, Drama, and Prose for Senior Arts Class',
        'instructions': 'Answer all questions. Multiple choices available.',
        'course_name': 'Literature in English',
        'course_code': 'LIT-101',
        'class_name': 'SS1',
        'stream': 'Arts',
        'assessment_type': 'TEST',
        'term': '1ST_TERM',
        'duration_minutes': 30,
        'questions_per_page': 2,
        'status': 'PENDING',
        'teacher_name': 'Mrs. Timi Porbeni',
        'questions': [
            {
                'order': 1,
                'question_text': 'A deliberate exaggeration used for poetic effect or emphasis is called:',
                'option_a': 'Irony',
                'option_b': 'Hyperbole',
                'option_c': 'Euphemism',
                'option_d': 'Oxymoron',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Hyperbole is a figure of speech involving deliberate and obvious exaggeration for rhetorical emphasis.'
            },
            {
                'order': 2,
                'question_text': 'When the audience knows a crucial piece of information that a character on stage does not, this is called:',
                'option_a': 'Tragic flaw',
                'option_b': 'Dramatic irony',
                'option_c': 'Catharsis',
                'option_d': 'Soliloquy',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Dramatic irony occurs when the audience understands the implications of a situation while the characters do not.'
            },
            {
                'order': 3,
                'question_text': 'A poem consisting of exactly 14 rhymed lines in iambic pentameter is a:',
                'option_a': 'Ballad',
                'option_b': 'Ode',
                'option_c': 'Sonnet',
                'option_d': 'Elegy',
                'correct_option': 'C',
                'points': 2,
                'explanation': 'A sonnet is a classic poetic form of 14 lines with a rigid rhyme scheme and meter.'
            }
        ]
    },
    {
        'title': 'SS1 Government Foundations Assessment',
        'description': 'SS1 Government: Basic Concepts of State, Sovereignty, and Power',
        'instructions': 'Select the single most correct answer for each item.',
        'course_name': 'Government',
        'course_code': 'GOV-101',
        'class_name': 'SS1',
        'stream': 'Arts',
        'assessment_type': 'TEST',
        'term': '1ST_TERM',
        'duration_minutes': 35,
        'questions_per_page': 2,
        'status': 'PENDING',
        'teacher_name': 'Agadaga Tari',
        'questions': [
            {
                'order': 1,
                'question_text': 'The supreme power of a state to make and enforce laws without external control is known as:',
                'option_a': 'Legitimacy',
                'option_b': 'Sovereignty',
                'option_c': 'Authority',
                'option_d': 'Federalism',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Sovereignty is the ultimate, independent authority of a recognized state over its territory and affairs.'
            },
            {
                'order': 2,
                'question_text': 'Which organ of government is primarily responsible for interpreting and applying the laws of the nation?',
                'option_a': 'The Legislature',
                'option_b': 'The Executive',
                'option_c': 'The Judiciary',
                'option_d': 'The Civil Service',
                'correct_option': 'C',
                'points': 2,
                'explanation': 'The Judiciary interprets the constitution and administers justice according to statutory law.'
            }
        ]
    },

    # ── SS 2 Science ──
    {
        'title': 'SS2 Mathematics Core Assessment',
        'description': 'SS2 Mathematics: Quadratic Equations, Indices, and Logarithms',
        'instructions': 'Answer all objective questions carefully.',
        'course_name': 'Mathematics',
        'course_code': 'MTH-101',
        'class_name': 'SS2',
        'stream': 'Science',
        'assessment_type': 'EXAM',
        'term': '1ST_TERM',
        'duration_minutes': 45,
        'questions_per_page': 2,
        'status': 'APPROVED',
        'teacher_name': 'Eli Idua',
        'questions': [
            {
                'order': 1,
                'question_text': 'Solve for x: log10(x) + log10(5) = 2',
                'option_a': '10',
                'option_b': '20',
                'option_c': '25',
                'option_d': '50',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'log10(5x) = 2 => 5x = 10² = 100 => x = 20.'
            },
            {
                'order': 2,
                'question_text': 'If α and β are the roots of 2x² - 5x + 3 = 0, what is the sum of the roots (α + β)?',
                'option_a': '5/2',
                'option_b': '-5/2',
                'option_c': '3/2',
                'option_d': '-3/2',
                'correct_option': 'A',
                'points': 2,
                'explanation': 'For ax² + bx + c = 0, the sum of roots is -b/a = -(-5)/2 = 5/2.'
            }
        ]
    },

    # ── SS 2 Arts ──
    {
        'title': 'SS2 Civic Education & Values Examination',
        'description': 'SS2 Civic Education: Human Rights, Democracy, and Civic Responsibilities',
        'instructions': 'Choose the correct answer from the given options.',
        'course_name': 'Civic Education',
        'course_code': 'CIV-101',
        'class_name': 'SS2',
        'stream': 'Arts',
        'assessment_type': 'TEST',
        'term': '1ST_TERM',
        'duration_minutes': 30,
        'questions_per_page': 2,
        'status': 'PENDING',
        'teacher_name': 'Agadaga Tari',
        'questions': [
            {
                'order': 1,
                'question_text': 'Fundamental Human Rights are typically entrenched in the constitution of a country to:',
                'option_a': 'Protect citizens from arbitrary government power and abuse',
                'option_b': 'Give supreme immunity to public officials',
                'option_c': 'Eliminate the need for judicial courts',
                'option_d': 'Discourage political party opposition',
                'correct_option': 'A',
                'points': 2,
                'explanation': 'Constitutional entrenchment safeguards fundamental liberties against arbitrary tyranny or encroachment.'
            },
            {
                'order': 2,
                'question_text': 'Which of the following is a primary duty of a responsible citizen in a democracy?',
                'option_a': 'Refusing to pay taxes',
                'option_b': 'Voting during public elections and obeying laws',
                'option_c': 'Taking the law into personal hands',
                'option_d': 'Avoiding community service',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Electoral participation and compliance with statutory laws are hallmark duties of responsible citizenship.'
            }
        ]
    },

    # ── SS 3 Science (WAEC / NECO Prep) ──
    {
        'title': 'SS3 WAEC Mock: General Mathematics & Calculus',
        'description': 'SS3 SSCE / WAEC / NECO Standard Mock Assessment for Senior Science Students',
        'instructions': 'Strict CBT exam conditions. Submit within the allotted timeframe.',
        'course_name': 'Mathematics',
        'course_code': 'MTH-101',
        'class_name': 'SS3',
        'stream': 'Science',
        'assessment_type': 'EXAM',
        'term': '1ST_TERM',
        'duration_minutes': 60,
        'questions_per_page': 2,
        'status': 'APPROVED',
        'teacher_name': 'Eli Idua',
        'questions': [
            {
                'order': 1,
                'question_text': 'Find the derivative dy/dx if y = 3x⁴ - 5x² + 7.',
                'option_a': '12x³ - 10x',
                'option_b': '7x³ - 5x',
                'option_c': '12x³ - 10',
                'option_d': '4x³ - 10x + 7',
                'correct_option': 'A',
                'points': 2,
                'explanation': 'Applying the power rule: d/dx(3x⁴) = 12x³, d/dx(-5x²) = -10x, d/dx(7) = 0 => 12x³ - 10x.'
            },
            {
                'order': 2,
                'question_text': 'In how many ways can a committee of 3 students be selected from a class of 8 students?',
                'option_a': '24',
                'option_b': '56',
                'option_c': '336',
                'option_d': '120',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'Combinations 8C3 = 8! / (3! * 5!) = (8 * 7 * 6) / (3 * 2 * 1) = 56.'
            }
        ]
    },

    # ── SS 3 Arts (WAEC / NECO Prep) ──
    {
        'title': 'SS3 WAEC Mock: Government & International Relations',
        'description': 'SS3 SSCE Examination Prep: Constitutional Evolution and Foreign Policy',
        'instructions': 'Answer all objective questions.',
        'course_name': 'Government',
        'course_code': 'GOV-101',
        'class_name': 'SS3',
        'stream': 'Arts',
        'assessment_type': 'EXAM',
        'term': '1ST_TERM',
        'duration_minutes': 50,
        'questions_per_page': 2,
        'status': 'APPROVED',
        'teacher_name': 'Agadaga Tari',
        'questions': [
            {
                'order': 1,
                'question_text': 'Which colonial constitution first introduced the elective principle into Nigerian legislative governance?',
                'option_a': 'Clifford Constitution of 1922',
                'option_b': 'Richards Constitution of 1946',
                'option_c': 'Macpherson Constitution of 1951',
                'option_d': 'Lyttelton Constitution of 1954',
                'correct_option': 'A',
                'points': 2,
                'explanation': 'The Clifford Constitution of 1922 introduced the elective principle for 4 legislative council members in Lagos and Calabar.'
            },
            {
                'order': 2,
                'question_text': 'The primary organ of the United Nations responsible for maintaining international peace and security is the:',
                'option_a': 'General Assembly',
                'option_b': 'Security Council',
                'option_c': 'International Court of Justice',
                'option_d': 'Economic and Social Council',
                'correct_option': 'B',
                'points': 2,
                'explanation': 'The UN Security Council has primary responsibility for the maintenance of international peace and collective security.'
            }
        ]
    }
]

def seed_exams():
    token = get_admin_token()
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    print("\n[2/3] Checking existing CBT exams on live backend...")
    req = urllib.request.Request(f"{API_BASE_URL}/assessments/cbt-exams/", headers=headers)
    res = urllib.request.urlopen(req, context=ctx)
    existing = json.loads(res.read().decode('utf-8'))
    existing_titles = set()
    results = existing.get('results', []) if isinstance(existing, dict) else (existing if isinstance(existing, list) else [])
    for e in results:
        existing_titles.add(e.get('title'))
    print(f"      Found {len(results)} existing exam(s) in backend.")

    print(f"\n[3/3] Seeding {len(SS_EXAM_REPOSITORY)} Senior Secondary CBT papers (SS1 to SS3 Science & Arts)...")
    seeded_count = 0
    total_q_count = 0

    for exam_data in SS_EXAM_REPOSITORY:
        title = exam_data['title']
        if title in existing_titles:
            print(f"      [SKIP] '{title}' already exists.")
            continue

        req_post = urllib.request.Request(
            f"{API_BASE_URL}/assessments/cbt-exams/",
            data=json.dumps(exam_data).encode('utf-8'),
            headers=headers
        )
        try:
            res_post = urllib.request.urlopen(req_post, context=ctx)
            created = json.loads(res_post.read().decode('utf-8'))
            q_cnt = len(created.get('questions', []))
            seeded_count += 1
            total_q_count += q_cnt
            print(f"      [CREATED ID {created['id']}] {created['class_name']} {created['stream']} - {created['title']} ({q_cnt} questions, Status: {created['status']})")
        except urllib.error.HTTPError as err:
            err_body = err.read().decode('utf-8')
            print(f"      [ERROR] Failed '{title}': HTTP {err.code} - {err_body}")

    print(f"\n[SUCCESS] Successfully populated {seeded_count} exam papers with {total_q_count} questions into Django backend!")
    print("           All exams and questions are now stored in the database and visible across all devices.")

if __name__ == '__main__':
    seed_exams()

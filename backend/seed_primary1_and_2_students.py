import os
import json
from datetime import datetime
import django

os.environ['DATABASE_URL'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'db.sqlite3')}"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import transaction
from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile, CustomUser

User = get_user_model()


def seed_p1_p2():
    json_path = os.path.join(
        os.path.dirname(__file__),
        'apps', 'users', 'management', 'commands', 'students_data.json'
    )
    with open(json_path, 'r', encoding='utf-8') as f:
        all_students = json.load(f)

    # Filter Primary 1 (Basic 1) and Primary 2 (Basic 2)
    p1_p2 = [s for s in all_students if s.get('grade') in ['Basic 1', 'Basic 2']]
    print(f"Found {len(p1_p2)} Primary 1 & 2 students in dataset.")

    # Track which student_ids have been used in this run to catch sheet-level duplicates
    used_student_ids_this_run = set()

    users_created = 0
    profiles_created = 0
    profiles_updated = 0
    errors = []

    for s in p1_p2:
        try:
            with transaction.atomic():
                email = s['email'].strip().lower()
                name_parts = s['name'].strip().split()
                first_name = name_parts[0] if name_parts else 'Student'
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

                user, u_created = CustomUser.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'role': CustomUser.Role.STUDENT,
                    }
                )
                if u_created:
                    user.set_password(s.get('password') or 'tarepet2026')
                    user.save()
                    users_created += 1

                # Parse DOB
                dob_val = None
                dob_str = s.get('dob', '').strip()
                if dob_str and dob_str not in ('Not Provided', ''):
                    try:
                        dob_val = datetime.strptime(dob_str[:10], '%Y-%m-%d').date()
                    except Exception:
                        pass

                # Clean parent fields
                parent_phone = s.get('parentPhone', '') or ''
                if parent_phone == 'Not Provided':
                    parent_phone = ''

                parent_name = s.get('parentName', '') or ''
                if parent_name == 'Not Provided':
                    parent_name = ''

                address = s.get('address', '') or ''
                if address in ('Not Provided', 'Yenagoa, Bayelsa State'):
                    # "Yenagoa, Bayelsa State" is a default address we used in generator - clear it
                    address = ''

                # Resolve student_id — only include if real AND not duplicate
                raw_adm = s.get('admissionNo', '') or ''
                adm_no = None
                if raw_adm and raw_adm != 'Not Provided':
                    # Check for duplicates within the DB and this run
                    if raw_adm in used_student_ids_this_run:
                        print(f"  DUPLICATE adm '{raw_adm}' for {s['name']} — leaving student_id as auto-generated")
                    elif StudentProfile.objects.filter(student_id=raw_adm).exclude(user=user).exists():
                        print(f"  CONFLICT adm '{raw_adm}' for {s['name']} — already taken by another profile — skipping student_id")
                    else:
                        adm_no = raw_adm
                        used_student_ids_this_run.add(raw_adm)

                # Build update dict (never includes student_id=None)
                defaults = {
                    'grade_level': s['grade'],
                    'stream': s.get('stream', 'General'),
                    'gender': '' if s.get('gender') in ('Not Provided', None) else (s.get('gender') or ''),
                    'date_of_birth': dob_val,
                    'parent_name': parent_name,
                    'parent_phone': parent_phone,
                    'address': address,
                    'state_of_origin': s.get('stateOfOrigin') or 'Bayelsa',
                    'lga': s.get('lga') or 'Yenagoa',
                    'programme': s.get('programme') or 'Montessori Primary Basic Education',
                    'study_mode': s.get('studyMode') or 'Full Time',
                }
                if adm_no:
                    defaults['student_id'] = adm_no

                prof, p_created = StudentProfile.objects.update_or_create(
                    user=user,
                    defaults=defaults
                )
                if p_created:
                    profiles_created += 1
                else:
                    profiles_updated += 1

        except Exception as e:
            errors.append((s.get('name', '?'), str(e)))
            print(f"  ERROR for {s.get('name', '?')}: {e}")
            continue

    print(f"\n=== SEEDING COMPLETE ===")
    print(f"  Users created: {users_created}")
    print(f"  New profiles created: {profiles_created}")
    print(f"  Existing profiles updated: {profiles_updated}")

    if errors:
        print(f"\n  ERRORS ({len(errors)}):")
        for name, err in errors:
            print(f"    - {name}: {err}")

    # Final counts
    b1_count = StudentProfile.objects.filter(grade_level='Basic 1').count()
    b2_count = StudentProfile.objects.filter(grade_level='Basic 2').count()
    print(f"\n  DB Basic 1 count = {b1_count}")
    print(f"  DB Basic 2 count = {b2_count}")


if __name__ == '__main__':
    seed_p1_p2()

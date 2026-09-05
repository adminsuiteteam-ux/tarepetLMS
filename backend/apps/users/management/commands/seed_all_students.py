import os
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.users.models import StudentProfile, CustomUser

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds all 622 real students from students_data.json into the database using bulk operations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-seeding even if profile count matches total_expected',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        json_path = os.path.join(os.path.dirname(__file__), 'students_data.json')
        if not os.path.exists(json_path):
            self.stderr.write(self.style.ERROR(f'students_data.json not found at {json_path}'))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            students = json.load(f)

        total_expected = len(students)
        self.stdout.write(self.style.NOTICE(f'Found {total_expected} student records in dataset.'))

        existing_profiles = StudentProfile.objects.count()
        if not force and existing_profiles >= total_expected:
            self.stdout.write(self.style.SUCCESS(
                f'All {existing_profiles} students already seeded in DB. Instant skip (use --force to overwrite).'
            ))
            return

        # ── Phase 1: Parse all student records ────────────────────────────
        parsed = []
        for s in students:
            email = s.get('email', '').strip().lower()
            adm_no = (
                s.get('admissionNo') or s.get('studentId') or s.get('code') or ''
            ).strip()
            code = s.get('code', '').strip()
            raw_pwd = s.get('password') or code or adm_no

            full_name = s.get('name', '').strip()
            parts = full_name.split()
            if len(parts) == 0:
                first_name, last_name = 'Student', 'Tarepet'
            elif len(parts) == 1:
                first_name, last_name = parts[0], 'Student'
            else:
                first_name = parts[0]
                last_name = ' '.join(parts[1:])

            raw_phone = s.get('phone', '').strip()
            if raw_phone.lower() in ['not provided', 'not available', 'none', 'null', '']:
                phone = ''
            else:
                primary_phone = raw_phone.split(',')[0].split('/')[0].strip()
                phone = primary_phone[:20]

            raw_dob = s.get('dob', '').strip()
            dob_val = None
            if raw_dob and raw_dob.lower() not in [
                'not provided', 'not available', 'null', 'none', ''
            ]:
                try:
                    dob_val = datetime.strptime(raw_dob[:10], '%Y-%m-%d').date()
                except Exception:
                    pass

            raw_pname = s.get('parentName', '').strip()
            parent_name = '' if raw_pname.lower() in [
                'not provided', 'not available', 'none', 'null'
            ] else raw_pname

            raw_pphone = s.get('parentPhone', '').strip()
            parent_phone = '' if raw_pphone.lower() in [
                'not provided', 'not available', 'none', 'null'
            ] else raw_pphone

            grade = s.get('grade', 'Basic 1')
            stream = s.get('stream') or (
                'Science' if grade.startswith('SS') else 'General'
            )
            gender = s.get('gender') or 'Male'
            house = s.get('house') or ''
            address = s.get('address') or 'Yenagoa, Bayelsa State'
            state_of_origin = s.get('stateOfOrigin') or 'Bayelsa'
            lga = s.get('lga') or 'Yenagoa'
            programme = s.get('programme') or (
                'Senior Secondary Certificate (SSCE)' if grade.startswith('SS')
                else 'Montessori Primary Basic Education'
            )
            study_mode = s.get('studyMode') or 'Full Time'
            profile_image = s.get('profileImage') or ''
            emergency = parent_phone or phone

            parsed.append({
                'email': email,
                'adm_no': adm_no,
                'raw_pwd': raw_pwd,
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone,
                'dob_val': dob_val,
                'parent_name': parent_name,
                'parent_phone': parent_phone,
                'grade': grade,
                'stream': stream,
                'gender': gender,
                'house': house,
                'address': address,
                'state_of_origin': state_of_origin,
                'lga': lga,
                'programme': programme,
                'study_mode': study_mode,
                'profile_image': profile_image,
                'emergency': emergency,
            })

        # ── Phase 2: Bulk-create / update User objects ────────────────────
        self.stdout.write('Phase 1: Upserting user accounts...')

        # Index existing users by email for fast lookup
        all_emails = [p['email'] for p in parsed]
        existing_users = {
            u.email.lower(): u
            for u in User.objects.filter(email__in=all_emails)
        }

        users_to_create = []
        users_to_update = []

        from django.contrib.auth.hashers import PBKDF2PasswordHasher
        _fast_hasher = PBKDF2PasswordHasher()
        _fast_hasher.iterations = 2000

        for rec in parsed:
            email = rec['email']
            existing = existing_users.get(email)

            if existing:
                existing.first_name = rec['first_name']
                existing.last_name = rec['last_name']
                existing.username = rec['adm_no'] or existing.username or email
                if rec['phone']:
                    existing.phone = rec['phone']
                existing.role = CustomUser.Role.STUDENT
                existing.is_active = True
                if not existing.has_usable_password() or options.get('reset_passwords', False):
                    existing.password = _fast_hasher.encode(rec['raw_pwd'], _fast_hasher.salt())
                users_to_update.append(existing)
            else:
                new_user = User(
                    email=email,
                    username=rec['adm_no'] or email,
                    first_name=rec['first_name'],
                    last_name=rec['last_name'],
                    phone=rec['phone'],
                    role=CustomUser.Role.STUDENT,
                    is_active=True,
                )
                new_user.password = _fast_hasher.encode(rec['raw_pwd'], _fast_hasher.salt())
                users_to_create.append(new_user)

        with transaction.atomic():
            if users_to_create:
                User.objects.bulk_create(users_to_create, batch_size=100, ignore_conflicts=True)
                self.stdout.write(f'  Created {len(users_to_create)} new user accounts.')

            if users_to_update:
                User.objects.bulk_update(
                    users_to_update,
                    fields=['first_name', 'last_name', 'username', 'phone',
                            'role', 'is_active', 'password'],
                    batch_size=100,
                )
                self.stdout.write(f'  Updated {len(users_to_update)} existing user accounts.')

        # ── Phase 3: Refresh user index and bulk-create profiles ──────────
        self.stdout.write('Phase 2: Upserting student profiles...')

        # Re-fetch all users to get auto-assigned PKs from bulk_create
        user_map = {
            u.email.lower(): u
            for u in User.objects.filter(email__in=all_emails)
        }

        # Index existing student profiles by user_id
        existing_profile_user_ids = set(
            StudentProfile.objects.filter(
                user_id__in=[u.pk for u in user_map.values()]
            ).values_list('user_id', flat=True)
        )

        profiles_to_create = []
        profiles_to_update_list = []

        for rec in parsed:
            user = user_map.get(rec['email'])
            if not user:
                continue

            if user.pk in existing_profile_user_ids:
                # Will update in a second pass
                profiles_to_update_list.append((user, rec))
            else:
                profiles_to_create.append(StudentProfile(
                    user=user,
                    student_id=rec['adm_no'],
                    grade_level=rec['grade'],
                    stream=rec['stream'],
                    gender=rec['gender'],
                    house=rec['house'],
                    date_of_birth=rec['dob_val'],
                    address=rec['address'],
                    state_of_origin=rec['state_of_origin'],
                    lga=rec['lga'],
                    parent_name=rec['parent_name'],
                    parent_phone=rec['parent_phone'],
                    emergency_contact=rec['emergency'],
                    programme=rec['programme'],
                    study_mode=rec['study_mode'],
                    profile_image=rec['profile_image'],
                ))

        with transaction.atomic():
            if profiles_to_create:
                StudentProfile.objects.bulk_create(
                    profiles_to_create, batch_size=100, ignore_conflicts=True
                )
                self.stdout.write(f'  Created {len(profiles_to_create)} new student profiles.')

            # Batch-update existing profiles
            if profiles_to_update_list:
                existing_profiles_qs = StudentProfile.objects.filter(
                    user_id__in=[u.pk for u, _ in profiles_to_update_list]
                ).select_related('user')
                profile_by_user = {p.user_id: p for p in existing_profiles_qs}

                bulk_updates = []
                for user, rec in profiles_to_update_list:
                    profile = profile_by_user.get(user.pk)
                    if not profile:
                        continue
                    profile.student_id = rec['adm_no']
                    profile.grade_level = rec['grade']
                    profile.stream = rec['stream']
                    profile.gender = rec['gender']
                    profile.house = rec['house']
                    if rec['dob_val']:
                        profile.date_of_birth = rec['dob_val']
                    if rec['address']:
                        profile.address = rec['address']
                    if rec['state_of_origin']:
                        profile.state_of_origin = rec['state_of_origin']
                    if rec['lga']:
                        profile.lga = rec['lga']
                    if rec['parent_name']:
                        profile.parent_name = rec['parent_name']
                    if rec['parent_phone']:
                        profile.parent_phone = rec['parent_phone']
                    if rec['emergency']:
                        profile.emergency_contact = rec['emergency']
                    if rec['programme']:
                        profile.programme = rec['programme']
                    if rec['study_mode']:
                        profile.study_mode = rec['study_mode']
                    if rec['profile_image']:
                        profile.profile_image = rec['profile_image']
                    bulk_updates.append(profile)

                if bulk_updates:
                    StudentProfile.objects.bulk_update(
                        bulk_updates,
                        fields=[
                            'student_id', 'grade_level', 'stream', 'gender',
                            'house', 'date_of_birth', 'address',
                            'state_of_origin', 'lga', 'parent_name',
                            'parent_phone', 'emergency_contact', 'programme',
                            'study_mode', 'profile_image',
                        ],
                        batch_size=100,
                    )
                    self.stdout.write(f'  Updated {len(bulk_updates)} existing student profiles.')

        # ── Summary ───────────────────────────────────────────────────────
        total_student_users = User.objects.filter(role=CustomUser.Role.STUDENT).count()
        total_student_profiles = StudentProfile.objects.count()

        self.stdout.write(self.style.SUCCESS('Successfully seeded all students:'))
        self.stdout.write(f'  Users Created: {len(users_to_create)}, Updated: {len(users_to_update)}')
        self.stdout.write(f'  Profiles Created: {len(profiles_to_create)}, Updated: {len(profiles_to_update_list)}')
        self.stdout.write(self.style.SUCCESS(f'  Total Student Users in DB: {total_student_users}'))
        self.stdout.write(self.style.SUCCESS(f'  Total Student Profiles in DB: {total_student_profiles}'))

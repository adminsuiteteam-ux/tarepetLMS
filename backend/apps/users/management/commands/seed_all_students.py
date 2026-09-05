import os
import json
from datetime import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.users.models import StudentProfile, CustomUser

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds all 622 real students from students_data.json into the Neon PostgreSQL database'

    def handle(self, *args, **options):
        json_path = os.path.join(os.path.dirname(__file__), 'students_data.json')
        if not os.path.exists(json_path):
            self.stderr.write(self.style.ERROR(f'students_data.json not found at {json_path}'))
            return

        with open(json_path, 'r', encoding='utf-8') as f:
            students = json.load(f)

        self.stdout.write(self.style.NOTICE(f'Found {len(students)} student records in dataset.'))
        existing_count = StudentProfile.objects.count()
        if existing_count >= 622:
            self.stdout.write(self.style.SUCCESS(f'All {existing_count} students already seeded in DB. Instant skip.'))
            return

        created_users = 0
        updated_users = 0
        created_profiles = 0
        updated_profiles = 0

        for idx, s in enumerate(students, 1):
            email = s.get('email', '').strip().lower()
            adm_no = s.get('admissionNo') or s.get('studentId') or s.get('code') or ''
            adm_no = adm_no.strip()
            code = s.get('code', '').strip()
            raw_pwd = s.get('password') or code or adm_no

            full_name = s.get('name', '').strip()
            parts = full_name.split()
            if len(parts) == 0:
                first_name = 'Student'
                last_name = 'Tarepet'
            elif len(parts) == 1:
                first_name = parts[0]
                last_name = 'Student'
            else:
                first_name = parts[0]
                last_name = ' '.join(parts[1:])

            raw_phone = s.get('phone', '').strip()
            phone = '' if raw_phone.lower() in ['not provided', 'not available', 'none', 'null'] else raw_phone

            # Look up existing user by email, or by username, or by student profile ID
            user = User.objects.filter(email__iexact=email).first()
            if not user and adm_no:
                user = User.objects.filter(username__iexact=adm_no).first()
            if not user and adm_no:
                existing_prof = StudentProfile.objects.filter(student_id__iexact=adm_no).select_related('user').first()
                if existing_prof:
                    user = existing_prof.user

            is_new_user = False
            if not user:
                user = User(
                    email=email,
                    username=adm_no or email,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                    role=CustomUser.Role.STUDENT,
                    is_active=True,
                )
                user.set_password(raw_pwd)
                user.save()
                created_users += 1
                is_new_user = True
            else:
                user.first_name = first_name
                user.last_name = last_name
                user.username = adm_no or user.username or email
                user.email = email
                if phone:
                    user.phone = phone
                user.role = CustomUser.Role.STUDENT
                user.is_active = True
                user.set_password(raw_pwd)
                user.save()
                updated_users += 1

            # Parse date of birth
            raw_dob = s.get('dob', '').strip()
            dob_val = None
            if raw_dob and raw_dob.lower() not in ['not provided', 'not available', 'null', 'none', '']:
                try:
                    dob_val = datetime.strptime(raw_dob[:10], '%Y-%m-%d').date()
                except Exception:
                    pass

            raw_pname = s.get('parentName', '').strip()
            parent_name = '' if raw_pname.lower() in ['not provided', 'not available', 'none', 'null'] else raw_pname

            raw_pphone = s.get('parentPhone', '').strip()
            parent_phone = '' if raw_pphone.lower() in ['not provided', 'not available', 'none', 'null'] else raw_pphone

            grade = s.get('grade', 'Basic 1')
            stream = s.get('stream') or ('Science' if grade.startswith('SS') else 'General')
            gender = s.get('gender') or 'Male'
            house = s.get('house') or ''
            address = s.get('address') or 'Yenagoa, Bayelsa State'
            state_of_origin = s.get('stateOfOrigin') or 'Bayelsa'
            lga = s.get('lga') or 'Yenagoa'
            programme = s.get('programme') or ('Senior Secondary Certificate (SSCE)' if grade.startswith('SS') else 'Montessori Primary Basic Education')
            study_mode = s.get('studyMode') or 'Full Time'
            profile_image = s.get('profileImage') or ''
            emergency = parent_phone or phone

            profile, prof_created = StudentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'student_id': adm_no,
                    'grade_level': grade,
                    'stream': stream,
                    'gender': gender,
                    'house': house,
                    'date_of_birth': dob_val,
                    'address': address,
                    'state_of_origin': state_of_origin,
                    'lga': lga,
                    'parent_name': parent_name,
                    'parent_phone': parent_phone,
                    'emergency_contact': emergency,
                    'programme': programme,
                    'study_mode': study_mode,
                    'profile_image': profile_image,
                }
            )

            if prof_created:
                created_profiles += 1
            else:
                profile.student_id = adm_no
                profile.grade_level = grade
                profile.stream = stream
                profile.gender = gender
                profile.house = house
                if dob_val:
                    profile.date_of_birth = dob_val
                if address:
                    profile.address = address
                if state_of_origin:
                    profile.state_of_origin = state_of_origin
                if lga:
                    profile.lga = lga
                if parent_name:
                    profile.parent_name = parent_name
                if parent_phone:
                    profile.parent_phone = parent_phone
                if emergency:
                    profile.emergency_contact = emergency
                if programme:
                    profile.programme = programme
                if study_mode:
                    profile.study_mode = study_mode
                if profile_image:
                    profile.profile_image = profile_image
                profile.save()
                updated_profiles += 1

            if idx % 50 == 0 or idx == len(students):
                self.stdout.write(f'  Processed {idx}/{len(students)} students...')

        total_student_users = User.objects.filter(role=CustomUser.Role.STUDENT).count()
        total_student_profiles = StudentProfile.objects.count()

        self.stdout.write(self.style.SUCCESS('Successfully seeded all students:'))
        self.stdout.write(f'  Users Created: {created_users}, Updated: {updated_users}')
        self.stdout.write(f'  Profiles Created: {created_profiles}, Updated: {updated_profiles}')
        self.stdout.write(self.style.SUCCESS(f'  Total Student Users in Neon DB: {total_student_users}'))
        self.stdout.write(self.style.SUCCESS(f'  Total Student Profiles in Neon DB: {total_student_profiles}'))

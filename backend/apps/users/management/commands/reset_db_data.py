"""
Management command: reset_db_data
Deletes ALL data from the LMS and CBT system while preserving
the admin account(s) (users with role=ADMIN or is_superuser=True).
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = 'Wipe all LMS/CBT records and non-admin user accounts, keeping admin account(s) intact.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Must pass this flag to actually execute the wipe.',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                '\nThis command will DELETE all user accounts (except admins) and ALL LMS/CBT data.\n'
                'Run again with --confirm to proceed:\n\n'
                '  python manage.py reset_db_data --confirm\n'
            ))
            return

        self.stdout.write(self.style.WARNING('\nStarting database wipe...'))

        # pyrefly: ignore [bad-context-manager]
        with transaction.atomic():
            # ── Import all models ──────────────────────────────────────────────
            from apps.assessments.models import (
                CBTStudentAnswer, CBTStudentAttempt,
                CBTQuestion, CBTExam, CBTNotification,
                Submission, Gradebook, Attendance,
                BehaviorLog, Assignment, House,
            )
            from apps.courses.models import Question, Quiz, Lesson, Module, Course
            from apps.users.models import (
                CustomUser, StudentProfile, TeacherProfile,
                ParentProfile, AdminProfile,
            )

            # ── Step 1: Wipe CBT data (deepest first) ─────────────────────────
            n = CBTStudentAnswer.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} CBT student answers')

            n = CBTStudentAttempt.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} CBT student attempts')

            n = CBTNotification.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} CBT notifications')

            n = CBTQuestion.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} CBT questions')

            n = CBTExam.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} CBT exams')

            # ── Step 2: Wipe LMS assessment data ──────────────────────────────
            n = Submission.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} assignment submissions')

            n = Gradebook.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} gradebook entries')

            n = Attendance.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} attendance records')

            n = BehaviorLog.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} behavior logs')

            n = Assignment.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} assignments')

            n = House.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} houses')

            # ── Step 3: Wipe course content ───────────────────────────────────
            n = Question.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} quiz questions')

            n = Quiz.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} quizzes')

            n = Lesson.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} lessons')

            n = Module.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} modules')

            n = Course.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} courses')

            # ── Step 4: Wipe non-admin user profiles & accounts ───────────────
            n = StudentProfile.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} student profiles')

            n = TeacherProfile.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} teacher profiles')

            n = ParentProfile.objects.all().delete()[0]
            self.stdout.write(f'  [OK] Deleted {n} parent profiles')

            # Keep admin accounts (role=ADMIN or is_superuser)
            admin_users = CustomUser.objects.filter(
                role='ADMIN'
            ) | CustomUser.objects.filter(is_superuser=True)
            admin_ids = list(admin_users.values_list('id', flat=True).distinct())

            deleted_users, _ = CustomUser.objects.exclude(id__in=admin_ids).delete()
            self.stdout.write(f'  [OK] Deleted {deleted_users} non-admin user accounts')

            # ── Summary ───────────────────────────────────────────────────────
            remaining_admins = CustomUser.objects.filter(id__in=admin_ids)
            self.stdout.write('\n' + self.style.SUCCESS('Database wipe complete!'))
            self.stdout.write(self.style.SUCCESS(
                f'\nAdmin account(s) preserved ({len(admin_ids)}):'
            ))
            for admin in remaining_admins:
                self.stdout.write(self.style.SUCCESS(f'  -> {admin.email} ({admin.get_full_name()})'))

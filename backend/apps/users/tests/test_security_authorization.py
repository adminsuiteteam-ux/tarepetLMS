from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import CustomUser, StudentProfile, TeacherProfile, OTPVerification
from apps.assessments.models import CBTExam, CBTQuestion
from apps.communication.models import ActivityLog
from apps.finance.models import FeeItem, FeeTransaction

User = get_user_model()


class SecurityAuthorizationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin
        self.admin = User.objects.create_superuser(
            email='admin_test@tarepet.com',
            username='admin_test',
            password='AdminPassword123!',
            role=CustomUser.Role.ADMIN
        )

        # Create Teacher
        self.teacher = User.objects.create_user(
            email='teacher_test@tarepet.com',
            username='teacher_test',
            password='TeacherPassword123!',
            role=CustomUser.Role.TEACHER
        )
        self.teacher_profile, _ = TeacherProfile.objects.get_or_create(user=self.teacher)
        self.teacher_profile.teacher_id = 'TCH-TEST-01'
        self.teacher_profile.save()

        # Create Student
        self.student = User.objects.create_user(
            email='student_test@tarepet.com',
            username='student_test',
            password='StudentPassword123!',
            role=CustomUser.Role.STUDENT
        )
        self.student_profile, _ = StudentProfile.objects.get_or_create(user=self.student)
        self.student_profile.student_id = 'STD-TEST-01'
        self.student_profile.class_name = 'SS1'
        self.student_profile.save()

    def _jwt_auth(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    # -------------------------------------------------------------------------
    # TAR-001: Backdoor tokens are rejected
    # -------------------------------------------------------------------------
    def test_backdoor_tokens_rejected(self):
        for fake_token in [
            'admin_access_token',
            'mock_access_token',
            'temp_token_bypass',
            'verified_2fa_access_token',
            'dev_universal_token'
        ]:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {fake_token}')
            res = self.client.get('/api/v1/auth/users/')
            self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    # -------------------------------------------------------------------------
    # TAR-002: UserViewSet locked down (Student forbidden, Admin allowed)
    # -------------------------------------------------------------------------
    def test_user_viewset_student_forbidden(self):
        self._jwt_auth(self.student)
        res = self.client.get('/api/v1/auth/users/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_viewset_admin_allowed(self):
        self._jwt_auth(self.admin)
        res = self.client.get('/api/v1/auth/users/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    # -------------------------------------------------------------------------
    # TAR-003: Role escalation prevention
    # -------------------------------------------------------------------------
    def test_student_cannot_escalate_role_via_profile(self):
        self._jwt_auth(self.student)
        res = self.client.patch('/api/v1/auth/me/', {'role': 'ADMIN'}, format='json')
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, CustomUser.Role.STUDENT)

    # -------------------------------------------------------------------------
    # TAR-009/010: CBT question correct_option hidden from students
    # -------------------------------------------------------------------------
    def test_cbt_question_correct_option_hidden_from_student(self):
        exam = CBTExam.objects.create(
            title='SS1 Math Exam',
            class_name='SS1',
            teacher=self.teacher_profile,
            status='ACTIVE'
        )
        q = CBTQuestion.objects.create(
            exam=exam,
            question_text='What is 2+2?',
            option_a='1',
            option_b='4',
            option_c='3',
            option_d='5',
            correct_option='B',
            points=5
        )

        # Student views exam
        self._jwt_auth(self.student)
        res = self.client.get(f'/api/v1/assessments/cbt-exams/{exam.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        questions = res.data.get('questions', [])
        if questions:
            for question_data in questions:
                self.assertNotIn('correct_option', question_data)
                self.assertNotIn('explanation', question_data)

        # Teacher views exam — correct_option MUST be present
        self._jwt_auth(self.teacher)
        res_teacher = self.client.get(f'/api/v1/assessments/cbt-exams/{exam.id}/')
        self.assertEqual(res_teacher.status_code, status.HTTP_200_OK)
        teacher_questions = res_teacher.data.get('questions', [])
        self.assertTrue(len(teacher_questions) > 0)
        self.assertEqual(teacher_questions[0].get('correct_option'), 'B')

    # -------------------------------------------------------------------------
    # TAR-011: Unauthenticated requests to finance endpoints blocked
    # -------------------------------------------------------------------------
    def test_finance_endpoints_require_authentication(self):
        self.client.credentials()  # Unauthenticated
        res = self.client.get('/api/v1/finance/transactions/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        res_post = self.client.post('/api/v1/finance/fee-items/bulk-save/', {'items': []}, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_401_UNAUTHORIZED)

    # -------------------------------------------------------------------------
    # TAR-018: Universal OTP codes are rejected
    # -------------------------------------------------------------------------
    def test_universal_otp_codes_rejected(self):
        raw_code, temp_token, otp_obj = OTPVerification.create_otp(
            user=self.teacher,
            purpose=OTPVerification.Purpose.LOGIN_2FA,
            validity_minutes=5
        )

        for fake_code in ['123456', '000000', '999999', '111111']:
            if fake_code == raw_code:
                continue
            res = self.client.post('/api/v1/auth/otp/verify/', {
                'temp_token': temp_token,
                'otp_code': fake_code
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------------
    # TAR-033: ActivityLogViewSet returns unsliced queryset safely
    # -------------------------------------------------------------------------
    def test_activity_log_viewset_allows_pagination_and_detail(self):
        for i in range(5):
            ActivityLog.objects.create(
                activity_type='TEST',
                title=f'Log {i}',
                user=self.admin.email
            )

        self._jwt_auth(self.admin)
        res = self.client.get('/api/v1/communication/activities/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Verify pagination structure is intact and not breaking due to slicing
        self.assertIn('results', res.data)

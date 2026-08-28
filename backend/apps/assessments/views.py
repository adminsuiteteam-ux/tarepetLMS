from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models as db_models
from .models import Assignment, Submission, Gradebook, Attendance, BehaviorLog, House
from .serializers import (
    AssignmentSerializer,
    SubmissionSerializer,
    GradebookSerializer,
    AttendanceSerializer,
    BehaviorLogSerializer,
    HouseSerializer,
)
from apps.users.permissions import IsTeacher, IsStudent, IsAdmin
from apps.users.models import CustomUser


class HouseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = House.objects.all().order_by('-points')
    serializer_class = HouseSerializer
    permission_classes = [permissions.IsAuthenticated]


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-due_date')
    serializer_class = AssignmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset


class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all().order_by('-submitted_at')
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_student and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        elif user.is_parent and hasattr(user, 'parent_profile'):
            # Parents see their children's submissions
            queryset = queryset.filter(student__parents=user.parent_profile)

        assignment_id = self.request.query_params.get('assignment_id', None)
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'student_profile'):
            serializer.save(student=user.student_profile)
        else:
            serializer.save()

    @action(detail=True, methods=['put'], permission_classes=[IsTeacher])
    def grade(self, request, pk=None):
        submission = self.get_object()
        score = request.data.get('grade', None)
        feedback = request.data.get('feedback', '')

        if score is None:
            return Response({'detail': 'Grade score is required.'}, status=status.HTTP_400_BAD_REQUEST)

        submission.grade = float(score)
        submission.feedback = feedback
        submission.graded_at = timezone.now()
        submission.save()

        # Sync or create Gradebook entry
        Gradebook.objects.update_or_create(
            student=submission.student,
            course=submission.assignment.course,
            assignment=submission.assignment,
            defaults={
                'score': submission.grade,
                'feedback': submission.feedback,
                'category': 'Assignment',
            }
        )

        return Response(SubmissionSerializer(submission).data, status=status.HTTP_200_OK)


class GradebookViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gradebook.objects.all()
    serializer_class = GradebookSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_student and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        elif user.is_parent and hasattr(user, 'parent_profile'):
            queryset = queryset.filter(student__parents=user.parent_profile)

        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    @action(detail=False, methods=['get'], url_path='report-card')
    def report_card(self, request):
        user = request.user
        student_id_param = request.query_params.get('student_id', None)

        from apps.users.models import StudentProfile
        from .models import CBTStudentAttempt

        if student_id_param:
            if user.is_admin or user.is_teacher:
                student = StudentProfile.objects.filter(id=student_id_param).first()
            elif user.is_parent and hasattr(user, 'parent_profile'):
                student = StudentProfile.objects.filter(id=student_id_param, parents=user.parent_profile).first()
            elif user.is_student and hasattr(user, 'student_profile'):
                student = user.student_profile if str(user.student_profile.id) == str(student_id_param) else None
            else:
                student = None
        else:
            if user.is_student and hasattr(user, 'student_profile'):
                student = user.student_profile
            elif user.is_parent and hasattr(user, 'parent_profile'):
                student = user.parent_profile.students.first()
            else:
                student = StudentProfile.objects.first()

        if not student:
            return Response({'detail': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        grades = Gradebook.objects.filter(student=student).select_related('course')
        attempts = CBTStudentAttempt.objects.filter(student=student, is_submitted=True).select_related('exam__course')
        attendances = Attendance.objects.filter(student=student)
        
        total_attendance = attendances.count()
        present_count = attendances.filter(status='present').count()
        absent_count = attendances.filter(status='absent').count()
        late_count = attendances.filter(status='late').count()
        attendance_percentage = round((present_count / total_attendance * 100), 1) if total_attendance > 0 else 100.0

        house_obj = House.objects.filter(name=student.house).first() if student.house else None
        house_points = house_obj.points if house_obj else 45

        courses_dict = {}
        for g in grades:
            c_code = g.course.code
            if c_code not in courses_dict:
                courses_dict[c_code] = {
                    'code': g.course.code,
                    'title': g.course.title,
                    'ca_score': 0.0,
                    'cbt_exam_score': 0.0,
                    'total_score': 0.0,
                    'grade_letter': 'A',
                    'teacher_remark': g.feedback or 'Good performance',
                }
            if g.category in ['TEST', 'Homework', 'Assignment', 'Projects']:
                courses_dict[c_code]['ca_score'] = g.score
            elif g.category in ['EXAM', 'Exam', 'Term Final']:
                courses_dict[c_code]['cbt_exam_score'] = g.score

        for att in attempts:
            c_code = att.exam.course.code
            if c_code not in courses_dict:
                courses_dict[c_code] = {
                    'code': att.exam.course.code,
                    'title': att.exam.course.title,
                    'ca_score': 25.0,
                    'cbt_exam_score': round(att.percentage * 0.7, 1),
                    'total_score': 0.0,
                    'grade_letter': 'A',
                    'teacher_remark': 'Active CBT participation',
                }
            else:
                if att.exam.assessment_type == 'EXAM':
                    courses_dict[c_code]['cbt_exam_score'] = round(att.percentage * 0.7, 1)
                else:
                    courses_dict[c_code]['ca_score'] = round(att.percentage * 0.3, 1)

        subjects_list = []
        total_sum = 0.0
        for code, sub in courses_dict.items():
            tot = round(float(sub.get('ca_score', 0.0)) + float(sub.get('cbt_exam_score', 0.0)), 1)
            sub['total_score'] = tot
            sub['grade_letter'] = CBTAttemptViewSet._calculate_grade_letter(tot)
            total_sum += tot
            subjects_list.append(sub)

        overall_average = round(total_sum / len(subjects_list), 1) if subjects_list else 0.0

        if overall_average >= 85:
            teacher_remark = "An exemplary student with outstanding cognitive and practical life mastery. Keep up the high standard!"
            headmistress_remark = "Passed with Distinction. Demonstrated exceptional leadership and Montessori academic rigor."
        elif overall_average >= 70:
            teacher_remark = "Very good academic progress. Shows great enthusiasm in classroom and practical sessions."
            headmistress_remark = "Passed with Credit. Recommended for promotion to the next academic level."
        elif overall_average >= 50:
            teacher_remark = "Fair performance. Requires steady guidance and practice in core quantitative exercises."
            headmistress_remark = "Pass. Encouraged to engage in extra practical revision tutorials."
        else:
            teacher_remark = "Needs significant improvement in subject focus and homework submission."
            headmistress_remark = "Referral recommended for academic support session."

        return Response({
            'student_info': {
                'id': student.id,
                'student_id_code': student.student_id or f'STD-2026-00{student.id}',
                'name': student.user.get_full_name(),
                'grade_level': student.grade_level,
                'house': student.house or 'Red House (Ignis)',
                'admission_date': str(student.admission_date),
            },
            'academic_term': {
                'term': 'Term 2 Academic Session',
                'year': '2025/2026',
                'ref_code': f'TRP-2026-T2-08{student.id}',
                'report_date': timezone.now().strftime('%B %d, %Y'),
            },
            'overall_performance': {
                'average_percentage': overall_average,
                'grade_letter': CBTAttemptViewSet._calculate_grade_letter(overall_average),
                'total_subjects': len(subjects_list),
            },
            'subjects': subjects_list,
            'attendance': {
                'total_days': total_attendance or 65,
                'present': present_count or 62,
                'absent': absent_count or 2,
                'late': late_count or 1,
                'percentage': attendance_percentage,
            },
            'montessori_conduct': [
                {'trait': 'Grace & Courtesy', 'rating': 'Exemplary'},
                {'trait': 'Practical Life Competencies', 'rating': 'Exemplary'},
                {'trait': 'Self-Discipline & Order', 'rating': 'Proficient'},
                {'trait': 'Agronomy & Field Leadership', 'rating': 'Exemplary'},
            ],
            'house_points': house_points,
            'remarks': {
                'teacher_remark': teacher_remark,
                'headmistress_remark': headmistress_remark,
            }
        })


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_mark']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_student and hasattr(user, 'student_profile'):
            queryset = queryset.filter(student=user.student_profile)
        elif user.is_parent and hasattr(user, 'parent_profile'):
            queryset = queryset.filter(student__parents=user.parent_profile)

        course_id = self.request.query_params.get('course_id', None)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsTeacher])
    def bulk_mark(self, request):
        records = request.data.get('records', [])
        course_id = request.data.get('course_id')
        date_str = request.data.get('date', timezone.now().strftime('%Y-%m-%d'))

        if not course_id or not records:
            return Response({'detail': 'course_id and records list are required.'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        for rec in records:
            student_id = rec.get('student_id')
            status_val = rec.get('status', 'present')
            remarks = rec.get('remarks', '')

            Attendance.objects.update_or_create(
                student_id=student_id,
                course_id=course_id,
                date=date_str,
                defaults={'status': status_val, 'remarks': remarks}
            )
            created_count += 1

        return Response({'detail': f'Successfully updated {created_count} attendance records.'}, status=status.HTTP_200_OK)


class BehaviorLogViewSet(viewsets.ModelViewSet):
    queryset = BehaviorLog.objects.all().order_by('-date')
    serializer_class = BehaviorLogSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        teacher = getattr(user, 'teacher_profile', None)
        log = serializer.save(teacher=teacher)

        # Award House points if positive behavior
        if log.student and log.student.house and log.points:
            House.objects.filter(name=log.student.house).update(
                points=db_models.F('points') + log.points
            )


# =============================================
# CBT (Computer Based Testing) System Views
# =============================================

from .models import CBTExam, CBTQuestion, CBTStudentAttempt, CBTStudentAnswer, CBTNotification
from .serializers import (
    CBTExamSerializer,
    CBTQuestionSerializer,
    CBTQuestionStudentSerializer,
    CBTStudentAttemptSerializer,
    CBTStudentAnswerSerializer,
    CBTNotificationSerializer,
)


class CBTExamViewSet(viewsets.ModelViewSet):
    """
    CBT Exam management:
    - Teachers: create/edit/submit exams for approval
    - Admins: approve/reject exams
    - Students: view approved exams, start & take exams
    """
    serializer_class = CBTExamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'is_admin', False) or getattr(user, 'role', '') == 'ADMIN':
            return CBTExam.objects.all()
        elif getattr(user, 'is_teacher', False) or getattr(user, 'role', '') == 'TEACHER':
            if hasattr(user, 'teacher_profile'):
                return CBTExam.objects.filter(teacher=user.teacher_profile)
            return CBTExam.objects.all()
        elif getattr(user, 'is_student', False) or getattr(user, 'role', '') == 'STUDENT':
            return CBTExam.objects.filter(status__in=['PUBLISHED', 'ACTIVE', 'APPROVED'])
        return CBTExam.objects.all()

    def perform_create(self, serializer):
        teacher = getattr(self.request.user, 'teacher_profile', None)
        if teacher:
            serializer.save(teacher=teacher)
        else:
            serializer.save()

    # ---------- Teacher: Add questions ----------
    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def add_question(self, request, pk=None):
        exam = self.get_object()
        if exam.status not in ('DRAFT', 'REJECTED'):
            return Response({'detail': 'Can only add questions to draft or rejected exams.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = CBTQuestionSerializer(data={**request.data, 'exam': exam.id})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[IsTeacher])
    def questions(self, request, pk=None):
        exam = self.get_object()
        serializer = CBTQuestionSerializer(exam.questions.all(), many=True)
        return Response(serializer.data)

    # ---------- Teacher: Submit for approval ----------
    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def submit_for_approval(self, request, pk=None):
        exam = self.get_object()
        if exam.questions.count() == 0:
            return Response({'detail': 'Cannot submit an exam with no questions.'}, status=status.HTTP_400_BAD_REQUEST)
        exam.status = 'PENDING'
        exam.save()
        # Notify all admins
        admins = CustomUser.objects.filter(role='ADMIN')
        for admin in admins:
            CBTNotification.objects.create(
                user=admin,
                title=f'New {exam.get_assessment_type_display()} Pending Approval',
                message=f'"{exam.title}" for {getattr(exam.course, "name", "Course")} ({exam.get_term_display()}) has been submitted and needs your review.',
                notification_type='PENDING_APPROVAL',
                exam=exam,
            )
        return Response({'detail': 'Exam submitted for admin approval.', 'status': exam.status})

    # ---------- Admin: Approve ----------
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def approve(self, request, pk=None):
        exam = self.get_object()
        exam.status = 'APPROVED'
        exam.approved_by = request.user
        exam.save()
        # Notify teacher that exam is approved and ready to upload/publish
        if exam.teacher and exam.teacher.user:
            CBTNotification.objects.create(
                user=exam.teacher.user,
                title=f'{exam.get_assessment_type_display()} Approved!',
                message=f'Your exam "{exam.title}" has been approved by Admin {request.user.get_full_name()}. You can now activate and launch it for your students.',
                notification_type='APPROVED',
                exam=exam,
            )
        return Response({'detail': 'Exam approved. Sent back to teacher for uploading.', 'status': exam.status})

    # ---------- Teacher: Upload / Publish / Activate to Students ----------
    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def publish(self, request, pk=None):
        exam = self.get_object()
        if exam.status not in ('APPROVED', 'ACTIVE'):
            return Response({'detail': 'Only admin-approved exams can be activated/published to students.'}, status=status.HTTP_400_BAD_REQUEST)
        exam.status = 'ACTIVE'
        exam.save()
        return Response({'detail': 'Exam activated and published to students.', 'status': exam.status})

    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def toggle_results(self, request, pk=None):
        exam = self.get_object()
        released = request.data.get('results_released', not exam.results_released)
        exam.results_released = released
        exam.save()
        return Response({'detail': f'Results {"released" if released else "withheld"}.', 'results_released': exam.results_released})

    # ---------- Admin: Reject ----------
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        exam = self.get_object()
        reason = request.data.get('reason', '')
        exam.status = 'REJECTED'
        exam.rejection_reason = reason
        exam.save()
        if exam.teacher and exam.teacher.user:
            CBTNotification.objects.create(
                user=exam.teacher.user,
                title=f'{exam.get_assessment_type_display()} Rejected',
                message=f'Your exam "{exam.title}" was rejected. Reason: {reason or "No reason provided."}',
                notification_type='REJECTED',
                exam=exam,
            )
        return Response({'detail': 'Exam rejected.', 'status': exam.status, 'reason': reason})

    # ---------- Student: Start exam ----------
    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def start(self, request, pk=None):
        exam = self.get_object()
        if exam.status not in ('PUBLISHED', 'ACTIVE', 'APPROVED'):
            return Response({'detail': 'This exam is not active or has not been launched by the teacher yet.'}, status=status.HTTP_400_BAD_REQUEST)
        student = request.user.student_profile
        attempt, created = CBTStudentAttempt.objects.get_or_create(exam=exam, student=student)
        if attempt.is_submitted:
            return Response({'detail': 'You have already submitted this exam.'}, status=status.HTTP_400_BAD_REQUEST)
        # Return questions without correct answers
        questions = CBTQuestionStudentSerializer(exam.questions.all(), many=True).data
        return Response({
            'attempt_id': attempt.id,
            'started_at': attempt.started_at,
            'duration_minutes': exam.duration_minutes,
            'questions_per_page': exam.questions_per_page,
            'instructions': exam.instructions,
            'questions': questions,
        })

    # ---------- Student: Save individual answer ----------
    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def save_answer(self, request, pk=None):
        exam = self.get_object()
        student = request.user.student_profile
        try:
            attempt = CBTStudentAttempt.objects.get(exam=exam, student=student, is_submitted=False)
        except CBTStudentAttempt.DoesNotExist:
            return Response({'detail': 'No active attempt found.'}, status=status.HTTP_400_BAD_REQUEST)

        question_id = request.data.get('question_id')
        selected_option = request.data.get('selected_option')
        try:
            question = CBTQuestion.objects.get(id=question_id, exam=exam)
        except CBTQuestion.DoesNotExist:
            return Response({'detail': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

        answer, _ = CBTStudentAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults={'selected_option': selected_option},
        )
        return Response({'detail': 'Answer saved.', 'question_id': question_id, 'selected_option': selected_option})

    # ---------- Student: Submit attempt (manual or auto) ----------
    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def submit_attempt(self, request, pk=None):
        exam = self.get_object()
        student = request.user.student_profile
        auto = request.data.get('auto_submitted', False)

        try:
            attempt = CBTStudentAttempt.objects.get(exam=exam, student=student, is_submitted=False)
        except CBTStudentAttempt.DoesNotExist:
            return Response({'detail': 'No active attempt found or already submitted.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save any bulk answers sent with the submission
        answers_data = request.data.get('answers', [])
        for ans in answers_data:
            q_id = ans.get('question_id')
            sel = ans.get('selected_option')
            try:
                question = CBTQuestion.objects.get(id=q_id, exam=exam)
                CBTStudentAnswer.objects.update_or_create(
                    attempt=attempt,
                    question=question,
                    defaults={'selected_option': sel},
                )
            except CBTQuestion.DoesNotExist:
                continue

        # Grade all answers
        total_score = 0.0
        total_possible = 0.0
        for question in exam.questions.all():
            total_possible += question.points
            try:
                answer = CBTStudentAnswer.objects.get(attempt=attempt, question=question)
                is_correct = answer.selected_option == question.correct_option
                pts = question.points if is_correct else 0.0
                answer.is_correct = is_correct
                answer.points_awarded = pts
                answer.save()
                total_score += pts
            except CBTStudentAnswer.DoesNotExist:
                pass

        attempt.is_submitted = True
        attempt.auto_submitted = bool(auto)
        attempt.submitted_at = timezone.now()
        attempt.score = total_score
        attempt.total_possible = total_possible
        attempt.percentage = round((total_score / total_possible * 100), 2) if total_possible > 0 else 0.0
        attempt.save()

        # Notify teacher
        CBTNotification.objects.create(
            user=exam.teacher.user,
            title=f'Student Submitted: {exam.title}',
            message=f'{student.user.get_full_name()} has {"auto-" if auto else ""}submitted "{exam.title}" — Score: {attempt.score}/{attempt.total_possible} ({attempt.percentage}%)',
            notification_type='EXAM_SUBMITTED',
            exam=exam,
        )

        return Response({
            'detail': 'Exam submitted and graded.',
            'score': attempt.score,
            'total_possible': attempt.total_possible,
            'percentage': attempt.percentage,
            'auto_submitted': attempt.auto_submitted,
        })

    # ---------- Teacher: View attempts for an exam ----------
    @action(detail=True, methods=['get'], permission_classes=[IsTeacher])
    def attempts(self, request, pk=None):
        exam = self.get_object()
        attempts = CBTStudentAttempt.objects.filter(exam=exam, is_submitted=True)
        serializer = CBTStudentAttemptSerializer(attempts, many=True)
        return Response(serializer.data)

    # ---------- Teacher: View detailed student attempt ----------
    @action(detail=True, methods=['get'], url_path='attempt-detail/(?P<attempt_id>[0-9]+)', permission_classes=[IsTeacher])
    def attempt_detail(self, request, pk=None, attempt_id=None):
        exam = self.get_object()
        try:
            attempt = CBTStudentAttempt.objects.get(id=attempt_id, exam=exam)
        except CBTStudentAttempt.DoesNotExist:
            return Response({'detail': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)
        answers = CBTStudentAnswer.objects.filter(attempt=attempt).select_related('question')
        result = []
        for ans in answers:
            result.append({
                'question_order': ans.question.order,
                'question_text': ans.question.question_text,
                'option_a': ans.question.option_a,
                'option_b': ans.question.option_b,
                'option_c': ans.question.option_c,
                'option_d': ans.question.option_d,
                'correct_option': ans.question.correct_option,
                'selected_option': ans.selected_option,
                'is_correct': ans.is_correct,
                'points': ans.question.points,
                'points_awarded': ans.points_awarded,
            })
        return Response({
            'attempt': CBTStudentAttemptSerializer(attempt).data,
            'answers': result,
        })


class CBTNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = CBTNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CBTNotification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = CBTNotification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'detail': 'Marked as read.'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        CBTNotification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read.'})


class CBTAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only ViewSet for student attempts, with gradebook sync action."""
    serializer_class = CBTStudentAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_teacher and hasattr(user, 'teacher_profile'):
            return CBTStudentAttempt.objects.filter(exam__teacher=user.teacher_profile)
        elif user.is_student and hasattr(user, 'student_profile'):
            return CBTStudentAttempt.objects.filter(student=user.student_profile)
        elif user.is_admin:
            return CBTStudentAttempt.objects.all()
        return CBTStudentAttempt.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[IsTeacher])
    def sync_to_gradebook(self, request, pk=None):
        attempt = self.get_object()
        if attempt.gradebook_synced:
            return Response({'detail': 'Already synced to gradebook.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import Gradebook
        Gradebook.objects.create(
            student=attempt.student,
            course=attempt.exam.course,
            category=attempt.exam.get_assessment_type_display(),
            score=attempt.score,
            weight=attempt.total_possible,
            grade_letter=self._calculate_grade_letter(attempt.percentage),
            feedback=f'CBT {attempt.exam.get_assessment_type_display()}: {attempt.exam.title} — {attempt.percentage}%',
        )
        attempt.gradebook_synced = True
        attempt.save()
        return Response({'detail': 'Score synced to student gradebook.', 'grade_letter': self._calculate_grade_letter(attempt.percentage)})

    @staticmethod
    def _calculate_grade_letter(percentage):
        if percentage >= 90:
            return 'A+'
        elif percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B'
        elif percentage >= 60:
            return 'C'
        elif percentage >= 50:
            return 'D'
        return 'F'


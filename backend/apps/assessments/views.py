from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
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
                points=models.F('points') + log.points
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
        if user.is_admin:
            return CBTExam.objects.all()
        elif user.is_teacher and hasattr(user, 'teacher_profile'):
            return CBTExam.objects.filter(teacher=user.teacher_profile)
        elif user.is_student:
            return CBTExam.objects.filter(status='APPROVED')
        return CBTExam.objects.none()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user.teacher_profile)

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
        from apps.users.models import CustomUser
        admins = CustomUser.objects.filter(role='ADMIN')
        for admin in admins:
            CBTNotification.objects.create(
                user=admin,
                title=f'New {exam.get_assessment_type_display()} Pending Approval',
                message=f'"{exam.title}" for {exam.course.name} ({exam.get_term_display()}) has been submitted by {exam.teacher.user.get_full_name()} and needs your review.',
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
        # Notify teacher
        CBTNotification.objects.create(
            user=exam.teacher.user,
            title=f'{exam.get_assessment_type_display()} Approved!',
            message=f'Your exam "{exam.title}" has been approved by {request.user.get_full_name()} and is now published for students.',
            notification_type='APPROVED',
            exam=exam,
        )
        return Response({'detail': 'Exam approved and published.', 'status': exam.status})

    # ---------- Admin: Reject ----------
    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        exam = self.get_object()
        reason = request.data.get('reason', '')
        exam.status = 'REJECTED'
        exam.rejection_reason = reason
        exam.save()
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
        if exam.status != 'APPROVED':
            return Response({'detail': 'This exam is not available.'}, status=status.HTTP_400_BAD_REQUEST)
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


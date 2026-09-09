from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from apps.users.models import StudentProfile
from apps.users.permissions import IsAdmin, IsTeacher
from .models import BroadsheetScore, PromotionRecord, ClassAttendanceRecord
from .serializers import (
    BroadsheetScoreSerializer,
    PromotionRecordSerializer,
    ClassAttendanceRecordSerializer,
)


class BroadsheetViewSet(viewsets.ModelViewSet):
    queryset = BroadsheetScore.objects.all()
    serializer_class = BroadsheetScoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['batch_save', 'all_scores', 'create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return BroadsheetScore.objects.none()
        qs = super().get_queryset()
        if getattr(user, 'is_admin', False) or getattr(user, 'is_teacher', False) or user.is_staff or user.is_superuser:
            pass
        elif getattr(user, 'is_student', False) and hasattr(user, 'student_profile'):
            std_id = user.student_profile.student_id or ''
            qs = qs.filter(Q(student=user.student_profile) | Q(student_identifier=std_id) | Q(student_identifier=str(user.student_profile.id)))
        elif getattr(user, 'is_parent', False) and hasattr(user, 'parent_profile'):
            children = user.parent_profile.children.all()
            children_ids = list(children.values_list('student_id', flat=True))
            children_pks = [str(pk) for pk in children.values_list('id', flat=True)]
            qs = qs.filter(Q(student__in=children) | Q(student_identifier__in=children_ids) | Q(student_identifier__in=children_pks))
        else:
            return BroadsheetScore.objects.none()

        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student_identifier=student_id)
        term = self.request.query_params.get('term')
        if term:
            qs = qs.filter(term=term)
        session = self.request.query_params.get('session')
        if session:
            qs = qs.filter(session=session)
        return qs

    @action(detail=False, methods=['get'], url_path='all-scores')
    def all_scores(self, request):
        term = request.query_params.get('term', '1ST_TERM')
        session = request.query_params.get('session', '2026/2027')
        scores = BroadsheetScore.objects.filter(term=term, session=session)
        result = {}
        for s in scores:
            std_key = str(s.student_identifier)
            if std_key not in result:
                result[std_key] = {}
            result[std_key][s.course_code] = {
                'courseCode': s.course_code,
                'courseName': s.course_name or s.course_code,
                'ca1': s.ca1,
                'ca2': s.ca2,
                'cbt': s.cbt_score,
                'exam': s.exam,
                'total': s.total,
                'grade': s.grade,
                'remark': s.teacher_remark,
            }
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='batch-save')
    def batch_save(self, request):
        student_id = request.data.get('student_id') or request.data.get('studentId')
        scores_map = request.data.get('scores', {})
        term = request.data.get('term', '1ST_TERM')
        session = request.data.get('session', '2026/2027')

        if not student_id or not isinstance(scores_map, dict):
            return Response({'detail': 'student_id and scores object required'}, status=status.HTTP_400_BAD_REQUEST)

        # Attempt to link student profile
        student_obj = None
        if str(student_id).isdigit():
            student_obj = StudentProfile.objects.filter(id=int(student_id)).first()
        if not student_obj:
            student_obj = StudentProfile.objects.filter(student_id=str(student_id)).first()

        saved = []
        for course_code, sc in scores_map.items():
            if not isinstance(sc, dict):
                continue
            ca1 = float(sc.get('ca1') or 0)
            ca2 = float(sc.get('ca2') or 0)
            cbt_score = float(sc.get('cbt') or sc.get('cbt_score') or 0)
            exam = float(sc.get('exam') or 0)
            total = float(sc.get('total') or (ca1 + ca2 + cbt_score + exam))
            grade = sc.get('grade') or ''
            remark = sc.get('remark') or sc.get('teacher_remark') or ''
            c_name = sc.get('courseName') or sc.get('course_name') or course_code

            score_rec, _ = BroadsheetScore.objects.update_or_create(
                student_identifier=str(student_id),
                course_code=course_code,
                term=term,
                session=session,
                defaults={
                    'student': student_obj,
                    'course_name': c_name,
                    'ca1': ca1,
                    'ca2': ca2,
                    'cbt_score': cbt_score,
                    'exam': exam,
                    'total': total,
                    'grade': grade,
                    'teacher_remark': remark,
                }
            )
            saved.append(score_rec)

        return Response({'success': True, 'count': len(saved)}, status=status.HTTP_200_OK)


class PromotionRecordViewSet(viewsets.ModelViewSet):
    queryset = PromotionRecord.objects.all()
    serializer_class = PromotionRecordSerializer
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['post'], url_path='execute-batch')
    def execute_batch(self, request):
        payload = request.data
        promotions = payload.get('promotions', [])
        promoted_by = payload.get('promotedBy', request.user.get_full_name() if (request.user and request.user.is_authenticated and hasattr(request.user, 'get_full_name')) else 'Administrator')
        session = payload.get('academicSession', '2026/2027')
        term = payload.get('term', '3rd Term')

        saved_records = []
        for item in promotions:
            std_id = item.get('studentId')
            std_name = item.get('studentName', 'Student')
            std_code = item.get('studentCode', str(std_id))
            from_cls = item.get('fromClass', '')
            to_cls = item.get('toClass', '')

            # Create log record
            rec = PromotionRecord.objects.create(
                student_name=std_name,
                student_code=std_code,
                from_class=from_cls,
                to_class=to_cls,
                academic_session=session,
                term=term,
                promoted_by=promoted_by,
            )

            # Update actual StudentProfile grade_level in real-time
            student_profile = None
            if str(std_id).isdigit():
                student_profile = StudentProfile.objects.filter(id=int(std_id)).first()
            if not student_profile:
                student_profile = StudentProfile.objects.filter(student_id=std_code).first()

            if student_profile and to_cls:
                student_profile.grade_level = to_cls
                student_profile.save(update_fields=['grade_level'])

            saved_records.append(rec)

        return Response({
            'success': True,
            'count': len(saved_records),
            'records': PromotionRecordSerializer(saved_records, many=True).data
        }, status=status.HTTP_200_OK)


class ClassAttendanceViewSet(viewsets.ModelViewSet):
    queryset = ClassAttendanceRecord.objects.all()
    serializer_class = ClassAttendanceRecordSerializer
    permission_classes = [IsTeacher]

    @action(detail=False, methods=['post'], url_path='batch-mark')
    def batch_mark(self, request):
        attendances = request.data.get('records', [])
        saved = []
        default_marker = request.user.get_full_name() if (request.user and request.user.is_authenticated and hasattr(request.user, 'get_full_name') and request.user.get_full_name()) else 'Teacher'
        for att in attendances:
            std_id = att.get('studentId') or att.get('student_identifier')
            std_name = att.get('studentName', '')
            cls_name = att.get('className', '')
            exam_id = att.get('examId')
            status_val = att.get('status', 'PRESENT')
            stream = att.get('stream', '')
            marked_by = att.get('markedBy') or default_marker

            rec = ClassAttendanceRecord.objects.create(
                student_name=std_name,
                student_identifier=str(std_id),
                class_name=cls_name,
                stream=stream,
                exam_id=exam_id,
                status=status_val,
                marked_by=marked_by,
            )
            saved.append(rec)

        return Response({'success': True, 'count': len(saved)}, status=status.HTTP_200_OK)

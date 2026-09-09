import hashlib
import hmac
import os
import re
import requests
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.permissions import IsAdmin, IsTeacher, IsParent, IsStudent
from .models import (
    FeeItem, FeeTransaction, IncomeRecord, ExpenseRecord,
    ClassFeeSchedule, DiscountPolicy, StudentFeeAccount
)
from .serializers import (
    FeeItemSerializer,
    FeeTransactionSerializer,
    IncomeRecordSerializer,
    ExpenseRecordSerializer,
    ClassFeeScheduleSerializer,
    DiscountPolicySerializer,
    StudentFeeAccountSerializer,
)


class FeeItemViewSet(viewsets.ModelViewSet):
    queryset = FeeItem.objects.all()
    serializer_class = FeeItemSerializer
    lookup_field = 'item_key'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs[lookup_url_kwarg]
        # Try item_key first, then primary key id
        obj = FeeItem.objects.filter(item_key=lookup_val).first()
        if not obj and str(lookup_val).isdigit():
            obj = FeeItem.objects.filter(id=int(lookup_val)).first()
        if not obj:
            from django.http import Http404
            raise Http404
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=['post'], url_path='bulk-save')
    def bulk_save(self, request):
        items = request.data if isinstance(request.data, list) else request.data.get('items', [])
        saved_items = []
        for item in items:
            key = item.get('id') or item.get('item_key')
            if not key:
                continue
            fee_obj, _ = FeeItem.objects.update_or_create(
                item_key=key,
                defaults={
                    'name': item.get('name', key.title()),
                    'category': item.get('category', 'Tuition & Basic'),
                    'parent_id': item.get('parentId') or item.get('parent_id'),
                    'amount': item.get('amount', 0),
                    'grade_amounts': item.get('gradeAmounts') or item.get('grade_amounts') or {},
                    'currency': item.get('currency', 'NGN'),
                    'due_date': item.get('dueDate') or item.get('due_date') or None,
                    'description': item.get('description', ''),
                }
            )
            saved_items.append(fee_obj)
        serializer = FeeItemSerializer(saved_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FeeTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for transactions scoped strictly to caller's role.
    Transactions are recorded server-side via PaystackVerifyView or PaystackWebhookView.
    """
    queryset = FeeTransaction.objects.all().order_by('-paid_at')
    serializer_class = FeeTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return FeeTransaction.objects.none()

        if getattr(user, 'is_admin', False) or user.is_staff or user.is_superuser:
            qs = FeeTransaction.objects.all().order_by('-paid_at')
        elif getattr(user, 'is_parent', False) and hasattr(user, 'parent_profile'):
            children = user.parent_profile.children.all()
            c_emails = [c.user.email for c in children if c.user and c.user.email]
            c_ids = [c.student_id for c in children if c.student_id]
            qs = FeeTransaction.objects.filter(
                Q(student_email__in=c_emails) |
                Q(student__in=children)
            ).order_by('-paid_at')
        else:
            # Student or personal caller
            q = Q(student_email__iexact=user.email)
            if hasattr(user, 'student_profile') and user.student_profile:
                q |= Q(student=user.student_profile)
            qs = FeeTransaction.objects.filter(q).order_by('-paid_at')

        student_id = self.request.query_params.get('student_id')
        if student_id:
            qs = qs.filter(student__student_id=student_id)
        email = self.request.query_params.get('email')
        if email:
            qs = qs.filter(student_email__iexact=email)
        return qs


class PaystackVerifyView(APIView):
    """
    Authoritative server-side payment verification via Paystack API.
    Replaces client-side status assertions and offline simulators.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        reference = (request.data.get('reference') or request.data.get('ref') or '').strip()
        if not reference or not re.fullmatch(r'[A-Za-z0-9_\-]{6,100}', reference):
            return Response({'detail': 'Invalid transaction reference format.'}, status=status.HTTP_400_BAD_REQUEST)

        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', None) or os.getenv('PAYSTACK_SECRET_KEY', '')
        payload = {}

        if secret_key:
            try:
                resp = requests.get(
                    f'https://api.paystack.co/transaction/verify/{reference}',
                    headers={'Authorization': f'Bearer {secret_key}'},
                    timeout=15,
                )
                if resp.status_code == 200:
                    resp_json = resp.json()
                    payload = resp_json.get('data', {})
                else:
                    return Response({'detail': 'Paystack returned non-success response.'}, status=status.HTTP_402_PAYMENT_REQUIRED)
            except Exception as e:
                return Response({'detail': f'Gateway network error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

            if payload.get('status') != 'success':
                return Response({'detail': 'Payment could not be verified with Paystack.'}, status=status.HTTP_402_PAYMENT_REQUIRED)

            amount_naira = float(payload.get('amount', 0)) / 100.0
        elif getattr(settings, 'DEBUG', False):
            # Development fallback when running locally without secret key
            amount_naira = float(request.data.get('amount') or 0.0)
            payload = {'status': 'success', 'reference': reference, 'simulated': True}
        else:
            return Response({'detail': 'Payment gateway credentials are not configured on server.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        with transaction.atomic():
            student_profile = getattr(request.user, 'student_profile', None)
            student_name = request.data.get('studentName') or request.data.get('student_name') or request.user.get_full_name() or 'Student'
            item_key = request.data.get('itemId') or request.data.get('item_key', 'general_fee')
            item_name = request.data.get('itemName') or request.data.get('item_name', 'School Fee Payment')
            term = request.data.get('term', '1ST_TERM')
            session = request.data.get('session', '2026/2027')
            receipt_url = request.data.get('receiptUrl') or request.data.get('receipt_url') or ''

            tx, created = FeeTransaction.objects.update_or_create(
                reference=reference,
                defaults={
                    'student': student_profile,
                    'student_name': student_name,
                    'student_email': request.user.email,
                    'item_key': item_key,
                    'item_name': item_name,
                    'amount': amount_naira,
                    'channel': FeeTransaction.Channel.PAYSTACK,
                    'status': FeeTransaction.Status.SUCCESS,
                    'term': term,
                    'session': session,
                    'receipt_url': receipt_url,
                }
            )

        return Response(FeeTransactionSerializer(tx).data, status=status.HTTP_200_OK)


class PaystackWebhookView(APIView):
    """
    Webhook endpoint to capture payment settlements asynchronously with HMAC-SHA512 validation.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        signature = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', None) or os.getenv('PAYSTACK_SECRET_KEY', '')
        if not signature or not secret_key:
            return Response({'detail': 'Signature header or secret key missing.'}, status=status.HTTP_400_BAD_REQUEST)

        computed_sig = hmac.new(secret_key.encode('utf-8'), request.body, hashlib.sha512).hexdigest()
        if not hmac.compare_digest(computed_sig, signature):
            return Response({'detail': 'Invalid webhook signature.'}, status=status.HTTP_401_UNAUTHORIZED)

        event_data = request.data
        if event_data.get('event') == 'charge.success':
            data = event_data.get('data', {})
            ref = data.get('reference')
            if ref:
                FeeTransaction.objects.filter(reference=ref).update(status=FeeTransaction.Status.SUCCESS)

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class IncomeRecordViewSet(viewsets.ModelViewSet):
    queryset = IncomeRecord.objects.all().order_by('-date')
    serializer_class = IncomeRecordSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        serializer.save(recorded_by=user)


class ExpenseRecordViewSet(viewsets.ModelViewSet):
    queryset = ExpenseRecord.objects.all().order_by('-date')
    serializer_class = ExpenseRecordSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        serializer.save(recorded_by=user)


class ClassFeeScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassFeeSchedule.objects.all()
    serializer_class = ClassFeeScheduleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        if not ClassFeeSchedule.objects.exists():
            default_classes = [
                ('Nursery 1', 'CRECHE_NURSERY', 35000, 5000, 10000, 8000, 3000, 2000),
                ('Nursery 2', 'CRECHE_NURSERY', 35000, 5000, 10000, 8000, 3000, 2000),
                ('Nursery 3', 'CRECHE_NURSERY', 38000, 5000, 10000, 8000, 3000, 2000),
                ('Primary 1', 'PRIMARY', 40000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 2', 'PRIMARY', 40000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 3', 'PRIMARY', 42000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 4', 'PRIMARY', 42000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 5', 'PRIMARY', 45000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 6', 'PRIMARY', 48000, 6000, 12000, 9000, 3000, 2000),
                ('JSS 1', 'SECONDARY', 55000, 8000, 15000, 12000, 4000, 3000),
                ('JSS 2', 'SECONDARY', 55000, 8000, 15000, 12000, 4000, 3000),
                ('JSS 3', 'SECONDARY', 60000, 8000, 15000, 12000, 4000, 5000),
                ('SS 1', 'SECONDARY', 65000, 10000, 18000, 14000, 5000, 4000),
                ('SS 2', 'SECONDARY', 65000, 10000, 18000, 14000, 5000, 4000),
                ('SS 3', 'SECONDARY', 75000, 10000, 18000, 14000, 5000, 10000),
            ]
            for c_name, div, tuit, dev, bks, unif, pta, ex in default_classes:
                ClassFeeSchedule.objects.create(
                    class_name=c_name,
                    division=div,
                    tuition=tuit,
                    development_levy=dev,
                    books_materials=bks,
                    uniform_sports=unif,
                    pta_medical=pta,
                    exam_levy=ex,
                    session='2025/2026',
                    term='2nd Term'
                )
        return super().get_queryset()

    @action(detail=False, methods=['post'], url_path='bulk-save')
    def bulk_save(self, request):
        schedules_data = request.data if isinstance(request.data, list) else request.data.get('schedules', [])
        saved = []
        for s in schedules_data:
            c_name = s.get('className') or s.get('class_name')
            if not c_name:
                continue
            obj, _ = ClassFeeSchedule.objects.update_or_create(
                class_name=c_name,
                defaults={
                    'division': s.get('division', 'SECONDARY'),
                    'tuition': s.get('tuition', 50000),
                    'development_levy': s.get('development_levy') or s.get('devLevy', 5000),
                    'books_materials': s.get('books_materials') or s.get('booksMaterials', 10000),
                    'uniform_sports': s.get('uniform_sports') or s.get('uniformSports', 8000),
                    'pta_medical': s.get('pta_medical') or s.get('ptaMedical', 3000),
                    'exam_levy': s.get('exam_levy') or s.get('examLevy', 2000),
                    'session': s.get('session', '2025/2026'),
                    'term': s.get('term', '2nd Term'),
                }
            )
            saved.append(obj)
        serializer = ClassFeeScheduleSerializer(saved, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DiscountPolicyViewSet(viewsets.ModelViewSet):
    queryset = DiscountPolicy.objects.all()
    serializer_class = DiscountPolicySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        if not DiscountPolicy.objects.exists():
            default_discounts = [
                ('SIBLING_2ND', '2nd Sibling Concession', 'PERCENTAGE', 10.00, '10% discount on tuition for second enrolled child.'),
                ('SIBLING_3RD', '3rd Sibling Concession', 'PERCENTAGE', 15.00, '15% discount on tuition for third and subsequent children.'),
                ('STAFF_CHILD', 'Faculty / Staff Child Waiver', 'PERCENTAGE', 50.00, '50% tuition waiver for biological children of full-time educators.'),
                ('SCHOLARSHIP_MERIT', 'Academic Excellence Scholarship', 'PERCENTAGE', 100.00, 'Full tuition scholarship for outstanding academic scholars.'),
            ]
            for code, name, dtype, val, desc in default_discounts:
                DiscountPolicy.objects.create(
                    code=code,
                    name=name,
                    discount_type=dtype,
                    value=val,
                    description=desc,
                    is_active=True
                )
        return super().get_queryset()


class StudentFeeAccountViewSet(viewsets.ModelViewSet):
    queryset = StudentFeeAccount.objects.all()
    serializer_class = StudentFeeAccountSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return StudentFeeAccount.objects.none()

        if getattr(user, 'is_admin', False) or user.is_staff or user.is_superuser:
            queryset = super().get_queryset()
        elif getattr(user, 'is_student', False) and hasattr(user, 'student_profile'):
            queryset = StudentFeeAccount.objects.filter(student=user.student_profile)
        elif getattr(user, 'is_parent', False) and hasattr(user, 'parent_profile'):
            queryset = StudentFeeAccount.objects.filter(student__in=user.parent_profile.children.all())
        else:
            return StudentFeeAccount.objects.none()

        cls = self.request.query_params.get('class_level')
        if cls and cls != 'ALL':
            queryset = queryset.filter(class_level=cls)
        st = self.request.query_params.get('status')
        if st and st != 'ALL':
            queryset = queryset.filter(status=st)
        return queryset

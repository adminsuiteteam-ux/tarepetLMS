from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
        return [permissions.IsAuthenticated()]

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_val = self.kwargs[lookup_url_kwarg]
        # Try item_key first, then primary key id
        obj = FeeItem.objects.filter(item_key=lookup_val).first()
        if not obj and lookup_val.isdigit():
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
                    'is_required': item.get('isRequired', False),
                    'term': item.get('term', '1ST_TERM'),
                    'session': item.get('session', '2026/2027'),
                }
            )
            saved_items.append(fee_obj)
        serializer = FeeItemSerializer(saved_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FeeTransactionViewSet(viewsets.ModelViewSet):
    queryset = FeeTransaction.objects.all()
    serializer_class = FeeTransactionSerializer

    def get_permissions(self):
        return [permissions.AllowAny()]  # allow transactions recording from Paystack checkout

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        email = self.request.query_params.get('email')
        if email:
            queryset = queryset.filter(student_email=email)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        # Accept camelCase payload fields
        ref = data.get('reference') or data.get('ref')
        if not ref:
            import time
            ref = f"TX_{int(time.time()*1000)}"
            data['reference'] = ref

        student_name = data.get('studentName') or data.get('student_name', 'Student')
        student_email = data.get('studentEmail') or data.get('student_email', '')
        item_key = data.get('itemId') or data.get('item_key', 'general_fee')
        item_name = data.get('itemName') or data.get('item_name', 'General School Fee')
        amount = data.get('amount', 0)
        channel = data.get('channel', 'paystack')
        status_val = data.get('status', 'SUCCESS')
        term = data.get('term', '1ST_TERM')
        session = data.get('session', '2026/2027')
        receipt_url = data.get('receiptUrl') or data.get('receipt_url')

        tx, created = FeeTransaction.objects.update_or_create(
            reference=ref,
            defaults={
                'student_name': student_name,
                'student_email': student_email,
                'item_key': item_key,
                'item_name': item_name,
                'amount': amount,
                'channel': channel,
                'status': status_val,
                'term': term,
                'session': session,
                'receipt_url': receipt_url,
            }
        )
        return Response(FeeTransactionSerializer(tx).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class IncomeRecordViewSet(viewsets.ModelViewSet):
    queryset = IncomeRecord.objects.all()
    serializer_class = IncomeRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class ExpenseRecordViewSet(viewsets.ModelViewSet):
    queryset = ExpenseRecord.objects.all()
    serializer_class = ExpenseRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class ClassFeeScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassFeeSchedule.objects.all()
    serializer_class = ClassFeeScheduleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Auto-seed if empty
        if not ClassFeeSchedule.objects.exists():
            default_classes = [
                ('Nursery 1', 'CRECHE_NURSERY', 35000, 5000, 10000, 8000, 3000, 2000),
                ('Nursery 2', 'CRECHE_NURSERY', 35000, 5000, 10000, 8000, 3000, 2000),
                ('Nursery 3', 'CRECHE_NURSERY', 38000, 5000, 10000, 8000, 3000, 2000),
                ('Primary 1', 'PRIMARY', 40000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 2', 'PRIMARY', 40000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 3', 'PRIMARY', 42000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 4', 'PRIMARY', 42000, 6000, 12000, 9000, 3000, 2000),
                ('Primary 5', 'PRIMARY', 45000, 6000, 14000, 9000, 3000, 3000),
                ('Primary 6', 'PRIMARY', 48000, 6000, 14000, 9000, 3000, 5000),
                ('JSS 1', 'JUNIOR_SECONDARY', 45000, 8000, 15000, 10000, 4000, 3000),
                ('JSS 2', 'JUNIOR_SECONDARY', 45000, 8000, 15000, 10000, 4000, 3000),
                ('JSS 3', 'JUNIOR_SECONDARY', 50000, 8000, 15000, 10000, 4000, 10000),
                ('SS 1', 'SENIOR_SECONDARY', 55000, 10000, 18000, 12000, 5000, 4000),
                ('SS 2', 'SENIOR_SECONDARY', 55000, 10000, 18000, 12000, 5000, 4000),
                ('SS 3', 'SENIOR_SECONDARY', 60000, 10000, 18000, 12000, 5000, 15000),
            ]
            for cl, div, tuit, dev, bks, unif, pta, exm in default_classes:
                ClassFeeSchedule.objects.create(
                    class_level=cl,
                    division=div,
                    tuition_fee=tuit,
                    development_levy=dev,
                    books_materials=bks,
                    uniform_sports=unif,
                    pta_medical=pta,
                    exam_levy=exm,
                    session='2025/2026',
                    term='2nd Term'
                )
        return super().get_queryset()

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update(self, request):
        schedules = request.data if isinstance(request.data, list) else request.data.get('schedules', [])
        saved = []
        for s in schedules:
            cl = s.get('class_level') or s.get('classLevel')
            if not cl:
                continue
            obj, _ = ClassFeeSchedule.objects.update_or_create(
                class_level=cl,
                defaults={
                    'division': s.get('division', 'PRIMARY'),
                    'tuition_fee': s.get('tuition_fee') or s.get('tuitionFee', 40000),
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
    permission_classes = [permissions.AllowAny]

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
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        cls = self.request.query_params.get('class_level')
        if cls and cls != 'ALL':
            queryset = queryset.filter(class_level=cls)
        st = self.request.query_params.get('status')
        if st and st != 'ALL':
            queryset = queryset.filter(status=st)
        return queryset

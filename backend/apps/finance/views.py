from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FeeItem, FeeTransaction, IncomeRecord, ExpenseRecord
from .serializers import (
    FeeItemSerializer,
    FeeTransactionSerializer,
    IncomeRecordSerializer,
    ExpenseRecordSerializer,
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

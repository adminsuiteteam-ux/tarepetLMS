from rest_framework import serializers
from .models import FeeItem, FeeTransaction, IncomeRecord, ExpenseRecord


class FeeItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='item_key', required=False)

    class Meta:
        model = FeeItem
        fields = [
            'id', 'item_key', 'name', 'category', 'parent_id',
            'amount', 'grade_amounts', 'currency', 'due_date',
            'description', 'isRequired', 'term', 'session',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    # Handle isRequired alias for frontend
    isRequired = serializers.BooleanField(source='is_required', required=False)

    def create(self, validated_data):
        item_key = validated_data.get('item_key') or self.initial_data.get('id')
        if not item_key:
            name = validated_data.get('name', 'fee')
            item_key = name.lower().replace(' ', '_')
        validated_data['item_key'] = item_key
        return FeeItem.objects.create(**validated_data)


class FeeTransactionSerializer(serializers.ModelSerializer):
    studentId = serializers.CharField(source='student_id', required=False, allow_null=True)
    studentName = serializers.CharField(source='student_name', required=False)
    studentEmail = serializers.CharField(source='student_email', required=False, allow_blank=True, allow_null=True)
    itemId = serializers.CharField(source='item_key', required=False)
    itemName = serializers.CharField(source='item_name', required=False)
    paidAt = serializers.DateTimeField(source='paid_at', read_only=True)
    receiptUrl = serializers.CharField(source='receipt_url', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = FeeTransaction
        fields = [
            'id', 'reference', 'studentId', 'studentName', 'studentEmail',
            'itemId', 'itemName', 'amount', 'currency', 'channel',
            'status', 'paidAt', 'receiptUrl', 'term', 'session'
        ]


class IncomeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeRecord
        fields = '__all__'


class ExpenseRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseRecord
        fields = '__all__'

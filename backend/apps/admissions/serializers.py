from rest_framework import serializers
from .models import AdmissionApplication


class AdmissionApplicationSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='parent_name', required=False)
    childAge = serializers.CharField(source='child_age', required=False)
    childName = serializers.CharField(source='child_name', required=False, allow_blank=True, allow_null=True)
    gradeApplying = serializers.CharField(source='grade_applying', required=False, allow_blank=True, allow_null=True)
    previousSchool = serializers.CharField(source='previous_school', required=False, allow_blank=True, allow_null=True)
    adminNotes = serializers.CharField(source='admin_notes', required=False, allow_blank=True, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = AdmissionApplication
        fields = [
            'id', 'name', 'parent_name', 'email', 'phone',
            'childName', 'child_name', 'childAge', 'child_age',
            'gradeApplying', 'grade_applying', 'previousSchool', 'previous_school',
            'message', 'status', 'adminNotes', 'admin_notes',
            'createdAt', 'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        # Handle field alias mappings
        if 'parent_name' not in validated_data and 'name' in self.initial_data:
            validated_data['parent_name'] = self.initial_data['name']
        if 'child_age' not in validated_data and 'childAge' in self.initial_data:
            validated_data['child_age'] = self.initial_data['childAge']
        return super().create(validated_data)

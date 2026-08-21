from django.contrib import admin
from .models import AdmissionApplication

@admin.register(AdmissionApplication)
class AdmissionApplicationAdmin(admin.ModelAdmin):
    list_display = ('parent_name', 'email', 'phone', 'child_name', 'child_age', 'grade_applying', 'status', 'created_at')
    search_fields = ('parent_name', 'email', 'phone', 'child_name')
    list_filter = ('status', 'grade_applying', 'created_at')

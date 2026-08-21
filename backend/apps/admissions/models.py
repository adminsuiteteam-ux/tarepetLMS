from django.db import models
from django.utils.translation import gettext_lazy as _


class AdmissionApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        UNDER_REVIEW = 'UNDER_REVIEW', _('Under Review')
        ACCEPTED = 'ACCEPTED', _('Accepted')
        REJECTED = 'REJECTED', _('Rejected')

    parent_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    child_name = models.CharField(max_length=255, blank=True, null=True)
    child_age = models.CharField(max_length=100)
    grade_applying = models.CharField(max_length=100, blank=True, null=True)
    previous_school = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField()
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Application: {self.parent_name} ({self.child_name or self.child_age}) - {self.status}"

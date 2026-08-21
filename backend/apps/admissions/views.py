from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import AdmissionApplication
from .serializers import AdmissionApplicationSerializer


class AdmissionApplicationViewSet(viewsets.ModelViewSet):
    queryset = AdmissionApplication.objects.all()
    serializer_class = AdmissionApplicationSerializer

    def get_permissions(self):
        # Allow anyone on public website to submit admission inquiry/application
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

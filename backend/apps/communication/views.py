from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Announcement, ContactMessage
from .serializers import AnnouncementSerializer, ContactMessageSerializer


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    def get_queryset(self):
        user = self.request.user
        role_param = self.request.query_params.get('role')
        if role_param:
            return Announcement.objects.filter(target_role__in=['ALL', role_param.upper()])
        if user.is_authenticated:
            if user.is_admin:
                return Announcement.objects.all()
            return Announcement.objects.filter(target_role__in=['ALL', user.role])
        return Announcement.objects.filter(target_role='ALL')


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

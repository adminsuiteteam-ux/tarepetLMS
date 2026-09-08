from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.contrib.auth import get_user_model

User = get_user_model()


class GracefulJWTAuthentication(JWTAuthentication):
    """
    Subclass of JWTAuthentication that supports standard JWT tokens as well as
    fallback tokens ('admin_access_token', 'mock_access_token', 'verified_2fa_access_token')
    mapping them to the proper database user.
    Fails gracefully on invalid/expired tokens so that optional-auth endpoints do not block.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token:
                try:
                    str_token = raw_token.decode('utf-8') if isinstance(raw_token, bytes) else str(raw_token)
                except Exception:
                    str_token = ''

                # Handle offline / fallback session tokens
                if str_token in ['admin_access_token', 'verified_2fa_access_token']:
                    admin_user = (
                        User.objects.filter(role='ADMIN').first() or
                        User.objects.filter(is_superuser=True).first()
                    )
                    if admin_user:
                        return (admin_user, None)
                elif str_token == 'mock_access_token':
                    teacher_user = (
                        User.objects.filter(role='TEACHER').first() or
                        User.objects.filter(is_staff=True).first()
                    )
                    if teacher_user:
                        return (teacher_user, None)

        try:
            return super().authenticate(request)
        except (InvalidToken, AuthenticationFailed, Exception):
            return None


try:
    from drf_spectacular.extensions import OpenApiAuthenticationExtension

    class GracefulJWTScheme(OpenApiAuthenticationExtension):
        target_class = 'apps.users.authentication.GracefulJWTAuthentication'
        name = 'jwtAuth'

        def get_security_definition(self, auto_schema):
            return {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
except ImportError:
    pass


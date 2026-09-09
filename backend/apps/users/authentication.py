from typing import Optional
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication, AuthUser
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken, Token
from django.contrib.auth import get_user_model

User = get_user_model()


class GracefulJWTAuthentication(JWTAuthentication):
    """
    Standard JWT Authentication for DRF with OpenAPI scheme compatibility.
    Invalid tokens raise appropriate authentication errors.
    """
    pass


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


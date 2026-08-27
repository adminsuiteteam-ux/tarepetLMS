from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class GracefulJWTAuthentication(JWTAuthentication):
    """
    Subclass of JWTAuthentication that fails gracefully on invalid/mock/expired tokens
    so that endpoints with AllowAny or optional authentication do not get blocked by 401.
    """
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, AuthenticationFailed, Exception):
            # Return None so DRF treats the request as unauthenticated rather than throwing a 401 error
            return None

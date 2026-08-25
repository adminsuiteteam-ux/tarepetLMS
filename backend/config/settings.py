import os
from datetime import timedelta
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()

# Load .env file if present in BASE_DIR or parent directory
env_file = BASE_DIR / '.env'
if not env_file.exists():
    env_file = BASE_DIR.parent / '.env'
if env_file.exists():
    environ.Env.read_env(str(env_file))

import logging
import secrets

def get_secret_key():
    secret = env('SECRET_KEY', default=None) or os.getenv('SECRET_KEY')
    if secret:
        return secret
    secret_file = BASE_DIR / 'secret_key.txt'
    if secret_file.exists():
        return secret_file.read_text().strip()
    return 'tarepet-montessori-lms-enterprise-super-secure-key-2026-prod-jwt-neon-layerbase'

SECRET_KEY = get_secret_key()
DEBUG = env.bool('DEBUG', default=True)

try:
    # pyrefly: ignore [missing-import]
    import sentry_sdk
    # pyrefly: ignore [missing-import]
    from sentry_sdk.integrations.django import DjangoIntegration
    # pyrefly: ignore [missing-import]
    from sentry_sdk.integrations.celery import CeleryIntegration
    _sentry_dsn = env('SENTRY_DSN', default=None) or os.getenv('SENTRY_DSN')
    if _sentry_dsn:
        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[DjangoIntegration(), CeleryIntegration()],
            traces_sample_rate=env.float('SENTRY_TRACES_SAMPLE_RATE', default=0.2),
            profiles_sample_rate=env.float('SENTRY_PROFILES_SAMPLE_RATE', default=0.1),
            send_default_pii=False,
            environment=env('ENVIRONMENT', default='production' if not DEBUG else 'development'),
        )
except ImportError:
    pass
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Security settings
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://tarepetmontessorischool.com',
    'https://www.tarepetmontessorischool.com',
    'https://tarepet-backend-4iw6.onrender.com',
    'https://*.onrender.com',
    'https://*.serveousercontent.com',
    'https://*.lhr.life',
    'https://*.loca.lt',
])
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=not DEBUG)
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=not DEBUG)
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=not DEBUG)
if not DEBUG:
    SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Channels & WebSockets
    'channels',

    # Cloudinary for media uploads
    'cloudinary_storage',
    'cloudinary',

    # Third-party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',
    'django_celery_beat',

    # LMS Local Apps
    'apps.users',
    'apps.courses',
    'apps.assessments',
    'apps.finance',
    'apps.academics',
    'apps.admissions',
    'apps.communication',
]

ASGI_APPLICATION = 'config.asgi.application'

_redis_url = env('REDIS_URL', default='')
if _redis_url:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [_redis_url],
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Render static files
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database Configuration (Layerbase PostgreSQL Serverless)
_db_config = env.db(
    'DATABASE_URL',
    default=f"sqlite:///{os.path.join(BASE_DIR, 'db.sqlite3')}"
)
# Layerbase serverless keepalive & pool settings
if _db_config.get('ENGINE') != 'django.db.backends.sqlite3':
    _db_config.update({
        'CONN_MAX_AGE': 0,   # serverless: no persistent connections (prevents mid-op drops)
        'OPTIONS': {
            'sslmode': 'require',
            'keepalives': 1,
            'keepalives_idle': 60,
            'keepalives_interval': 10,
            'keepalives_count': 5,
            'connect_timeout': 60,  # allow 60s for Layerbase cold-start wake-up
        },
    })
DATABASES = {'default': _db_config}

# Custom User Model
AUTH_USER_MODEL = 'users.CustomUser'

AUTHENTICATION_BACKENDS = [
    'apps.users.backends.EmailOrIDModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# SimpleJWT Settings (Persistent 30-day session)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=env.int('ACCESS_TOKEN_LIFETIME_DAYS', default=30)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=env.int('REFRESH_TOKEN_LIFETIME_DAYS', default=180)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# OpenAPI Docs (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Tarepet Montessori LMS Platform API',
    'DESCRIPTION': 'API backend for Tarepet Montessori School LMS with multi-role access control.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Persistent Cache Settings (PostgreSQL Database Cache + Redis if available)
if _redis_url:
    try:
        # pyrefly: ignore [missing-import]
        import django_redis
        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': _redis_url,
                'OPTIONS': {
                    'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                    'SOCKET_CONNECT_TIMEOUT': 10,
                    'SOCKET_TIMEOUT': 10,
                    'CONNECTION_POOL_KWARGS': {
                        'max_connections': 50,
                        'retry_on_timeout': True,
                    },
                    'IGNORE_EXCEPTIONS': True,
                }
            }
        }
        SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
        SESSION_CACHE_ALIAS = 'default'
    except ImportError:
        CACHES = {
            'default': {
                'BACKEND': 'django.core.cache.backends.redis.RedisCache',
                'LOCATION': _redis_url,
            }
        }
        SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'tarepet_cache_table',
            'TIMEOUT': 86400 * 30,  # 30 days cache retention
            'OPTIONS': {
                'MAX_ENTRIES': 10000,
                'CULL_FREQUENCY': 3,
            }
        }
    }
    SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
    SESSION_CACHE_ALIAS = 'default'

SESSION_COOKIE_AGE = 86400 * 30  # 30 days
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Celery Settings
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default=_redis_url or 'redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default=_redis_url or 'redis://127.0.0.1:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# CORS Headers
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=[
        'https://tarepetmontessorischool.com',
        'https://tarepet-frontend.onrender.com',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]
)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.onrender\.com$",
    r"^https://.*\.github\.io$",
]
CORS_ALLOW_CREDENTIALS = True

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
WHITENOISE_MANIFEST_STRICT = False
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Cloudinary Configuration
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': env('CLOUDINARY_CLOUD_NAME', default=''),
    'API_KEY': env('CLOUDINARY_API_KEY', default=''),
    'API_SECRET': env('CLOUDINARY_API_SECRET', default=''),
}

if CLOUDINARY_STORAGE['CLOUD_NAME'] and CLOUDINARY_STORAGE['API_KEY'] and CLOUDINARY_STORAGE['API_SECRET']:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LOGIN_REDIRECT_URL = '/admin/'
LOGOUT_REDIRECT_URL = '/admin/login/'

# Production Security Headers (applied when DEBUG=False)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = False  # Render handles SSL termination
    SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=True)
    CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=True)
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'

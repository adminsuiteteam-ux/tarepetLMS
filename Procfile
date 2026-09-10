web: cd backend && (python manage.py migrate --no-input || true) && (python manage.py seed_lms_data || true) && daphne -b 0.0.0.0 -p $PORT config.asgi:application

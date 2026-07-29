#!/bin/sh
set -e

echo "==> Running database migrations on Layerbase PostgreSQL..."
python manage.py migrate --no-input

echo "==> Collecting static files..."
python manage.py collectstatic --no-input

echo "==> Starting Gunicorn server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120

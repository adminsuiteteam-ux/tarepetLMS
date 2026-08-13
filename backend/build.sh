#!/usr/bin/env bash
# Render build script for Tarepet Montessori Django Backend
set -o errexit

echo "==> Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
  python3 -m venv venv || python -m venv venv || true
fi
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
fi

echo "==> Installing Python dependencies..."
python3 -m pip install --upgrade pip --break-system-packages || pip install --upgrade pip --break-system-packages || true
python3 -m pip install -r requirements.txt --break-system-packages || pip install -r requirements.txt --break-system-packages || pip install -r requirements.txt

echo "==> Collecting static files..."
python3 manage.py collectstatic --no-input || python manage.py collectstatic --no-input

echo "==> Running database migrations..."
python3 manage.py migrate --no-input || python manage.py migrate --no-input

echo "==> Seeding Django Super Admin and initial LMS data..."
python3 manage.py seed_lms_data || python manage.py seed_lms_data || true

echo "==> Build complete!"

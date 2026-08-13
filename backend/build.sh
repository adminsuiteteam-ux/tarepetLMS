#!/usr/bin/env bash
# Render build script for Tarepet Montessori Django Backend
set -o errexit

echo "==> Installing Python dependencies..."
python3 -m pip install --upgrade pip || pip install --upgrade pip
python3 -m pip install -r requirements.txt || pip install -r requirements.txt

echo "==> Collecting static files..."
python3 manage.py collectstatic --no-input || python manage.py collectstatic --no-input

echo "==> Running database migrations..."
python3 manage.py migrate --no-input || python manage.py migrate --no-input

echo "==> Build complete!"

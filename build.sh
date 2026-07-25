#!/usr/bin/env bash
set -o errexit

echo "==> Building Tarepet Montessori Backend..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
echo "==> Build complete!"

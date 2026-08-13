#!/usr/bin/env bash
set -o errexit

echo "==> Building Tarepet Montessori Backend..."
cd backend

if [ ! -d "venv" ]; then
  python3 -m venv venv || python -m venv venv || true
fi
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
fi

python3 -m pip install --upgrade pip --break-system-packages || pip install --upgrade pip --break-system-packages || true
python3 -m pip install -r requirements.txt --break-system-packages || pip install -r requirements.txt --break-system-packages || pip install -r requirements.txt

python3 manage.py collectstatic --no-input || python manage.py collectstatic --no-input
python3 manage.py migrate --no-input || python manage.py migrate --no-input
python3 manage.py seed_lms_data || python manage.py seed_lms_data || true

echo "==> Build complete!"

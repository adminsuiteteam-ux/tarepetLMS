// Render Node runtime wrapper launcher for Tarepet Django API
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 8000;
console.log(`==> Starting Tarepet API Backend Service on port ${port}...`);

// Determine python and gunicorn executables (prefer venv if created)
const venvPython = path.join(__dirname, 'venv', 'bin', 'python3');
const venvGunicorn = path.join(__dirname, 'venv', 'bin', 'gunicorn');

const pythonBin = fs.existsSync(venvPython) ? venvPython : 'python3';
const gunicornBin = fs.existsSync(venvGunicorn) ? venvGunicorn : 'gunicorn';

// Start Gunicorn Python WSGI server
const gunicorn = spawn(gunicornBin, ['config.wsgi:application', '--bind', `0.0.0.0:${port}`, '--workers', '2', '--timeout', '120'], { stdio: 'inherit', env: process.env });

gunicorn.on('error', (err) => {
  console.warn(`gunicorn execution warning: ${err.message}. Trying python manage.py runserver...`);
  const devServer = spawn(pythonBin, ['manage.py', 'runserver', `0.0.0.0:${port}`], { stdio: 'inherit', env: process.env });
  devServer.on('error', (e) => {
    console.error(`Failed to start python server: ${e.message}`);
  });
});

gunicorn.on('exit', (exitCode) => {
  console.log(`Backend server exited with code ${exitCode}`);
});

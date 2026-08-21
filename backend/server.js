// Render Node runtime wrapper launcher for Tarepet Django API & WebSockets
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 8000;
console.log(`==> Starting Tarepet API Backend & WebSocket Service on port ${port}...`);

// Determine python, daphne, and gunicorn executables (prefer venv if created)
const venvPython = path.join(__dirname, 'venv', 'bin', 'python3');
const venvDaphne = path.join(__dirname, 'venv', 'bin', 'daphne');
const venvGunicorn = path.join(__dirname, 'venv', 'bin', 'gunicorn');

const pythonBin = fs.existsSync(venvPython) ? venvPython : 'python3';
const daphneBin = fs.existsSync(venvDaphne) ? venvDaphne : 'daphne';
const gunicornBin = fs.existsSync(venvGunicorn) ? venvGunicorn : 'gunicorn';

// Start Daphne ASGI server (handles both HTTP and WebSockets)
const server = spawn(daphneBin, ['-b', '0.0.0.0', '-p', String(port), 'config.asgi:application'], { stdio: 'inherit', env: process.env });

server.on('error', (err) => {
  console.warn(`daphne execution note: ${err.message}. Trying gunicorn / python runserver fallback...`);
  const gunicorn = spawn(gunicornBin, ['config.wsgi:application', '--bind', `0.0.0.0:${port}`, '--workers', '2', '--timeout', '120'], { stdio: 'inherit', env: process.env });
  gunicorn.on('error', () => {
    const devServer = spawn(pythonBin, ['manage.py', 'runserver', `0.0.0.0:${port}`], { stdio: 'inherit', env: process.env });
    devServer.on('error', (e) => {
      console.error(`Failed to start python server: ${e.message}`);
    });
  });
});

server.on('exit', (exitCode) => {
  console.log(`Backend server process finished with code ${exitCode}`);
});


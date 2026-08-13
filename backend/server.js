// Render Node runtime wrapper launcher for Tarepet Django API
const { spawn } = require('child_process');

const port = process.env.PORT || 8000;
console.log(`==> Starting Tarepet API Backend Service on port ${port}...`);

// Attempt to run build step if needed
const buildProc = spawn('bash', ['./build.sh'], { stdio: 'inherit', env: process.env });

buildProc.on('close', (code) => {
  console.log(`==> Build step finished with code ${code}. Starting Gunicorn/Python server...`);

  // Start Gunicorn Python WSGI server
  const gunicorn = spawn('python3', ['-m', 'gunicorn', 'config.wsgi:application', '--bind', `0.0.0.0:${port}`, '--workers', '2', '--timeout', '120'], { stdio: 'inherit', env: process.env });

  gunicorn.on('error', (err) => {
    console.warn(`gunicorn execution warning: ${err.message}. Trying python3 manage.py runserver...`);
    const devServer = spawn('python3', ['manage.py', 'runserver', `0.0.0.0:${port}`], { stdio: 'inherit', env: process.env });
    devServer.on('error', (e) => {
      console.error(`Failed to start python server: ${e.message}`);
    });
  });

  gunicorn.on('exit', (exitCode) => {
    console.log(`Backend server exited with code ${exitCode}`);
  });
});

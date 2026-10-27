// Inicia el servidor y abre la vista docente en el equipo anfitrión.
// Los clientes estudiantes deben usar /alumno desde la LAN.
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { PORT = '3000', HOST = '0.0.0.0' } = process.env;
const serverProcess = spawn(process.execPath, ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT, HOST }
});

serverProcess.on('error', error => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exitCode = 1;
});

// Espera un instante para que el servidor pueda empezar a escuchar.
// No se añade una dependencia de terceros para abrir el navegador.
const protocol = process.env.HTTPS_ENABLED === 'false' ? 'http' : 'https';
const url = `${protocol}://localhost:${PORT}/docente`;
const platform = process.platform;
let command, args;
if (platform === 'win32') {
  command = 'cmd'; args = ['/c', 'start', '""', url];
} else if (platform === 'darwin') {
  command = 'open'; args = [url];
} else {
  command = 'xdg-open'; args = [url];
}
const timer = setTimeout(() => {
  const opener = spawn(command, args, { stdio: 'ignore', detached: true });
  opener.on('error', () => console.warn(`Abre manualmente la vista docente: ${url}`));
  opener.unref();
}, 1200);
timer.unref();

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearTimeout(timer);
    serverProcess.kill(signal);
  });
}
serverProcess.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 0;
});

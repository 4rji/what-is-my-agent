// server.js
const express = require('express');
const axios = require('axios');
const useragent = require('useragent');

const app = express();
const PORT = 3000;

// Función para limpiar y forzar una IP válida (IPv4 preferida)
function sanitizeIp(ip) {
  if (!ip) return '8.8.8.8'; // fallback
  if (ip.includes(',')) ip = ip.split(',')[0]; // en caso de cabecera con múltiples IPs
  if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', ''); // IPv6 que encapsula IPv4
  if (ip === '::1' || ip === '127.0.0.1') return '8.8.8.8'; // localhost -> IP pública simulada
  return ip;
}

app.get('/', async (req, res) => {
  const rawIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const realIp = sanitizeIp(rawIp); // IP válida y usable
  const ua = useragent.parse(req.headers['user-agent']); // Parseo del user-agent

  let location = { city: 'N/A', region: 'N/A', country_name: 'N/A' };

  // Llamada a ipapi.co para geolocalizar
  try {
    const geo = await axios.get(`https://ipapi.co/${realIp}/json/`);
    location = geo.data;
  } catch (err) {
    // Si falla la API, mantiene valores por defecto
  }

  // Envío del HTML con los datos
  res.send(`
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Client Info</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          li { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>Información del Cliente</h1>
        <ul>
          <li><strong>IP:</strong> ${realIp}</li>
          <li><strong>User-Agent:</strong> ${req.headers['user-agent']}</li>
          <li><strong>OS:</strong> ${ua.os.toString()}</li>
          <li><strong>Ubicación:</strong> ${location.city}, ${location.region}, ${location.country_name}</li>
          <li><strong>WebSockets soportados:</strong> <span id="ws">...</span></li>
        </ul>
        <script>
          document.getElementById("ws").innerText = window.WebSocket ? "Sí" : "No";
        </script>
      </body>
    </html>
  `);
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
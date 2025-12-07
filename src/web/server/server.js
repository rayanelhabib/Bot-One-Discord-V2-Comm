const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'One Tap Bot Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalUsers: 1250,
    totalGuilds: 89,
    activeChannels: 156,
    uptime: process.uptime()
  });
});

app.get('/api/commands', (req, res) => {
  res.json([
    { name: 'setup', description: 'Configurer le bot', usage: '!setup' },
    { name: 'claim', description: 'Réclamer un salon', usage: '!claim' },
    { name: 'limit', description: 'Limiter les utilisateurs', usage: '!limit <nombre>' },
    { name: 'lock', description: 'Verrouiller le salon', usage: '!lock' },
    { name: 'unlock', description: 'Déverrouiller le salon', usage: '!unlock' },
    { name: 'hide', description: 'Cacher le salon', usage: '!hide' },
    { name: 'show', description: 'Afficher le salon', usage: '!show' }
  ]);
});

// Route principale - sert l'application React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur One Tap Bot démarré sur le port ${PORT}`);
  console.log(`🌐 API disponible sur http://localhost:${PORT}/api`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});

module.exports = app;

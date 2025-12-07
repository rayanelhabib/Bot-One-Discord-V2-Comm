const express = require('express');
const router = express.Router();

// Données simulées pour l'API (à remplacer par de vraies données du bot)
const botData = {
  stats: {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    servers: 8,
    users: 1250,
    voiceChannels: 45,
    commands: 40,
    premiumUsers: 12,
    totalChannels: 156
  },
  performance: {
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    latency: Math.floor(Math.random() * 50) + 10,
    requests: Math.floor(Math.random() * 1000) + 500
  }
};

// Route pour les statistiques du bot
router.get('/stats', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        ...botData.stats,
        uptime: Math.floor(botData.stats.uptime),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

// Route pour les performances
router.get('/performance', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        ...botData.performance,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des performances'
    });
  }
});

// Route pour les serveurs
router.get('/servers', (req, res) => {
  try {
    const servers = [
      {
        id: '123456789',
        name: 'Gaming Community',
        members: 250,
        voiceChannels: 8,
        isOnline: true
      },
      {
        id: '987654321',
        name: 'Study Group',
        members: 45,
        voiceChannels: 3,
        isOnline: true
      },
      {
        id: '456789123',
        name: 'Music Lovers',
        members: 120,
        voiceChannels: 5,
        isOnline: false
      }
    ];

    res.json({
      success: true,
      data: servers,
      total: servers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des serveurs'
    });
  }
});

// Route pour les logs récents
router.get('/logs', (req, res) => {
  try {
    const logs = [
      {
        id: 1,
        type: 'info',
        message: 'Nouveau salon vocal créé: Gaming Squad',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        server: 'Gaming Community'
      },
      {
        id: 2,
        type: 'success',
        message: 'Utilisateur @John a rejoint le salon',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        server: 'Study Group'
      },
      {
        id: 3,
        type: 'warning',
        message: 'Salon vocal supprimé: Old Channel',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        server: 'Music Lovers'
      }
    ];

    res.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des logs'
    });
  }
});

// Route de santé
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

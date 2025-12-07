const express = require('express');
const router = express.Router();

// Données simulées du bot (à remplacer par de vraies données)
const botStats = {
  name: 'Soran',
  version: '2.0.0',
  uptime: '99.9%',
  servers: 8,
  users: 1250,
  voiceChannels: 45,
  commands: 40,
  categories: 6,
  premiumUsers: 12,
  totalChannels: 156
};

const features = [
  {
    icon: '🎵',
    title: 'Salons Vocaux Dynamiques',
    description: 'Créez des salons vocaux temporaires avec contrôle total et options de personnalisation',
    color: 'primary'
  },
  {
    icon: '🔒',
    title: 'Gestion Vocale',
    description: 'Verrouillez, masquez, limitez les utilisateurs et gérez les permissions de vos salons',
    color: 'secondary'
  },
  {
    icon: '👥',
    title: 'Gestion Utilisateurs',
    description: 'Liste noire/blanche, assignez des managers et contrôlez la propriété des salons',
    color: 'accent'
  },
  {
    icon: '⚡',
    title: 'Contrôles Admin',
    description: 'Capacités de mute/unmute forcé et outils de gestion avancés du serveur',
    color: 'warning'
  },
  {
    icon: '⚙️',
    title: 'Configuration Facile',
    description: 'Système de configuration simple avec gestion des rôles et interface intuitive',
    color: 'info'
  },
  {
    icon: '📊',
    title: 'Statistiques Temps Réel',
    description: 'Suivez l\'utilisation des salons vocaux et l\'activité du serveur avec des analyses détaillées',
    color: 'success'
  }
];

// Page d'accueil
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Accueil - Soran Dashboard',
    currentPage: 'home',
    botStats,
    features,
    meta: {
      description: 'Dashboard moderne pour le bot Discord Soran - Gestion avancée des salons vocaux temporaires',
      keywords: 'discord, bot, soran, voice, channels, dashboard, management'
    }
  });
});

// Page à propos
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'À propos - Soran Dashboard',
    currentPage: 'about',
    botStats,
    meta: {
      description: 'Découvrez Soran, le bot Discord le plus avancé pour la gestion des salons vocaux temporaires',
      keywords: 'discord, bot, soran, about, features, voice channels'
    }
  });
});

module.exports = router;

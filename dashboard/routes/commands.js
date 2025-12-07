const express = require('express');
const router = express.Router();

// Commandes du bot organisées par catégorie
const commands = {
  voice: [
    {
      name: 'setup',
      description: 'Configure le système de salons vocaux temporaires',
      usage: '+setup [salon-création]',
      example: '+setup #créer-salon',
      permissions: 'Administrateur',
      category: 'Configuration'
    },
    {
      name: 'lock',
      description: 'Verrouille le salon vocal actuel',
      usage: '+lock',
      example: '+lock',
      permissions: 'Propriétaire du salon',
      category: 'Gestion'
    },
    {
      name: 'unlock',
      description: 'Déverrouille le salon vocal actuel',
      usage: '+unlock',
      example: '+unlock',
      permissions: 'Propriétaire du salon',
      category: 'Gestion'
    },
    {
      name: 'hide',
      description: 'Masque le salon vocal actuel',
      usage: '+hide',
      example: '+hide',
      permissions: 'Propriétaire du salon',
      category: 'Gestion'
    },
    {
      name: 'unhide',
      description: 'Affiche le salon vocal actuel',
      usage: '+unhide',
      example: '+unhide',
      permissions: 'Propriétaire du salon',
      category: 'Gestion'
    },
    {
      name: 'limit',
      description: 'Limite le nombre d\'utilisateurs dans le salon',
      usage: '+limit [nombre]',
      example: '+limit 5',
      permissions: 'Propriétaire du salon',
      category: 'Gestion'
    },
    {
      name: 'name',
      description: 'Renomme le salon vocal actuel',
      usage: '+name [nouveau-nom]',
      example: '+name Gaming Squad',
      permissions: 'Propriétaire du salon',
      category: 'Personnalisation'
    },
    {
      name: 'transfer',
      description: 'Transfère la propriété du salon à un autre utilisateur',
      usage: '+transfer [@utilisateur]',
      example: '+transfer @John',
      permissions: 'Propriétaire du salon',
      category: 'Gestion'
    }
  ],
  management: [
    {
      name: 'blacklist',
      description: 'Ajoute un utilisateur à la liste noire',
      usage: '+blacklist [@utilisateur]',
      example: '+blacklist @Spammer',
      permissions: 'Administrateur',
      category: 'Modération'
    },
    {
      name: 'whitelist',
      description: 'Retire un utilisateur de la liste noire',
      usage: '+whitelist [@utilisateur]',
      example: '+whitelist @User',
      permissions: 'Administrateur',
      category: 'Modération'
    },
    {
      name: 'manager',
      description: 'Assigne un manager au salon vocal',
      usage: '+manager [@utilisateur]',
      example: '+manager @Moderator',
      permissions: 'Propriétaire du salon',
      category: 'Gestion'
    },
    {
      name: 'kick',
      description: 'Expulse un utilisateur du salon vocal',
      usage: '+kick [@utilisateur]',
      example: '+kick @Troublemaker',
      permissions: 'Propriétaire/Manager',
      category: 'Modération'
    },
    {
      name: 'permit',
      description: 'Autorise un utilisateur à rejoindre le salon',
      usage: '+permit [@utilisateur]',
      example: '+permit @Friend',
      permissions: 'Propriétaire/Manager',
      category: 'Gestion'
    },
    {
      name: 'reject',
      description: 'Rejette la demande d\'un utilisateur',
      usage: '+reject [@utilisateur]',
      example: '+reject @User',
      permissions: 'Propriétaire/Manager',
      category: 'Gestion'
    }
  ],
  utility: [
    {
      name: 'ping',
      description: 'Affiche la latence du bot',
      usage: '+ping',
      example: '+ping',
      permissions: 'Tous',
      category: 'Utilitaires'
    },
    {
      name: 'status',
      description: 'Affiche le statut du bot et les statistiques',
      usage: '+status',
      example: '+status',
      permissions: 'Tous',
      category: 'Utilitaires'
    },
    {
      name: 'help',
      description: 'Affiche la liste des commandes disponibles',
      usage: '+help [commande]',
      example: '+help setup',
      permissions: 'Tous',
      category: 'Utilitaires'
    },
    {
      name: 'leaderboard',
      description: 'Affiche le classement des utilisateurs',
      usage: '+leaderboard',
      example: '+leaderboard',
      permissions: 'Tous',
      category: 'Utilitaires'
    },
    {
      name: 'vcinfo',
      description: 'Affiche les informations du salon vocal actuel',
      usage: '+vcinfo',
      example: '+vcinfo',
      permissions: 'Tous',
      category: 'Utilitaires'
    }
  ],
  premium: [
    {
      name: 'premium',
      description: 'Affiche les informations sur les fonctionnalités premium',
      usage: '+premium',
      example: '+premium',
      permissions: 'Tous',
      category: 'Premium'
    },
    {
      name: 'task',
      description: 'Gère les tâches automatisées (Premium)',
      usage: '+task [action]',
      example: '+task create',
      permissions: 'Premium',
      category: 'Premium'
    },
    {
      name: 'activity',
      description: 'Change l\'activité du bot (Premium)',
      usage: '+activity [type] [message]',
      example: '+activity playing Gaming',
      permissions: 'Premium',
      category: 'Premium'
    }
  ]
};

// Page des commandes
router.get('/', (req, res) => {
  const category = req.query.category || 'all';
  let filteredCommands = commands;

  if (category !== 'all' && commands[category]) {
    filteredCommands = { [category]: commands[category] };
  }

  res.render('commands', {
    title: 'Commandes - Soran Dashboard',
    currentPage: 'commands',
    commands: filteredCommands,
    allCommands: commands,
    currentCategory: category,
    meta: {
      description: 'Découvrez toutes les commandes du bot Soran pour la gestion des salons vocaux',
      keywords: 'discord, bot, soran, commands, voice, channels, management'
    }
  });
});

// API pour obtenir les commandes
router.get('/api', (req, res) => {
  res.json({
    success: true,
    commands: commands,
    total: Object.values(commands).flat().length
  });
});

module.exports = router;

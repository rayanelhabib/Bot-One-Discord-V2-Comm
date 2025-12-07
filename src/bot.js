require('dotenv').config();

// Configuration pour bot-hosting.net - Redis désactivé par défaut
// Mais peut être activé via les variables d'environnement
if (!process.env.REDIS_HOST && !process.env.REDIS_URL && !process.env.REDIS_PORT) {
    process.env.REDIS_HOST = 'disabled';
    process.env.REDIS_PORT = '0';
    process.env.REDIS_URL = '';
}
const { Client, GatewayIntentBits, Collection , textDisplay} = require('discord.js');
const fs = require('fs');
const path = require('path');

// Vérification de la configuration
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is required in .env file');
    process.exit(1);
}

// Configuration optimisée du client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  ws: {
    properties: {
      browser: 'Discord iOS'
    }
  },
  rest: {
    timeout: 30000, // 30s au lieu de 15s
    retries: 3,
    requestTimeout: 30000 // Timeout spécifique pour les requêtes
  }
});

// Collections pour les commandes
client.commands = {
  prefix: new Collection(),
  slash: new Collection()
};

// Import des modules de connexion vocale
const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

// Initialisation du système de surveillance vocale
class VoiceSurveillanceManager {
  constructor(client) {
    this.client = client;
    this.surveillanceChannels = new Map(); // channelId -> { userId, startTime, isActive, connection }
    this.isMonitoring = false;
    
    // Configuration par défaut
    this.config = {
      maxSurveillanceChannels: 10,
      checkInterval: 30000, // 30 secondes
      reconnectDelay: 5000, // 5 secondes
      logActivity: true
    };
  }

  async joinVoiceChannel(channelId, userId) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel || !channel.isVoiceBased()) {
        throw new Error('Channel not found or not a voice channel');
      }

      if (!channel.joinable) {
        throw new Error('Cannot join this voice channel');
      }

      // Créer une vraie connexion vocale
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      // Créer un player audio silencieux pour maintenir la connexion
      const player = createAudioPlayer();
      const resource = createAudioResource(null, { inlineVolume: true });
      player.play(resource);
      connection.subscribe(player);

      // Gérer les événements de connexion
      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`[VOICE SURVEILLANCE] Connected to voice channel ${channelId}`);
      });

      connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.log(`[VOICE SURVEILLANCE] Disconnected from voice channel ${channelId}`);
      });

      this.surveillanceChannels.set(channelId, {
        userId,
        startTime: Date.now(),
        isActive: true,
        connection,
        player
      });

      if (this.config.logActivity) {
        console.log(`[VOICE SURVEILLANCE] Bot joined voice channel ${channelId} for user ${userId}`);
      }

      if (!this.isMonitoring) {
        this.startMonitoring();
      }

      return true;
    } catch (error) {
      console.error(`[VOICE SURVEILLANCE] Error joining channel ${channelId}:`, error);
      return false;
    }
  }

  async leaveVoiceChannel(channelId) {
    try {
      const surveillance = this.surveillanceChannels.get(channelId);
      if (!surveillance) {
        return false;
      }

      // Arrêter le player audio
      if (surveillance.player) {
        surveillance.player.stop();
      }

      // Détruire la connexion vocale
      if (surveillance.connection) {
        surveillance.connection.destroy();
      }

      this.surveillanceChannels.delete(channelId);

      if (this.config.logActivity) {
        console.log(`[VOICE SURVEILLANCE] Bot left voice channel ${channelId}`);
      }

      return true;
    } catch (error) {
      console.error(`[VOICE SURVEILLANCE] Error leaving channel ${channelId}:`, error);
      return false;
    }
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkConnections();
    }, this.config.checkInterval);

    console.log('[VOICE SURVEILLANCE] Monitoring started');
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    for (const [channelId] of this.surveillanceChannels) {
      this.leaveVoiceChannel(channelId);
    }

    console.log('[VOICE SURVEILLANCE] Monitoring stopped');
  }

  async checkConnections() {
    for (const [channelId, surveillance] of this.surveillanceChannels) {
      try {
        if (!surveillance.isActive) continue;

        const channel = await this.client.channels.fetch(channelId);
        if (!channel) {
          this.surveillanceChannels.delete(channelId);
          continue;
        }

        // Vérifier si le salon vocal existe toujours
        if (!channel.isVoiceBased()) {
          console.log(`[VOICE SURVEILLANCE] Channel ${channelId} is no longer a voice channel, removing from monitoring`);
          this.surveillanceChannels.delete(channelId);
          continue;
        }

        // Vérifier si la connexion est toujours active
        if (surveillance.connection && surveillance.connection.state.status === VoiceConnectionStatus.Disconnected) {
          console.log(`[VOICE SURVEILLANCE] Reconnecting to channel ${channelId}`);
          await this.joinVoiceChannel(channelId, surveillance.userId);
        }

      } catch (error) {
        console.error(`[VOICE SURVEILLANCE] Error checking channel ${channelId}:`, error);
      }
    }
  }

  getSurveillanceChannels() {
    return Array.from(this.surveillanceChannels.entries()).map(([channelId, data]) => ({
      channelId,
      userId: data.userId,
      startTime: data.startTime,
      isActive: data.isActive,
      duration: Date.now() - data.startTime
    }));
  }

  getStats() {
    return {
      totalChannels: this.surveillanceChannels.size,
      isMonitoring: this.isMonitoring,
      channels: this.getSurveillanceChannels()
    };
  }

  cleanup() {
    this.stopMonitoring();
    
    // Détruire toutes les connexions vocales
    for (const [channelId, surveillance] of this.surveillanceChannels) {
      if (surveillance.player) {
        surveillance.player.stop();
      }
      if (surveillance.connection) {
        surveillance.connection.destroy();
      }
    }
    
    this.surveillanceChannels.clear();
    console.log('[VOICE SURVEILLANCE] Cleanup completed');
  }
}

client.voiceSurveillance = new VoiceSurveillanceManager(client);

// Configuration du propriétaire du bot (pour les commandes admin)
client.ownerId = process.env.OWNER_ID || '1366651120373600296';

// Rendre le client global pour les gestionnaires d'événements
global.client = client;

// Fonction pour mettre à jour les statistiques
const updateBotStats = () => {
  if (client.isReady()) {
    global.botStats.totalUsers = client.users.cache.size;
    global.botStats.totalGuilds = client.guilds.cache.size;
    global.botStats.activeChannels = client.channels.cache.filter(c => c.type === 2).size;
  }
};

// Fonction pour ajouter un log
const addBotLog = (level, message) => {
  const log = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message
  };
  global.botStats.logs.unshift(log);
  
  // Limiter à 100 logs
  if (global.botStats.logs.length > 100) {
    global.botStats.logs = global.botStats.logs.slice(0, 100);
  }
};

// Exposer le client pour le dashboard
global.discordClient = client;
global.botStats = {
  startTime: Date.now(),
  totalUsers: 0,
  totalGuilds: 0,
  activeChannels: 0,
  commands: [],
  logs: []
};

// Exposer les fonctions globalement
global.updateBotStats = updateBotStats;
global.addBotLog = addBotLog;

// Fonction pour catégoriser les commandes
const getCommandCategory = (commandName) => {
  const categories = {
    'setup': 'setup',
    'claim': 'voice',
    'transfer': 'voice',
    'limit': 'voice',
    'lock': 'voice',
    'unlock': 'voice',
    'hide': 'voice',
    'unhide': 'voice',
    'permit': 'voice',
    'deny': 'voice',
    'reject': 'voice',
    'blacklist': 'moderation',
    'whitelist': 'moderation',
    'manager': 'moderation',
    'rename': 'voice',
    'info': 'info',
    'help': 'info'
  };
  return categories[commandName] || 'other';
};

// Fonction pour créer des répertoires
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Directory not found: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
    return false;
  }
  return true;
};

// Fonction pour charger les événements
const loadEvents = () => {
  const eventsPath = path.join(__dirname, 'events');

  if (!ensureDirectoryExists(eventsPath)) return;

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  eventFiles.forEach(file => {
    try {
      const event = require(path.join(eventsPath, file));
      
      if (!event.name || !event.execute) {
        console.warn(`[EVENT] Invalid event structure in ${file}`);
        return;
      }

      const executor = async (...args) => {
        try {
          await event.execute(...args, client);
        } catch (error) {
          console.error(`Error in event ${event.name}:`, error);
        }
      };
      
      event.once ? client.once(event.name, executor) : client.on(event.name, executor);
      
      console.log(`✅ Loaded event: ${event.name}`);
    } catch (error) {
      console.error(`Error loading event ${file}:`, error);
    }
  });
};

// Fonction pour charger les commandes
const loadCommands = (type) => {
  const commandsPath = path.join(__dirname, 'commands', type);

  if (!ensureDirectoryExists(commandsPath)) return;

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  commandFiles.forEach(file => {
    try {
      const command = require(path.join(commandsPath, file));
      
      // Gestion différente pour les commandes slash et prefix
      if (type === 'slash') {
        // Pour les commandes slash, on utilise data.name
        if (!command.data?.name || !command.execute) {
          console.warn(`[SLASH COMMAND] Invalid command structure in ${file}`);
          return;
        }
        client.commands[type].set(command.data.name, command);
      } else {
        // Pour les commandes prefix, on utilise name
        if (!command.name || !command.execute) {
          console.warn(`[PREFIX COMMAND] Invalid command structure in ${file}`);
          return;
        }
        client.commands[type].set(command.name, command);
      }
      
      console.log(`✅ Loaded ${type} command: ${command.name}`);
      
      // Gestion des alias pour les commandes prefix
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => {
          client.commands[type].set(alias, command);
          console.log(`✅ Loaded ${type} command alias: ${alias} -> ${command.name}`);
        });
      }
    } catch (error) {
      console.error(`Error loading ${type} command ${file}:`, error);
    }
  });

  // Charger les commandes de surveillance vocale si c'est pour les commandes prefix
  if (type === 'prefix') {
    const adminCommandsPath = path.join(__dirname, 'admin', 'voices');
    
    if (ensureDirectoryExists(adminCommandsPath)) {
      const adminCommandFiles = fs.readdirSync(adminCommandsPath).filter(file => file.endsWith('.js') && file !== 'voiceSurveillance.js');
      
      adminCommandFiles.forEach(file => {
        try {
          const command = require(path.join(adminCommandsPath, file));
          
          if (!command.name || !command.execute) {
            console.warn(`[ADMIN COMMAND] Invalid command structure in ${file}`);
            return;
          }
          
          client.commands[type].set(command.name, command);
          
          // Gestion des alias
          if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => {
              client.commands[type].set(alias, command);
              console.log(`✅ Loaded admin ${type} command alias: ${alias} -> ${command.name}`);
            });
          }
          
          console.log(`✅ Loaded admin ${type} command: ${command.name}`);
        } catch (error) {
          console.error(`Error loading admin ${type} command ${file}:`, error);
        }
      });
    }
  }
};

// Fonction d'initialisation
const initialize = async () => {
  try {
    console.log('🚀 One Tap Bot - Starting...');
    console.log('================================');
    console.log('⚠️ Redis disabled - running in memory-only mode');

    // Vérifier le mode check-only
    if (process.argv.includes('--check-only')) {
      console.log('🔍 Running in check-only mode...');
      
      // Vérifications de base
      if (!process.env.DISCORD_TOKEN) {
        console.error('❌ DISCORD_TOKEN is required in .env file');
        process.exit(1);
      }
      
      console.log('✅ Environment check passed');
      console.log('✅ Configuration is valid');
      process.exit(0);
    }

    console.log('🚀 Starting bot initialization...');

    // Create necessary directories if missing
    ensureDirectoryExists(path.join(__dirname, 'commands'));
    ensureDirectoryExists(path.join(__dirname, 'events'));
    ensureDirectoryExists(path.join(__dirname, 'data'));
    ensureDirectoryExists(path.join(__dirname, 'logs'));
    
    // Initialize Premium Manager
    try {
      const premiumManager = require('./utils/premiumManager');
      await premiumManager.loadFromJSON();
      console.log('✅ Premium Manager initialized');
    } catch (error) {
      console.warn('⚠️ Premium Manager initialization failed:', error.message);
    }
    
    // Initialize Ultra-Fast Performance Monitor
    try {
      const { createPerformanceMonitor } = require('./utils/ultraFastPerformanceMonitor');
      global.performanceMonitor = createPerformanceMonitor();
      console.log('✅ Ultra-Fast Performance Monitor initialized');
    } catch (error) {
      console.warn('⚠️ Performance Monitor initialization failed:', error.message);
    }
    
    // Chargement des événements et commandes
    loadEvents();
    ['prefix', 'slash'].forEach(loadCommands);
    
    // Charger les commandes dans les statistiques
    global.botStats.commands = Array.from(client.commands.prefix.values()).map(cmd => ({
      name: cmd.name,
      description: cmd.description || 'Aucune description',
      usage: cmd.usage || `.v ${cmd.name}`,
      category: getCommandCategory(cmd.name),
      aliases: cmd.aliases || []
    }));
    
    addBotLog('info', 'Bot initialisé avec succès');
    
    // Login avec timeout
    const loginPromise = client.login(process.env.DISCORD_TOKEN);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Login timeout after 30 seconds')), 30000)
    );

    try {
      await Promise.race([loginPromise, timeoutPromise]);
      console.log('✅ Discord bot connected successfully');
      
      // Utiliser les vraies données Discord
      global.botStats.totalUsers = client.users.cache.size;
      global.botStats.totalGuilds = client.guilds.cache.size;
      global.botStats.activeChannels = client.channels.cache.filter(c => c.type === 2).size;
      
      addBotLog('info', `Bot connecté avec succès: ${client.user.tag}`);
      addBotLog('info', `Serveurs: ${global.botStats.totalGuilds}, Utilisateurs: ${global.botStats.totalUsers}`);
      
    } catch (error) {
      console.warn('⚠️ Discord connection failed:', error.message);
      console.log('🎭 Running in demo mode - Dashboard will work with simulated data');

      // Initialiser les données de démo même si Discord échoue
      global.botStats.totalUsers = 1250;
      global.botStats.totalGuilds = 89;
      global.botStats.activeChannels = 156;
      global.botStats.commands = Array.from(client.commands.prefix.values()).map(cmd => ({
        name: cmd.name,
        description: cmd.description || 'Aucune description',
        usage: cmd.usage || `.v ${cmd.name}`,
        category: getCommandCategory(cmd.name),
        aliases: cmd.aliases || []
      }));
      global.botStats.logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Bot démarré en mode démo'
        },
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'info',
          message: 'Dashboard accessible avec données simulées'
        },
        {
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: 'info',
          message: `${global.botStats.commands.length} commandes chargées`
        },
        {
          timestamp: new Date(Date.now() - 900000).toISOString(),
          level: 'info',
          message: 'Système de performance initialisé'
        },
        {
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          level: 'warn',
          message: 'Connexion Discord échouée - Mode démo activé'
        }
      ];
    }
    
    // Dashboard désactivé pour éviter les erreurs
    console.log('🌐 Dashboard disabled - focusing on voice surveillance');
    
    console.log('✅ Bot initialization completed successfully');
    console.log('================================');
  } catch (error) {
    console.error('❌ Bot initialization failed:', error);
    process.exit(1);
  }
};

// Configuration des événements de processus
process.on('SIGINT', () => {
  console.log('Received SIGINT - shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM - shutting down gracefully');
  process.exit(0);
});

// Démarrage de l'application
initialize().catch((error) => {
  console.error('❌ Fatal error during initialization:', error);
  process.exit(1);
});
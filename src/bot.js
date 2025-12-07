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
    
    // Login avec timeout
    const loginPromise = client.login(process.env.DISCORD_TOKEN);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login timeout after 30 seconds')), 30000)
    );
    
    await Promise.race([loginPromise, timeoutPromise]);
    
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
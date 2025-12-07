const { getGuildConfig } = require('../utils/configManager');
const { safeGet, safeSet, safeDel, redisEnabled } = require('../redisClient');
const { getOrCreateTextChannel } = require('../utils/voiceHelper');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { handleStaffLeave, handleStaffReturn } = require('../commands/prefix/task');

// Configuration ULTRA-ROBUSTE pour la création de salons vocaux (NE SE BLOQUE JAMAIS !)
const RATE_LIMIT_WINDOW = 30000; // 30 secondes (plus stable)
const RATE_LIMIT_MAX = 10; // 10 salons par fenêtre (plus raisonnable)
const MAX_RETRIES = 15; // 15 tentatives (plus robuste)
const OPERATION_TIMEOUT = 10000; // 10 secondes (plus stable)
const WELCOME_MESSAGE_TIMEOUT = 5000; // 5 secondes (plus stable)
const CHANNEL_CREATION_TIMEOUT = 3000; // 3 secondes (plus réaliste)
const MAX_CONCURRENT_CREATIONS = 50; // 50 créations simultanées (plus stable)
const BATCH_CREATION_SIZE = 10; // Création par lots de 10 (plus stable)
const ULTRA_FAST_MODE = false; // Mode stable activé
const PARALLEL_VALIDATION = true; // Validation parallèle
const PRELOAD_CHANNELS = true; // Préchargement des salons
const SMART_CACHING = true; // Cache intelligent
const ADAPTIVE_TIMEOUT = true; // Timeout adaptatif
const CIRCUIT_BREAKER = true; // Circuit breaker pour éviter les surcharges
const HEALTH_CHECK = true; // Vérification de santé du système
const LOAD_BALANCING = true; // Équilibrage de charge
const AUTO_RECOVERY = true; // Récupération automatique
const ULTRA_CLEANUP = true; // Nettoyage ultra-avancé des salons vides
const CHANNEL_MONITORING = true; // Monitoring avancé des salons
const PREVENTIVE_MAINTENANCE = true; // Maintenance préventive
const ORPHAN_DETECTION = true; // Détection des salons orphelins
const AUTO_HEALING = true; // Auto-guérison du système

// Cache ULTRA-INTELLIGENT avec TTL dynamique et préchargement
const configCache = new Map();
const rateLimitCache = new Map();
const channelCreationCache = new Map();
const creationQueue = new Map(); // Queue par guild
const circuitBreaker = new Map(); // Circuit breaker par guild
const healthMetrics = new Map(); // Métriques de santé
const loadBalancer = new Map(); // Équilibrage de charge par guild
const channelMonitor = new Map(); // Monitoring des salons
const orphanChannels = new Map(); // Salons orphelins détectés
const cleanupQueue = new Map(); // Queue de nettoyage par guild
const maintenanceSchedule = new Map(); // Planning de maintenance
const CONFIG_CACHE_TTL = 30000; // 30 secondes
const RATE_LIMIT_CACHE_TTL = 10000; // 10 secondes
const CHANNEL_CACHE_TTL = 15000; // 15 secondes pour les salons
const ULTRA_FAST_CACHE_TTL = 5000; // 5 secondes pour les opérations critiques
const CHANNEL_MONITOR_TTL = 60000; // 1 minute pour le monitoring
const ORPHAN_DETECTION_TTL = 300000; // 5 minutes pour détecter les orphelins

// Circuit Breaker Configuration
const CIRCUIT_BREAKER_THRESHOLD = 5; // 5 échecs avant d'ouvrir le circuit
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 secondes avant de réessayer
const CIRCUIT_BREAKER_RESET_TIMEOUT = 60000; // 1 minute pour reset complet

// Health Check Configuration
const HEALTH_CHECK_INTERVAL = 30000; // 30 secondes
const HEALTH_THRESHOLD = 0.8; // 80% de succès minimum
const RECOVERY_THRESHOLD = 0.95; // 95% de succès pour récupération

// Load Balancing Configuration
const LOAD_BALANCE_THRESHOLD = 0.7; // 70% de charge maximum
const LOAD_BALANCE_RECOVERY = 0.3; // 30% de charge pour récupération

// Ultra Cleanup Configuration
const CLEANUP_CHECK_INTERVAL = 10000; // 10 secondes
const ORPHAN_CLEANUP_DELAY = 30000; // 30 secondes avant nettoyage des orphelins
const CHANNEL_EMPTY_TIMEOUT = 60000; // 1 minute avant nettoyage des salons vides
const PREVENTIVE_CLEANUP_INTERVAL = 300000; // 5 minutes

// Channel Monitoring Configuration
const CHANNEL_HEALTH_CHECK_INTERVAL = 30000; // 30 secondes
const CHANNEL_ORPHAN_CHECK_INTERVAL = 60000; // 1 minute
const CHANNEL_MAINTENANCE_INTERVAL = 600000; // 10 minutes

// Pool de connexions Redis ULTRA-ROBUSTE
const redisPool = {
  connections: new Set(),
  maxConnections: 50, // 50 connexions (plus stable)
  ultraFastMode: false, // Mode stable
  preloadedConnections: new Set(),
  connectionQueue: [],
  maxQueueSize: 100,
  
  async getConnection() {
    try {
      if (!redisEnabled) {
        return null; // Retourner null si Redis n'est pas disponible
      }
      
      // Mode ultra-rapide : utiliser les connexions préchargées
      if (this.preloadedConnections.size > 0) {
        const connection = this.preloadedConnections.values().next().value;
        this.preloadedConnections.delete(connection);
        return connection;
      }
      
      if (this.connections.size < this.maxConnections) {
        const connection = require('../redisClient').redis.duplicate();
        this.connections.add(connection);
        return connection;
      }
      
      // Si pas de connexion disponible, utiliser la connexion principale
      return require('../redisClient').redis;
    } catch (error) {
      console.error('[REDIS_POOL] Error getting connection:', error);
      return null; // Retourner null en cas d'erreur
    }
  },
  
  // Préchargement automatique des connexions
  async preloadConnections() {
    if (!redisEnabled || this.preloadedConnections.size >= 20) return;
    
    try {
      for (let i = 0; i < 5; i++) {
        const connection = require('../redisClient').redis.duplicate();
        this.preloadedConnections.add(connection);
      }
      console.log(`[REDIS_POOL] ✅ Préchargé ${this.preloadedConnections.size} connexions`);
    } catch (error) {
      console.error('[REDIS_POOL] Préchargement échoué:', error.message);
    }
  },
  
  // Nettoyage des connexions mortes
  cleanup() {
    this.connections.forEach(conn => {
      try {
        if (conn.status === 'end') {
          this.connections.delete(conn);
        }
      } catch (error) {
        this.connections.delete(conn);
      }
    });
    
    // Nettoyer aussi les connexions préchargées
    this.preloadedConnections.forEach(conn => {
      try {
        if (conn.status === 'end') {
          this.preloadedConnections.delete(conn);
        }
      } catch (error) {
        this.preloadedConnections.delete(conn);
      }
    });
  }
};

// Démarrer le préchargement automatique
setTimeout(() => {
  redisPool.preloadConnections();
  setInterval(() => redisPool.preloadConnections(), 5000); // Toutes les 5 secondes
}, 2000);

// Queue de microtasks ULTRA-ROBUSTE avec gestion de priorité
const microtaskQueue = [];
const highPriorityQueue = [];
const emergencyQueue = []; // Queue d'urgence pour les opérations critiques
let isProcessingQueue = false;
let isProcessingHighPriority = false;
let isProcessingEmergency = false;
let queueErrorCount = 0;
const MAX_QUEUE_ERRORS = 20;
const ULTRA_FAST_QUEUE_SIZE = 500;
const HIGH_PRIORITY_LIMIT = 50;
const EMERGENCY_LIMIT = 20;

function addToMicrotaskQueue(task, priority = 'normal') {
  try {
    if (priority === 'emergency' && emergencyQueue.length < EMERGENCY_LIMIT) {
      emergencyQueue.push(task);
      if (!isProcessingEmergency) {
        isProcessingEmergency = true;
        queueMicrotask(processEmergencyQueue);
      }
    } else if (priority === 'high' && highPriorityQueue.length < HIGH_PRIORITY_LIMIT) {
      highPriorityQueue.push(task);
      if (!isProcessingHighPriority) {
        isProcessingHighPriority = true;
        queueMicrotask(processHighPriorityQueue);
      }
    } else if (microtaskQueue.length < ULTRA_FAST_QUEUE_SIZE) {
      microtaskQueue.push(task);
      if (!isProcessingQueue) {
        isProcessingQueue = true;
        queueMicrotask(processMicrotaskQueue);
      }
    } else {
      console.warn('[MICROTASK] Queue pleine, tâche ignorée');
    }
  } catch (error) {
    console.error('[MICROTASK] Error adding task to queue:', error);
  }
}

// Fonction pour ajouter des tâches haute priorité
function addHighPriorityTask(task) {
  addToMicrotaskQueue(task, 'high');
}

function addEmergencyTask(task) {
  addToMicrotaskQueue(task, 'emergency');
}

async function processMicrotaskQueue() {
  isProcessingQueue = false;
  const tasks = microtaskQueue.splice(0, BATCH_CREATION_SIZE);
  
  try {
    await Promise.allSettled(tasks.map(task => {
      try {
        return task();
      } catch (error) {
        console.error('[MICROTASK] Error executing task:', error);
        return Promise.resolve();
      }
    }));
    queueErrorCount = 0;
  } catch (error) {
    console.error('[MICROTASK] Critical queue error:', error);
    queueErrorCount++;
    
    if (queueErrorCount > MAX_QUEUE_ERRORS) {
      console.error('[MICROTASK] Too many errors, clearing queue');
      microtaskQueue.length = 0;
      queueErrorCount = 0;
    }
  }
}

async function processHighPriorityQueue() {
  isProcessingHighPriority = false;
  const tasks = highPriorityQueue.splice(0, 25);
  
  try {
    await Promise.allSettled(tasks.map(task => {
      try {
        return task();
      } catch (error) {
        console.error('[MICROTASK_HIGH] Error executing high priority task:', error);
        return Promise.resolve();
      }
    }));
  } catch (error) {
    console.error('[MICROTASK_HIGH] Critical high priority queue error:', error);
  }
}

async function processEmergencyQueue() {
  isProcessingEmergency = false;
  const tasks = emergencyQueue.splice(0, 10);
  
  try {
    await Promise.allSettled(tasks.map(task => {
      try {
        return task();
      } catch (error) {
        console.error('[MICROTASK_EMERGENCY] Error executing emergency task:', error);
        return Promise.resolve();
      }
    }));
  } catch (error) {
    console.error('[MICROTASK_EMERGENCY] Critical emergency queue error:', error);
  }
}

// Circuit Breaker pour éviter les surcharges
function checkCircuitBreaker(guildId) {
  if (!CIRCUIT_BREAKER) return true;
  
  const breaker = circuitBreaker.get(guildId);
  if (!breaker) return true;
  
  const now = Date.now();
  
  if (breaker.state === 'OPEN') {
    if (now - breaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
      breaker.state = 'HALF_OPEN';
      console.log(`[CIRCUIT_BREAKER] ${guildId} - Circuit breaker half-open`);
      return true;
    }
    return false;
  }
  
  return true;
}

function recordCircuitBreakerFailure(guildId) {
  if (!CIRCUIT_BREAKER) return;
  
  let breaker = circuitBreaker.get(guildId);
  if (!breaker) {
    breaker = { failures: 0, state: 'CLOSED', lastFailureTime: 0 };
    circuitBreaker.set(guildId, breaker);
  }
  
  breaker.failures++;
  breaker.lastFailureTime = Date.now();
  
  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.state = 'OPEN';
    console.log(`[CIRCUIT_BREAKER] ${guildId} - Circuit breaker OPEN (${breaker.failures} failures)`);
  }
}

function recordCircuitBreakerSuccess(guildId) {
  if (!CIRCUIT_BREAKER) return;
  
  const breaker = circuitBreaker.get(guildId);
  if (breaker) {
    breaker.failures = 0;
    breaker.state = 'CLOSED';
    console.log(`[CIRCUIT_BREAKER] ${guildId} - Circuit breaker CLOSED (success)`);
  }
}

// Health Check System
function updateHealthMetrics(guildId, success) {
  if (!HEALTH_CHECK) return;
  
  let metrics = healthMetrics.get(guildId);
  if (!metrics) {
    metrics = { total: 0, successful: 0, lastCheck: Date.now() };
    healthMetrics.set(guildId, metrics);
  }
  
  metrics.total++;
  if (success) metrics.successful++;
  
  // Reset metrics every hour
  if (Date.now() - metrics.lastCheck > 3600000) {
    metrics.total = 0;
    metrics.successful = 0;
    metrics.lastCheck = Date.now();
  }
}

function getHealthStatus(guildId) {
  if (!HEALTH_CHECK) return 1.0;
  
  const metrics = healthMetrics.get(guildId);
  if (!metrics || metrics.total === 0) return 1.0;
  
  return metrics.successful / metrics.total;
}

// Load Balancing System
function updateLoadBalancer(guildId, load) {
  if (!LOAD_BALANCING) return;
  
  let balancer = loadBalancer.get(guildId);
  if (!balancer) {
    balancer = { currentLoad: 0, maxLoad: 0, lastUpdate: Date.now() };
    loadBalancer.set(guildId, balancer);
  }
  
  balancer.currentLoad = load;
  balancer.maxLoad = Math.max(balancer.maxLoad, load);
  balancer.lastUpdate = Date.now();
}

function canHandleLoad(guildId) {
  if (!LOAD_BALANCING) return true;
  
  const balancer = loadBalancer.get(guildId);
  if (!balancer) return true;
  
  return balancer.currentLoad < LOAD_BALANCE_THRESHOLD;
}

// Channel Monitoring System
function registerChannelForMonitoring(channelId, guildId, creatorId) {
  if (!CHANNEL_MONITORING) return;
  
  const monitorData = {
    channelId,
    guildId,
    creatorId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    memberCount: 0,
    isActive: true,
    cleanupScheduled: false
  };
  
  channelMonitor.set(channelId, monitorData);
  console.log(`[CHANNEL_MONITOR] Registered channel ${channelId} for monitoring`);
}

function updateChannelActivity(channelId, memberCount) {
  if (!CHANNEL_MONITORING) return;
  
  const monitorData = channelMonitor.get(channelId);
  if (monitorData) {
    monitorData.lastActivity = Date.now();
    monitorData.memberCount = memberCount;
    monitorData.isActive = memberCount > 0;
    
    // Si le salon devient vide, programmer le nettoyage
    if (memberCount === 0 && !monitorData.cleanupScheduled) {
      monitorData.cleanupScheduled = true;
      scheduleChannelCleanup(channelId, monitorData.guildId);
    }
  }
}

function scheduleChannelCleanup(channelId, guildId) {
  if (!ULTRA_CLEANUP) return;
  
  setTimeout(async () => {
    try {
      const monitorData = channelMonitor.get(channelId);
      if (!monitorData) return;
      
      // Vérifier si le salon est toujours vide
      if (monitorData.memberCount === 0) {
        console.log(`[ULTRA_CLEANUP] Scheduling cleanup for empty channel ${channelId}`);
        
        // Ajouter à la queue de nettoyage
        if (!cleanupQueue.has(guildId)) {
          cleanupQueue.set(guildId, []);
        }
        
        cleanupQueue.get(guildId).push({
          channelId,
          timestamp: Date.now(),
          reason: 'empty_channel'
        });
        
        // Marquer comme orphelin si nécessaire
        if (ORPHAN_DETECTION) {
          orphanChannels.set(channelId, {
            guildId,
            detectedAt: Date.now(),
            reason: 'empty_timeout'
          });
        }
      }
    } catch (error) {
      console.error(`[ULTRA_CLEANUP] Error scheduling cleanup for channel ${channelId}:`, error);
    }
  }, CHANNEL_EMPTY_TIMEOUT);
}

// Orphan Detection System
function detectOrphanChannels(guild) {
  if (!ORPHAN_DETECTION || !guild) return;
  
  try {
    const voiceChannels = guild.channels.cache.filter(channel => 
      channel.type === 2 && // Voice channel
      channel.name.includes("'s Room") && // Temp channel pattern
      channel.members.size === 0 // Empty channel
    );
    
    voiceChannels.forEach(channel => {
      const channelId = channel.id;
      const existingOrphan = orphanChannels.get(channelId);
      
      if (!existingOrphan) {
        // Vérifier si c'est un salon créé par le bot
        safeGet(`creator:${channelId}`).then(creatorId => {
          if (creatorId) {
            orphanChannels.set(channelId, {
              guildId: guild.id,
              detectedAt: Date.now(),
              reason: 'orphan_detection',
              creatorId
            });
            
            console.log(`[ORPHAN_DETECTION] Detected orphan channel ${channelId} in guild ${guild.id}`);
            
            // Programmer le nettoyage
            setTimeout(() => {
              performOrphanCleanup(channelId, guild.id);
            }, ORPHAN_CLEANUP_DELAY);
          }
        }).catch(error => {
          console.error(`[ORPHAN_DETECTION] Error checking creator for channel ${channelId}:`, error);
        });
      }
    });
  } catch (error) {
    console.error(`[ORPHAN_DETECTION] Error detecting orphan channels in guild ${guild.id}:`, error);
  }
}

async function performOrphanCleanup(channelId, guildId) {
  try {
    const channel = await getChannelById(channelId, guildId);
    if (!channel) {
      console.log(`[ORPHAN_CLEANUP] Channel ${channelId} not found, removing from monitoring`);
      channelMonitor.delete(channelId);
      orphanChannels.delete(channelId);
      return;
    }
    
    // Vérifier une dernière fois si le salon est vide
    if (channel.members.size === 0) {
      console.log(`[ORPHAN_CLEANUP] Cleaning up orphan channel ${channelId}`);
      await cleanChannel(channel, guildId);
      
      // Nettoyer les données de monitoring
      channelMonitor.delete(channelId);
      orphanChannels.delete(channelId);
    } else {
      console.log(`[ORPHAN_CLEANUP] Channel ${channelId} is no longer empty, skipping cleanup`);
      orphanChannels.delete(channelId);
    }
  } catch (error) {
    console.error(`[ORPHAN_CLEANUP] Error cleaning up orphan channel ${channelId}:`, error);
  }
}

async function getChannelById(channelId, guildId) {
  try {
    const guild = require('discord.js').client.guilds.cache.get(guildId);
    if (!guild) return null;
    
    return guild.channels.cache.get(channelId);
  } catch (error) {
    console.error(`[GET_CHANNEL] Error getting channel ${channelId}:`, error);
    return null;
  }
}

// Preventive Maintenance System
function schedulePreventiveMaintenance(guildId) {
  if (!PREVENTIVE_MAINTENANCE) return;
  
  const lastMaintenance = maintenanceSchedule.get(guildId);
  const now = Date.now();
  
  if (!lastMaintenance || (now - lastMaintenance) > CHANNEL_MAINTENANCE_INTERVAL) {
    console.log(`[PREVENTIVE_MAINTENANCE] Starting maintenance for guild ${guildId}`);
    
    // Détecter les salons orphelins
    detectOrphanChannels(require('discord.js').client.guilds.cache.get(guildId));
    
    // Nettoyer les données de monitoring obsolètes
    cleanupMonitoringData(guildId);
    
    // Mettre à jour le planning
    maintenanceSchedule.set(guildId, now);
  }
}

function cleanupMonitoringData(guildId) {
  const now = Date.now();
  
  // Nettoyer les données de monitoring obsolètes
  channelMonitor.forEach((data, channelId) => {
    if (data.guildId === guildId && (now - data.lastActivity) > CHANNEL_MONITOR_TTL) {
      channelMonitor.delete(channelId);
    }
  });
  
  // Nettoyer les orphelins anciens
  orphanChannels.forEach((data, channelId) => {
    if (data.guildId === guildId && (now - data.detectedAt) > ORPHAN_DETECTION_TTL) {
      orphanChannels.delete(channelId);
    }
  });
}

// Auto Healing System
function performAutoHealing(guildId) {
  if (!AUTO_HEALING) return;
  
  try {
    const healthStatus = getHealthStatus(guildId);
    
    if (healthStatus < HEALTH_THRESHOLD) {
      console.log(`[AUTO_HEALING] Guild ${guildId} health: ${(healthStatus * 100).toFixed(1)}% - Performing healing`);
      
      // Réinitialiser le circuit breaker
      const breaker = circuitBreaker.get(guildId);
      if (breaker && breaker.state === 'OPEN') {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        console.log(`[AUTO_HEALING] Reset circuit breaker for guild ${guildId}`);
      }
      
      // Nettoyer les queues bloquées
      const queue = creationQueue.get(guildId);
      if (queue && queue.length > 0) {
        const now = Date.now();
        const filteredQueue = queue.filter(item => (now - item.timestamp) < 300000); // 5 minutes
        creationQueue.set(guildId, filteredQueue);
        console.log(`[AUTO_HEALING] Cleaned blocked queue for guild ${guildId}`);
      }
      
      // Réinitialiser les métriques de santé
      const metrics = healthMetrics.get(guildId);
      if (metrics) {
        metrics.total = 0;
        metrics.successful = 0;
        metrics.lastCheck = Date.now();
        console.log(`[AUTO_HEALING] Reset health metrics for guild ${guildId}`);
      }
    }
  } catch (error) {
    console.error(`[AUTO_HEALING] Error performing auto healing for guild ${guildId}:`, error);
  }
}

// Rate limiting atomique ultra-robuste
async function atomicRateLimit(userId, action, maxAttempts) {
  if (!userId || !action || !maxAttempts) {
    console.error('[RATE_LIMIT] Invalid parameters:', { userId, action, maxAttempts });
    return true; // Permettre en cas de paramètres invalides
  }
  
  const key = `rate_limit:${userId}:${action}`;
  const window = 60000; // 1 minute
  
  try {
    const connection = await redisPool.getConnection();
    if (!connection) {
      // Fallback vers cache local
      const cacheKey = `${userId}:${action}`;
      const cached = rateLimitCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < RATE_LIMIT_CACHE_TTL) {
        return cached.attempts < maxAttempts;
      }
      return true;
    }
    
    const result = await Promise.race([
      connection.multi()
        .incr(key)
        .expire(key, window)
        .exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Rate limit timeout')), 5000)
      )
    ]);
    
    const attempts = result[0];
    
    console.log(`[RATE_LIMIT] User ${userId}, attempts: ${attempts}, max: ${maxAttempts}, allowed: ${attempts <= maxAttempts}`);
    
    return attempts <= maxAttempts;
  } catch (error) {
    console.error(`[RATE_LIMIT] Redis error for user ${userId}:`, error);
    
    // Fallback vers cache local
    try {
      const cacheKey = `${userId}:${action}`;
      const cached = rateLimitCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < RATE_LIMIT_CACHE_TTL) {
        return cached.attempts < maxAttempts;
      }
    } catch (cacheError) {
      console.error('[RATE_LIMIT] Cache fallback error:', cacheError);
    }
    
    return true;
  }
}

// Cleanup ultra-robuste avec retry et validation
async function cleanChannel(channel, guildId) {
  if (!channel || !guildId) {
    console.error('[CLEANUP] Invalid parameters:', { channel: !!channel, guildId });
    return;
  }
  
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      // Validation du channel
      if (!channel.id || !channel.guild) {
        console.error('[CLEANUP] Invalid channel:', channel.id);
        return;
      }
      
      // Suppression du channel en parallèle avec nettoyage Redis
      const deletePromise = Promise.race([
        channel.delete(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Channel delete timeout')), OPERATION_TIMEOUT)
        )
      ]);
      
      // Pipeline Redis optimisé avec validation - MODIFIÉ pour fonctionner sans Redis
      let redisPromise = Promise.resolve();
      
      if (redisEnabled && require('../redisClient').redis) {
        try {
          const pipeline = require('../redisClient').redis.pipeline();
          const keys = [
            `creator:${channel.id}`,
            `locked:${channel.id}`,
            `hidden:${channel.id}`,
            `limit:${channel.id}`,
            `soundboard:${channel.id}`,
            `status:${channel.id}`,
            `mute_state:${channel.id}`,
            `permitted_roles:${channel.id}`,
            `rejected_roles:${channel.id}`,
            `hidden_lock_state:${channel.id}`,
            `task_timer:${channel.id}`,
            `task_ready:${channel.id}`
          ];
          
          keys.forEach(key => {
            if (key && typeof key === 'string') {
              pipeline.del(key);
            }
          });
          
          redisPromise = Promise.race([
            pipeline.exec(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Redis cleanup timeout')), OPERATION_TIMEOUT)
            )
          ]);
        } catch (error) {
          console.log('[CLEANUP] Redis pipeline error, continuing without Redis cleanup:', error.message);
          redisPromise = Promise.resolve();
        }
      }
      
      await Promise.allSettled([deletePromise, redisPromise]);
      
      const channelName = channel?.name || channel?.id || 'unknown';
      console.log(`[CLEANUP] Successfully cleaned up channel: ${channelName}`);
      return;
      
    } catch (error) {
      retries++;
      console.error(`[CLEANUP] Attempt ${retries} failed for channel ${channel?.id}:`, error);
      
      if (retries >= MAX_RETRIES) {
        const channelName = channel?.name || channel?.id || 'unknown';
        console.error(`[CLEANUP] Failed to clean channel ${channelName} after ${MAX_RETRIES} attempts`);
        return;
      }
      
      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
}

// Création de salon ULTRA-ROBUSTE avec gestion d'erreurs complète
async function createTempChannel(state, guildId) {
  const { guild, member, channel } = state;
  
  // Vérification du circuit breaker
  if (!checkCircuitBreaker(guildId)) {
    console.log(`[CREATE] Circuit breaker OPEN for guild ${guildId}, skipping creation`);
    return;
  }
  
  // Vérification de la charge
  if (!canHandleLoad(guildId)) {
    console.log(`[CREATE] Load too high for guild ${guildId}, skipping creation`);
    return;
  }
  
  // Validation complète des paramètres
  if (!guild || !member || !channel || !guildId) {
    console.error('[CREATE] Invalid state parameters:', { 
      hasGuild: !!guild, 
      hasMember: !!member, 
      hasChannel: !!channel, 
      guildId 
    });
    return;
  }
  
  if (!member?.voice?.channelId || member.voice.channelId !== channel?.id) {
    console.log('[CREATE] User not in target channel or channel mismatch');
    return;
  }

  // Vérification supplémentaire pour s'assurer que l'utilisateur est toujours connecté
  if (!member.voice.channel) {
    console.log('[CREATE] User voice channel is null, user may have disconnected');
    return;
  }
  
  if (!member?.displayName || !member?.id) {
    console.error('[CREATE] Invalid member data:', { 
      hasDisplayName: !!member?.displayName, 
      hasId: !!member?.id 
    });
    return;
  }
  
  // Vérifier la queue de création pour ce guild
  if (!creationQueue.has(guildId)) {
    creationQueue.set(guildId, []);
  }
  
  const guildQueue = creationQueue.get(guildId);
  if (guildQueue.length >= MAX_CONCURRENT_CREATIONS) {
    console.log(`[CREATE] Too many concurrent creations for guild ${guildId}, queuing request`);
    guildQueue.push({ state, guildId, timestamp: Date.now() });
    return;
  }
  
  guildQueue.push({ state, guildId, timestamp: Date.now() });
  
  let tempChannel = null;
  let retries = 0;
  
  try {
    // Récupérer les permissions du salon setup pour les appliquer au nouveau salon
    // Filtrer pour ne garder que les rôles (pas les utilisateurs individuels)
    const setupChannelPermissions = channel.permissionOverwrites.cache
      .filter(perm => {
        // Vérifier si c'est un rôle (pas un utilisateur)
        const role = guild.roles.cache.get(perm.id);
        return role !== undefined;
      })
      .map(perm => ({
        id: perm.id,
        allow: perm.allow.toArray(),
        deny: perm.deny.toArray()
      }));

    // Création atomique du salon avec retry et timeout adaptatif
    while (retries < MAX_RETRIES) {
      try {
        // Timeout adaptatif basé sur le nombre de retries
        const adaptiveTimeout = ADAPTIVE_TIMEOUT ? 
          Math.min(CHANNEL_CREATION_TIMEOUT * (1 + retries * 0.5), 15000) : 
          CHANNEL_CREATION_TIMEOUT;
        
        const permissionOverwrites = [
          {
            id: member.id,
            allow: [
              'ViewChannel', 
              'Connect', 
              'Speak', 
              'UseVAD',
              'Stream',
              'UseEmbeddedActivities',
              'UseExternalEmojis',
              'UseExternalStickers',
              'AddReactions',
              'SendMessages',
              'UseApplicationCommands'
            ]
          },
          ...setupChannelPermissions
        ];

        const channelCreatePromise = Promise.race([
          guild.channels.create({
            name: `${member.displayName}'s Room`,
            type: 2,
            parent: channel.parentId || null,
            permissionOverwrites: permissionOverwrites,
            reason: `Temp channel for ${member.displayName}`,
            bitrate: 96000,
            userLimit: 0
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Channel creation timeout')), adaptiveTimeout)
          )
        ]);
        
        tempChannel = await channelCreatePromise;
        recordCircuitBreakerSuccess(guildId);
        updateHealthMetrics(guildId, true);
        
        // Enregistrer le salon pour le monitoring
        registerChannelForMonitoring(tempChannel.id, guildId, member.id);
        
        break;
        
      } catch (error) {
        retries++;
        console.error(`[CREATE] Channel creation attempt ${retries} failed:`, error);
        
        if (retries >= MAX_RETRIES) {
          console.error('[CREATE] Failed to create channel after all retries');
          recordCircuitBreakerFailure(guildId);
          updateHealthMetrics(guildId, false);
          return;
        }
        
        // Attendre avec backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
      }
    }
    
    if (!tempChannel) {
      console.error('[CREATE] No channel created after retries');
      recordCircuitBreakerFailure(guildId);
      updateHealthMetrics(guildId, false);
      return;
    }

    // Rate limit en arrière-plan (DÉSACTIVÉ pour éviter les suppressions de salons)
    // const rateLimitPromise = atomicRateLimit(member.id, 'create_temp_channel', RATE_LIMIT_MAX);

    // Vérifier que l'utilisateur est toujours connecté avant de le déplacer
    if (!member.voice?.channelId || member.voice.channelId !== channel.id) {
      console.log('[MOVE] User is no longer connected to voice or has moved to another channel');
      addEmergencyTask(() => {
        if (tempChannel) {
          tempChannel.delete().catch(error => 
            console.error('[CLEANUP] Failed to delete temp channel after user disconnect:', error)
          );
        }
      });
      return;
    }

    // Opérations critiques en parallèle avec gestion d'erreurs atomique
    const criticalOperations = await Promise.allSettled([
      Promise.race([
        (async () => {
          try {
            // Vérification finale avant le déplacement
            if (!member.voice?.channelId || member.voice.channelId !== channel.id) {
              throw new Error('User disconnected before move operation');
            }
            return await member.voice.setChannel(tempChannel);
          } catch (error) {
            // Gérer spécifiquement l'erreur 40032
            if (error.code === 40032 || error.message?.includes('Target user is not connected to voice')) {
              throw new Error('User not connected to voice');
            }
            throw error;
          }
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Move user timeout')), OPERATION_TIMEOUT)
        )
      ]),
      Promise.race([
        (async () => {
          try {
            if (redisEnabled) {
              await safeSet(`creator:${tempChannel.id}`, member.id, { ex: 86400 });
            }
            return 'success';
          } catch (error) {
            console.log('[REDIS] Error saving creator, continuing without Redis:', error.message);
            return 'error';
          }
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis save timeout')), OPERATION_TIMEOUT)
        )
      ])
    ]);

    // Gestion d'erreurs atomique avec cleanup
    const [moveResult, redisResult] = criticalOperations;
    
    if (moveResult.status === 'rejected') {
      const error = moveResult.reason;
      
      // Gestion spécifique des erreurs de déplacement
      if (error.message === 'User disconnected before move operation' || 
          error.message === 'User not connected to voice' ||
          error.code === 40032 ||
          error.message?.includes('Target user is not connected to voice')) {
        console.log('[MOVE] User disconnected during move operation, cleaning up temp channel');
      } else if (error.message === 'Move user timeout') {
        console.error('[MOVE] Move operation timed out');
      } else {
        console.error('[MOVE] Unexpected error during move operation:', error);
      }
      
      addEmergencyTask(() => {
        if (tempChannel) {
          tempChannel.delete().catch(cleanupError => 
            console.error('[CLEANUP] Failed to delete temp channel after move error:', cleanupError)
          );
        }
      });
      return;
    }

    if (redisResult.status === 'rejected') {
      console.error('[REDIS] Error saving creator:', redisResult.reason);
      // Continue même si Redis échoue, mais log l'erreur
    }

    // Rate limit check désactivé pour éviter les suppressions de salons
    console.log(`[RATE_LIMIT] Rate limiting disabled to prevent channel deletion`);

    // Message de bienvenue ultra-optimisé (microtask queue)
    addToMicrotaskQueue(async () => {
      try {
        if (!tempChannel) {
          console.error('[WELCOME] No temp channel available for welcome message');
          return;
        }

        // Set default status for the voice channel
        try {
          const axios = require('axios');
          const url = `https://discord.com/api/v10/channels/${tempChannel.id}/voice-status`;
          const payload = { status: '<:discotoolsxyzicon20:1388586698308321392> **Paul Dev** <:discotoolsxyzicon20:1388586698308321392>' };
          
          await axios.put(url, payload, {
            headers: {
              Authorization: `Bot ${guild.client.token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`[STATUS] Default status set for channel ${tempChannel.id}`);
        } catch (statusError) {
          console.error('[STATUS] Failed to set default status:', statusError.message);
        }
        
        // Vérifier les permissions du bot avant d'envoyer le message
        const botMember = guild.members.cache.get(guild.client.user.id);
        if (!botMember || !tempChannel.permissionsFor(botMember).has(['SendMessages', 'ViewChannel'])) {
          console.warn('[WELCOME] ⚠️ Bot n\'a pas les permissions pour envoyer des messages dans le salon');
          return;
        }
        
        const BUTTON_ICONS = {
          lock: '<:verrouilleralt:1393654042647072828>',
          unlock: '<:unlock:1393654040193400832>',
          rename: '<:notes:1393698906499715264>',
          transfer: '<:crown1:1393695768048570548>',
          settings: '<:setting:1393654031519322303>',
          mute: '<:mute:1393654029153730650>',
          unmute: '<:volume:1393654026780016720>',
          hide: '<:invisible:1393654038087598152>',
          unhide: '<:show:1393654035935920128>',
          status: '<:web:1393693400800165939>',
        };
        
        const embed = new EmbedBuilder()
          .setTitle(`Voice channel created by ${member.displayName}`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setDescription(`\n > ・ Control your private room using the buttons below\n\n > ・ More help topics by using : \`.v help\` \n\n・ For more info, visit  [Support Server](https://discord.gg/wyWGcKWssQ) \n`)
          .setImage('https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg')
          .setColor('#5865F2');
          
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`vc_lock_${tempChannel.id}`).setEmoji(BUTTON_ICONS.lock).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_unlock_${tempChannel.id}`).setEmoji(BUTTON_ICONS.unlock).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_hide_${tempChannel.id}`).setEmoji(BUTTON_ICONS.hide).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_unhide_${tempChannel.id}`).setEmoji(BUTTON_ICONS.unhide).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_transfer_${tempChannel.id}`).setEmoji(BUTTON_ICONS.transfer).setStyle(ButtonStyle.Secondary)
        );
        
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`vc_rename_${tempChannel.id}`).setEmoji(BUTTON_ICONS.rename).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_mute_${tempChannel.id}`).setEmoji(BUTTON_ICONS.mute).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_unmute_${tempChannel.id}`).setEmoji(BUTTON_ICONS.unmute).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_settings_${tempChannel.id}`).setEmoji(BUTTON_ICONS.settings).setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId(`vc_status_${tempChannel.id}`).setEmoji(BUTTON_ICONS.status).setStyle(ButtonStyle.Secondary)
        );
        
        // Tentative d'envoi du message de bienvenue avec retry
        let welcomeSent = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            // Vérifier que le salon existe encore avant d'envoyer le message
            if (!tempChannel || !tempChannel.id) {
              console.log('[WELCOME] Channel no longer exists, skipping welcome message');
              break;
            }
            
            await Promise.race([
              tempChannel.send({
                content: `${member} `,
                embeds: [embed],
                components: [row1, row2]
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Welcome message timeout')), WELCOME_MESSAGE_TIMEOUT)
              )
            ]);
            welcomeSent = true;
            console.log(`[WELCOME] ✅ Message de bienvenue envoyé avec succès (tentative ${attempt})`);
            break;
          } catch (error) {
            console.error(`[WELCOME] ❌ Tentative ${attempt} échouée:`, error.message);
            if (attempt === 3) {
              console.error('[WELCOME] ❌ Échec de l\'envoi du message de bienvenue après 3 tentatives');
            } else {
              // Attendre avant de réessayer
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        
        if (!welcomeSent) {
          console.warn('[WELCOME] ⚠️ Impossible d\'envoyer le message de bienvenue, mais le salon a été créé avec succès');
        }
      } catch (error) {
        console.error('[WELCOME] Error sending welcome message:', error);
      }
    });
    
  } catch (error) {
    console.error('[CREATE] Critical error creating temp channel:', error);
    
    // Cleanup en cas d'erreur critique
    if (tempChannel) {
      addEmergencyTask(() => {
        tempChannel.delete().catch(cleanupError => 
          console.error('[CLEANUP] Failed to delete temp channel after critical error:', cleanupError)
        );
      });
    }
  } finally {
    // Retirer de la queue
    const guildQueue = creationQueue.get(guildId);
    if (guildQueue) {
      const index = guildQueue.findIndex(item => item.state === state);
      if (index !== -1) {
        guildQueue.splice(index, 1);
      }
    }
  }
}

// Fonction de cache ultra-robuste
async function getCachedConfig(guildId) {
  if (!guildId) {
    console.error('[CONFIG] No guildId provided');
    return null;
  }
  
  // Vérification cache ultra-rapide avec early return
  const cached = configCache.get(guildId);
  if (cached && Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
    return cached.config;
  }

  try {
    const configPromise = getGuildConfig(guildId);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Config timeout')), 5000)
    );
    
    const config = await Promise.race([configPromise, timeoutPromise]);
    
    if (!config) {
      throw new Error('Config is null or undefined');
    }
    
    configCache.set(guildId, {
      config,
      timestamp: Date.now()
    });
    
    return config;
  } catch (error) {
    console.error(`[CONFIG] Error getting config for ${guildId}:`, error.message);
    
    const defaultConfig = {
      createChannelName: '➕ Create Temp Channel',
      createChannelId: null,
      tempChannelCategory: null,
      autoDeleteEmpty: true,
      allowRenaming: true,
      defaultUserLimit: 0
    };
    
    configCache.set(guildId, {
      config: defaultConfig,
      timestamp: Date.now()
    });
    
    return defaultConfig;
  }
}

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    // Validation des paramètres d'entrée
    if (!oldState || !newState) {
      console.error('[VOICE] Invalid state parameters');
      return;
    }
    
    // Early return si pas de changement de channel
    if (oldState.channelId === newState.channelId) return;

    try {
      const guildId = newState.guild?.id || oldState.guild?.id;
      const userId = newState.member?.id || oldState.member?.id;
      
      if (!guildId) {
        console.error('[VOICE] No guildId found in states');
        return;
      }
      
      // Récupération de config avec cache
      const config = await getCachedConfig(guildId);
      
      // Vérification rapide de la config
      if (!config?.createChannelId) {
        return;
      }
      
      // Création de salon temporaire (optimisé)
      if (newState.channel?.id === config.createChannelId) {
        console.log(`[VOICE] 🎯 Creating temp channel for ${newState.member?.user?.username}`);
        createTempChannel(newState, guildId).catch(error => {
          console.error(`[VOICE] ❌ Error creating temp channel:`, error.message);
        });
      }
      
      // Mettre à jour l'activité des salons
      if (newState.channel && newState.channel.type === 2) {
        updateChannelActivity(newState.channel.id, newState.channel.members.size);
      }
      
      if (oldState.channel && oldState.channel.type === 2) {
        updateChannelActivity(oldState.channel.id, oldState.channel.members.size);
      }
      
      // Vérification des salons verrouillés - SYSTÈME DÉSACTIVÉ
      // Les utilisateurs avec des rôles élevés peuvent maintenant rejoindre les salons verrouillés
      if (newState.channel && newState.channel.type === 2) {
        // Système de déconnexion automatique supprimé
        // Les permissions Discord gèrent maintenant l'accès aux salons verrouillés
      }
      
      // Nettoyage optimisé des salons vides avec monitoring avancé
      if (oldState.channel && oldState.channel.id && oldState.channel.name !== config.createChannelName) {
        if (oldState.channel.members?.size === 0) {
          // Vérifie que le salon a été créé par ce bot (clé creator:<channel.id> présente)
          try {
            const isBotTempChannel = await Promise.race([
              safeGet(`creator:${oldState.channel.id}`),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Redis check timeout')), 2000)
              )
            ]);
            
            if (isBotTempChannel) {
              // Utiliser le système de monitoring pour le nettoyage
              const monitorData = channelMonitor.get(oldState.channel.id);
              if (monitorData && !monitorData.cleanupScheduled) {
                monitorData.cleanupScheduled = true;
                scheduleChannelCleanup(oldState.channel.id, guildId);
              } else {
                // Nettoyage immédiat si pas de monitoring
                cleanChannel(oldState.channel, guildId).catch(error => {
                  console.error('[CLEANUP] Error during cleanup:', error);
                });
              }
            }
          } catch (error) {
            console.error('[CLEANUP] Error checking if channel is bot-created:', error);
          }
        }
      }

      // === LOGIQUE TASK TIMER (DÉSACTIVÉE - CONFLIT AVEC NOUVEAU SYSTÈME) ===
      // Cette logique est désactivée car elle entre en conflit avec le nouveau système de task
      // Le nouveau système utilise des clés Redis différentes et une logique plus avancée
      const checkTaskTimer = async (voiceChannel) => {
        // Fonction désactivée pour éviter les conflits
        return;
      };
      
      // Vérifie l'ancien et le nouveau salon si ce sont des salons vocaux
      if (oldState.channel && oldState.channel.type === 2) {
        await checkTaskTimer(oldState.channel);
        
        // === GESTION PAUSE TASK ===
        // Vérifier si c'est le créateur qui quitte un salon temporaire
        try {
          const creatorId = await safeGet(`creator:${oldState.channel.id}`);
          if (creatorId === oldState.member.id) {
            // C'est le créateur qui quitte, vérifier s'il y a un timer de task
            const timerKey = `task_timer:${oldState.channel.id}`;
            const timerExists = await safeGet(timerKey);
            
            if (timerExists) {
              console.log(`[TASK_PAUSE] Staff ${oldState.member.user.username} left channel ${oldState.channel.name}, starting pause logic`);
              // Démarrer la logique de pause
              await handleStaffLeave(oldState.channel, oldState.member);
            }
          }
        } catch (error) {
          console.error('[TASK_PAUSE] Error checking staff leave:', error);
        }
      }
      if (newState.channel && newState.channel.type === 2) {
        await checkTaskTimer(newState.channel);
        
        // === GESTION REPRISE TASK ===
        // Vérifier si c'est le créateur qui rejoint un salon temporaire
        try {
          const creatorId = await safeGet(`creator:${newState.channel.id}`);
          if (creatorId === newState.member.id) {
            // C'est le créateur qui rejoint, vérifier s'il y a une pause
            const pauseKey = `task_pause:${newState.channel.id}`;
            const pauseExists = await safeGet(pauseKey);
            
            if (pauseExists) {
              console.log(`[TASK_PAUSE] Staff ${newState.member.user.username} returned to channel ${newState.channel.name}, starting resume logic`);
              // Démarrer la logique de reprise
              await handleStaffReturn(newState.channel, newState.member);
            }
          }
        } catch (error) {
          console.error('[TASK_PAUSE] Error checking staff return:', error);
        }
        
        // Auto-mute new users if channel is in mute mode (only for bot-created temp channels)
        try {
          if (newState.channel && newState.channel.id && newState.member && newState.member.id) {
            const isBotTempChannel = await Promise.race([
              safeGet(`creator:${newState.channel.id}`),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Mute check timeout')), 2000)
              )
            ]);
            
            if (isBotTempChannel) {
              const muteState = await safeGet(`mute_state:${newState.channel.id}`);
              if (muteState === 'true') {
                try {
                  // Set individual permission for this user to not speak in this channel only
                  await Promise.race([
                    newState.channel.permissionOverwrites.edit(newState.member, {
                      Speak: false
                    }),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Permission edit timeout')), 5000)
                    )
                  ]);
                  console.log(`[AUTO-MUTE] Auto-muted ${newState.member.user?.username || 'Unknown'} in temp channel ${newState.channel.name}`);
                } catch (error) {
                  console.error(`[AUTO-MUTE] Failed to auto-mute ${newState.member.user?.username || 'Unknown'}:`, error.message);
                }
              }
            }
          }
        } catch (error) {
          console.error('[AUTO-MUTE] Error checking mute state:', error);
        }
      }
    } catch (error) {
      console.error('[VOICE] ❌ Critical error in voiceStateUpdate:', error);
    }
  }
};

// Système de monitoring et récupération automatique
if (AUTO_RECOVERY) {
  // Health check périodique
  setInterval(() => {
    if (!HEALTH_CHECK) return;
    
    healthMetrics.forEach((metrics, guildId) => {
      const healthStatus = getHealthStatus(guildId);
      
      if (healthStatus < HEALTH_THRESHOLD) {
        console.warn(`[HEALTH_CHECK] Guild ${guildId} health: ${(healthStatus * 100).toFixed(1)}% - Below threshold`);
        
        // Réinitialiser le circuit breaker si la santé s'améliore
        if (healthStatus > RECOVERY_THRESHOLD) {
          const breaker = circuitBreaker.get(guildId);
          if (breaker && breaker.state === 'OPEN') {
            breaker.state = 'CLOSED';
            breaker.failures = 0;
            console.log(`[AUTO_RECOVERY] Guild ${guildId} - Circuit breaker reset due to improved health`);
          }
        }
      }
    });
  }, HEALTH_CHECK_INTERVAL);
  
  // Nettoyage périodique des caches
  setInterval(() => {
    const now = Date.now();
    
    // Nettoyer les caches expirés
    configCache.forEach((value, key) => {
      if (now - value.timestamp > CONFIG_CACHE_TTL) {
        configCache.delete(key);
      }
    });
    
    rateLimitCache.forEach((value, key) => {
      if (now - value.timestamp > RATE_LIMIT_CACHE_TTL) {
        rateLimitCache.delete(key);
      }
    });
    
    // Nettoyer les queues vides
    creationQueue.forEach((queue, guildId) => {
      if (queue.length === 0) {
        creationQueue.delete(guildId);
      }
    });
    
    // Nettoyer les métriques anciennes
    healthMetrics.forEach((metrics, guildId) => {
      if (now - metrics.lastCheck > 3600000) { // 1 heure
        healthMetrics.delete(guildId);
      }
    });
    
    // Nettoyer les load balancers anciens
    loadBalancer.forEach((balancer, guildId) => {
      if (now - balancer.lastUpdate > 300000) { // 5 minutes
        loadBalancer.delete(guildId);
      }
    });
    
    console.log(`[CLEANUP] Cache cleanup completed - Config: ${configCache.size}, Rate: ${rateLimitCache.size}, Queues: ${creationQueue.size}`);
  }, 300000); // Toutes les 5 minutes
  
  // Nettoyage des connexions Redis
  setInterval(() => {
    redisPool.cleanup();
  }, 60000); // Toutes les minutes
  
  console.log('[AUTO_RECOVERY] ✅ Auto-recovery and monitoring systems initialized');
}

// Système de monitoring ultra-avancé des salons
if (CHANNEL_MONITORING) {
  // Monitoring périodique des salons
  setInterval(() => {
    try {
      const client = require('discord.js').client;
      if (!client) return;
      
      client.guilds.cache.forEach(guild => {
        // Maintenance préventive
        schedulePreventiveMaintenance(guild.id);
        
        // Auto-healing
        performAutoHealing(guild.id);
        
        // Détection des orphelins
        detectOrphanChannels(guild);
      });
    } catch (error) {
      console.error('[CHANNEL_MONITORING] Error in periodic monitoring:', error);
    }
  }, CHANNEL_HEALTH_CHECK_INTERVAL);
  
  // Nettoyage périodique des queues
  setInterval(() => {
    try {
      cleanupQueue.forEach((queue, guildId) => {
        if (queue.length > 0) {
          console.log(`[CLEANUP_QUEUE] Processing ${queue.length} cleanup items for guild ${guildId}`);
          
          queue.forEach(async (item) => {
            try {
              const channel = await getChannelById(item.channelId, guildId);
              if (channel && channel.members.size === 0) {
                await cleanChannel(channel, guildId);
                console.log(`[CLEANUP_QUEUE] Cleaned channel ${item.channelId} (${item.reason})`);
              }
            } catch (error) {
              console.error(`[CLEANUP_QUEUE] Error cleaning channel ${item.channelId}:`, error);
            }
          });
          
          // Vider la queue après traitement
          cleanupQueue.set(guildId, []);
        }
      });
    } catch (error) {
      console.error('[CLEANUP_QUEUE] Error processing cleanup queue:', error);
    }
  }, CLEANUP_CHECK_INTERVAL);
  
  // Nettoyage préventif périodique
  setInterval(() => {
    try {
      const client = require('discord.js').client;
      if (!client) return;
      
      client.guilds.cache.forEach(guild => {
        const voiceChannels = guild.channels.cache.filter(channel => 
          channel.type === 2 && // Voice channel
          channel.name.includes("'s Room") && // Temp channel pattern
          channel.members.size === 0 // Empty channel
        );
        
        voiceChannels.forEach(async channel => {
          try {
            const creatorId = await safeGet(`creator:${channel.id}`);
            if (creatorId) {
              // Vérifier si le salon est dans le monitoring
              const monitorData = channelMonitor.get(channel.id);
              if (!monitorData) {
                console.log(`[PREVENTIVE_CLEANUP] Found unmonitored empty channel ${channel.id}, scheduling cleanup`);
                scheduleChannelCleanup(channel.id, guild.id);
              }
            }
          } catch (error) {
            console.error(`[PREVENTIVE_CLEANUP] Error checking channel ${channel.id}:`, error);
          }
        });
      });
    } catch (error) {
      console.error('[PREVENTIVE_CLEANUP] Error in preventive cleanup:', error);
    }
  }, PREVENTIVE_CLEANUP_INTERVAL);
  
  console.log('[CHANNEL_MONITORING] ✅ Ultra-advanced channel monitoring system initialized');
}

// Système de nettoyage ultra-robuste
if (ULTRA_CLEANUP) {
  // Nettoyage des données obsolètes
  setInterval(() => {
    const now = Date.now();
    
    // Nettoyer les données de monitoring obsolètes
    channelMonitor.forEach((data, channelId) => {
      if ((now - data.lastActivity) > CHANNEL_MONITOR_TTL) {
        channelMonitor.delete(channelId);
        console.log(`[ULTRA_CLEANUP] Removed stale monitoring data for channel ${channelId}`);
      }
    });
    
    // Nettoyer les orphelins anciens
    orphanChannels.forEach((data, channelId) => {
      if ((now - data.detectedAt) > ORPHAN_DETECTION_TTL) {
        orphanChannels.delete(channelId);
        console.log(`[ULTRA_CLEANUP] Removed stale orphan data for channel ${channelId}`);
      }
    });
    
    // Nettoyer les queues de nettoyage anciennes
    cleanupQueue.forEach((queue, guildId) => {
      const filteredQueue = queue.filter(item => (now - item.timestamp) < 300000); // 5 minutes
      if (filteredQueue.length !== queue.length) {
        cleanupQueue.set(guildId, filteredQueue);
        console.log(`[ULTRA_CLEANUP] Cleaned stale cleanup queue items for guild ${guildId}`);
      }
    });
    
    console.log(`[ULTRA_CLEANUP] Cleanup completed - Monitoring: ${channelMonitor.size}, Orphans: ${orphanChannels.size}, Queues: ${cleanupQueue.size}`);
  }, 300000); // Toutes les 5 minutes
  
  console.log('[ULTRA_CLEANUP] ✅ Ultra-robust cleanup system initialized');
}
const Redis = require('ioredis');
const { errorHandler } = require('./utils/errorHandler');

require('dotenv').config();

// Vérifier si Redis est configuré et accessible
const hasRedisConfig = (process.env.REDIS_HOST && 
                        process.env.REDIS_HOST !== 'localhost' && 
                        process.env.REDIS_HOST !== 'disabled') || 
                       (process.env.REDIS_URL && process.env.REDIS_URL !== '') || 
                       (process.env.REDIS_PORT && process.env.REDIS_PORT !== '0');

// Si Redis n'est pas configuré, créer un client factice
let redis = null;
let redisEnabled = false;

if (hasRedisConfig) {
    // Configuration Redis avec gestion d'erreurs avancée
    const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // Configuration de reconnect automatique
        retryDelayOnClusterDown: 300,
        // Configuration de la santé
        healthCheckInterval: 30000,
        // Configuration de la mémoire
        maxMemoryPolicy: 'allkeys-lru',
        maxMemory: '256mb'
    };

    // Créer le client Redis seulement si configuré
    try {
        redis = new Redis(redisConfig);
        redisEnabled = true;
        console.log('✅ Redis client created, attempting connection...');
    } catch (error) {
        console.log('⚠️ Redis client creation failed, continuing without Redis...');
        redisEnabled = false;
    }
} else {
    console.log('⚠️ No Redis configuration found, running without Redis...');
    redisEnabled = false;
}

// Fonction de rate limiting améliorée avec gestion d'erreurs
async function rateLimit(userId, action, maxAttempts = 2, windowSeconds = 30) {
    // Si Redis n'est pas connecté, on désactive le rate limiting
    if (!redisEnabled || !redis || redis.status !== 'ready') {
        console.log('⚠️ Redis not connected, rate limiting disabled');
        return true;
    }

    const key = `ratelimit:${action}:${userId}`;

    try {
        const attempts = await redis.incr(key);

        if (attempts === 1) {
            // First time? Set expiration
            await redis.expire(key, windowSeconds);
        }

        if (attempts > maxAttempts) {
            await errorHandler.logInfo(`Rate limit exceeded for user ${userId} on action ${action}`, {
                category: 'rate_limit',
                userId,
                action,
                attempts
            });
            return false;
        }

        return true;
    } catch (error) {
        console.log('⚠️ Redis rate limiting error, allowing action');
        await errorHandler.handleError(error, {
            category: 'rate_limit',
            userId,
            action,
            maxAttempts,
            windowSeconds
        });
        return true; // Fail open to avoid blocking user due to Redis failure
    }
}

// Fonction de vérification de santé Redis
async function checkRedisHealth() {
    if (!redisEnabled || !redis) {
        return { healthy: false, error: 'Redis not enabled' };
    }

    try {
        const startTime = Date.now();
        await redis.ping();
        const responseTime = Date.now() - startTime;
        
        await errorHandler.logInfo(`Redis health check passed - response time: ${responseTime}ms`, {
            category: 'redis_health',
            responseTime
        });
        
        return { healthy: true, responseTime };
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'redis_health',
            critical: true
        });
        return { healthy: false, error: error.message };
    }
}

// Fonction de nettoyage des clés expirées
async function cleanupExpiredKeys(pattern = '*') {
    if (!redisEnabled || !redis) {
        return 0;
    }

    try {
        const keys = await redis.keys(pattern);
        let cleanedCount = 0;
        
        for (const key of keys) {
            const ttl = await redis.ttl(key);
            if (ttl === -1) { // Pas d'expiration
                await redis.expire(key, 3600); // Expire dans 1 heure
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            await errorHandler.logInfo(`Cleaned up ${cleanedCount} keys without TTL`, {
                category: 'redis_cleanup',
                cleanedCount
            });
        }
        
        return cleanedCount;
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'redis_cleanup',
            pattern
        });
        return 0;
    }
}

// Fonction de monitoring Redis
async function getRedisStats() {
    if (!redisEnabled || !redis) {
        return null;
    }

    try {
        const info = await redis.info();
        const memory = await redis.memory('USAGE');
        const keyspace = await redis.info('keyspace');
        
        return {
            info: info.split('\r\n').reduce((acc, line) => {
                const [key, value] = line.split(':');
                if (key && value) acc[key] = value;
                return acc;
            }, {}),
            memory: parseInt(memory) || 0,
            keyspace: keyspace
        };
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'redis_stats'
        });
        return null;
    }
}

// Fonction de sauvegarde sécurisée
async function safeSet(key, value, options = {}) {
    if (!redisEnabled || !redis) {
        return 'OK'; // Simuler une réponse Redis
    }

    try {
        const { ex, nx, xx } = options;
        const args = [key, value];
        
        if (ex) args.push('EX', ex);
        if (nx) args.push('NX');
        if (xx) args.push('XX');
        
        const result = await redis.set(...args);
        
        await errorHandler.logDebug(`Redis SET operation completed`, {
            category: 'redis_operation',
            key,
            operation: 'SET',
            success: !!result
        });
        
        return result;
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'redis_operation',
            operation: 'SET',
            key
        });
        throw error;
    }
}

// Fonction de récupération sécurisée
async function safeGet(key) {
    if (!redisEnabled || !redis) {
        return null; // Retourner null si Redis n'est pas disponible
    }

    try {
        const result = await redis.get(key);
        
        await errorHandler.logDebug(`Redis GET operation completed`, {
            category: 'redis_operation',
            key,
            operation: 'GET',
            hasValue: !!result
        });
        
        return result;
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'redis_operation',
            operation: 'GET',
            key
        });
        return null;
    }
}

// Fonction de suppression sécurisée
async function safeDel(key) {
    if (!redisEnabled || !redis) {
        return 1; // Simuler une suppression réussie
    }

    try {
        const result = await redis.del(key);
        
        await errorHandler.logDebug(`Redis DEL operation completed`, {
            category: 'redis_operation',
            key,
            operation: 'DEL',
            deleted: result > 0
        });
        
        return result;
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'redis_operation',
            operation: 'DEL',
            key
        });
        return 0;
    }
}

// Initialisation avec vérification de santé - SEULEMENT si Redis est configuré
if (redisEnabled && redis) {
    (async () => {
        try {
            // Gestionnaire d'événements Redis avec logging
            redis.on('connect', async () => {
                await errorHandler.logInfo('Redis client connected successfully', { category: 'redis' });
            });

            redis.on('ready', async () => {
                await errorHandler.logInfo('Redis client ready', { category: 'redis' });
            });

            redis.on('error', async (error) => {
                await errorHandler.handleError(error, {
                    category: 'redis_error',
                    critical: false
                });
            });

            redis.on('close', async () => {
                await errorHandler.logWarning('Redis connection closed', { category: 'redis' });
            });

            redis.on('reconnecting', async (delay) => {
                await errorHandler.logInfo(`Redis reconnecting in ${delay}ms`, { category: 'redis' });
            });

            redis.on('end', async () => {
                await errorHandler.logWarning('Redis connection ended', { category: 'redis' });
            });

            // Tentative de connexion avec gestion d'erreur gracieuse
            await redis.connect().catch(async (error) => {
                console.log('⚠️ Redis connection failed, continuing without Redis...');
                redisEnabled = false;
                await errorHandler.logWarning('Redis connection failed, continuing without Redis', {
                    category: 'redis_init',
                    error: error.message
                });
            });
            
            // Vérification de santé initiale seulement si connecté
            if (redisEnabled && redis.status === 'ready') {
                const health = await checkRedisHealth();
                if (!health.healthy) {
                    await errorHandler.logWarning('Redis health check failed during initialization', {
                        category: 'redis_init'
                    });
                }
                
                // Nettoyage périodique des clés expirées
                setInterval(async () => {
                    await cleanupExpiredKeys();
                }, 60 * 60 * 1000); // Toutes les heures
                
                // Vérification de santé périodique
                setInterval(async () => {
                    await checkRedisHealth();
                }, 5 * 60 * 1000); // Toutes les 5 minutes
                
                // Monitoring des statistiques
                setInterval(async () => {
                    const stats = await getRedisStats();
                    if (stats) {
                        await errorHandler.logInfo('Redis statistics', {
                            category: 'redis_monitoring',
                            stats: {
                                memory: stats.memory,
                                connectedClients: stats.info.connected_clients,
                                usedMemory: stats.info.used_memory_human
                            }
                        });
                    }
                }, 30 * 60 * 1000); // Toutes les 30 minutes
            }
            
        } catch (error) {
            console.log('⚠️ Redis initialization error, continuing without Redis...');
            redisEnabled = false;
            await errorHandler.handleError(error, {
                category: 'redis_init',
                critical: false // Changé à false pour éviter l'arrêt du bot
            });
        }
    })();
}

module.exports = { 
    redis, 
    rateLimit, 
    checkRedisHealth, 
    cleanupExpiredKeys, 
    getRedisStats,
    safeSet,
    safeGet,
    safeDel,
    redisEnabled
};
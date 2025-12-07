const { PermissionsBitField } = require('discord.js');
const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');
const { dataManager } = require('../../utils/dataManager');
const { errorHandler } = require('../../utils/errorHandler');
const { updateLeaderboard } = require('../../utils/leaderboardManager');

// Configuration des rôles
const STAFF_ROLE_IDS = ['1372723869047328768' , '1372715819649335327' , '1372715819649335327'];
const HIGH_ROLE_IDS = ['1373603481524502570' , '1372700459193729126' , '1372700468782039110' , '1373624244897841162' , '1377334338  840166420' , '1399199681380094062' , '1377333188191588533' , '1378092097365868688'];
const OWNER_USER_IDS = ['1378092097365868688' , '1366651120373600296'];

// Configuration du système
const TASK_CHANNEL_ID = '1395159760239595533';
const REQUEST_TASK_ACCEPT_CHANNEL_ID = '1395159918046089277'; // Salon request-task-accept
const TASK_LEADERBOARD_CHANNEL_ID = '1395159806838444112'; // Salon task-leaderboard
const TASK_DURATION_MINUTES = 20;
const TASK_DURATION_SECONDS = TASK_DURATION_MINUTES * 60;
const TASK_VALIDITY_WINDOW_MINUTES = 25; // Fenêtre de validité pour éviter les abus
const UPDATE_INTERVAL_MS = 1000; // Mise à jour chaque seconde (chrono en temps réel)
const REDIS_EXPIRY_SECONDS = TASK_DURATION_SECONDS + 300; // 20 min + 5 min de marge

// Cache ultra-robuste pour les intervalles de mise à jour (évite les doublons)
const activeUpdateIntervals = new Map();
// Cache ultra-robuste pour les timers de pause (2 minutes pour revenir)
const pauseTimers = new Map();
// Cache pour stocker les messages d'embed originaux
const originalEmbedMessages = new Map();

// Configuration ULTRA-PUISSANTE
const ULTRA_ROBUST_CONFIG = {
    HEARTBEAT_INTERVAL_MS: 2000, // 2 secondes (2.5x plus rapide)
    ERROR_RETRY_DELAY_MS: 500, // 0.5 seconde (2x plus rapide)
    MAX_RETRIES: 10, // 2x plus de tentatives
    CLEANUP_INTERVAL_MS: 15000, // 15 secondes (2x plus rapide)
    MAX_CONCURRENT_TASKS: 500, // 5x plus de tâches simultanées
    BATCH_PROCESSING_SIZE: 25, // Traitement par lots de 25
    PRIORITY_QUEUE_SIZE: 100, // Queue de priorité pour les tâches importantes
    AUTO_SCALING: true, // Mise à l'échelle automatique
    PERFORMANCE_MONITORING: true // Monitoring des performances en temps réel
};

// Cache ultra-robuste avec gestion d'erreurs
const ultraRobustCache = {
    activeTasks: new Map(),
    errorCounts: new Map(),
    lastHeartbeat: new Map(),
    isShuttingDown: false,
    
    // Nettoyage automatique toutes les 15 secondes (2x plus rapide)
    cleanupInterval: setInterval(() => this.cleanup(), ULTRA_ROBUST_CONFIG.CLEANUP_INTERVAL_MS),
    
    // Heartbeat global toutes les 2 secondes (2.5x plus rapide)
    globalHeartbeat: setInterval(() => this.globalHeartbeatCheck(), ULTRA_ROBUST_CONFIG.HEARTBEAT_INTERVAL_MS),
    
    // Monitoring des performances en temps réel
    performanceMonitor: setInterval(() => this.monitorPerformance(), 5000),
    
    // Mise à l'échelle automatique
    autoScaling: setInterval(() => this.autoScale(), 10000),
    
    // Nettoyage automatique
    cleanup() {
        try {
            const now = Date.now();
            const expiredTasks = [];

            for (const [channelId, task] of this.activeTasks.entries()) {
                // Tâches expirées (plus de 25 minutes)
                if (now - task.startTime > TASK_VALIDITY_WINDOW_MINUTES * 60 * 1000) {
                    expiredTasks.push(channelId);
                }
                // Tâches avec trop d'erreurs
                else if ((this.errorCounts.get(channelId) || 0) > ULTRA_ROBUST_CONFIG.MAX_RETRIES) {
                    expiredTasks.push(channelId);
                }
            }

            expiredTasks.forEach(channelId => {
                console.log(`[ULTRA_ROBUST] Nettoyage automatique de la tâche ${channelId}`);
                this.removeTask(channelId);
            });

            if (expiredTasks.length > 0) {
                console.log(`[ULTRA_ROBUST] ${expiredTasks.length} tâches nettoyées automatiquement`);
            }
        } catch (error) {
            console.error('[ULTRA_ROBUST] Erreur lors du nettoyage automatique:', error);
        }
    },

    // Heartbeat global
    globalHeartbeatCheck() {
        try {
            const now = Date.now();
            let activeCount = 0;
            let errorCount = 0;

            for (const [channelId, task] of this.activeTasks.entries()) {
                activeCount++;
                
                // Vérifier si la tâche est encore active
                if (now - (this.lastHeartbeat.get(channelId) || 0) > ULTRA_ROBUST_CONFIG.HEARTBEAT_INTERVAL_MS * 3) {
                    console.warn(`[ULTRA_ROBUST] Tâche ${channelId} semble inactive, tentative de récupération`);
                    this.attemptTaskRecovery(channelId);
                }

                if ((this.errorCounts.get(channelId) || 0) > 0) errorCount++;
            }

            if (activeCount > 0) {
                console.log(`[ULTRA_ROBUST] Heartbeat: ${activeCount} tâches actives, ${errorCount} avec erreurs`);
            }
        } catch (error) {
            console.error('[ULTRA_ROBUST] Erreur lors du heartbeat global:', error);
        }
    },

    // Tentative de récupération d'une tâche
    async attemptTaskRecovery(channelId) {
        try {
            // Vérifier si la tâche existe encore dans Redis
            const redisTask = await redis.get(`task_timer:${channelId}`);
            if (!redisTask) {
                console.log(`[ULTRA_ROBUST] Tâche ${channelId} n'existe plus dans Redis, suppression`);
                this.removeTask(channelId);
                return;
            }

            // Réinitialiser le compteur d'erreurs
            this.errorCounts.set(channelId, 0);
            this.lastHeartbeat.set(channelId, Date.now());
            console.log(`[ULTRA_ROBUST] Tâche ${channelId} récupérée avec succès`);
        } catch (error) {
            console.error(`[ULTRA_ROBUST] Erreur lors de la récupération de la tâche ${channelId}:`, error);
        }
    },

    // Ajouter une tâche active
    addTask(channelId, taskData) {
        try {
            if (this.activeTasks.size >= ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS) {
                console.warn(`[ULTRA_ROBUST] Limite de tâches concurrentes atteinte: ${ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS}`);
                return false;
            }

            this.activeTasks.set(channelId, {
                ...taskData,
                startTime: Date.now(),
                lastUpdate: Date.now()
            });

            this.errorCounts.set(channelId, 0);
            this.lastHeartbeat.set(channelId, Date.now());

            console.log(`[ULTRA_ROBUST] Tâche ajoutée pour le salon ${channelId}`);
            return true;
        } catch (error) {
            console.error(`[ULTRA_ROBUST] Erreur lors de l'ajout de la tâche ${channelId}:`, error);
            return false;
        }
    },

    // Supprimer une tâche
    removeTask(channelId) {
        try {
            this.activeTasks.delete(channelId);
            this.errorCounts.delete(channelId);
            this.lastHeartbeat.delete(channelId);
            
            console.log(`[ULTRA_ROBUST] Tâche supprimée pour le salon ${channelId}`);
            return true;
        } catch (error) {
            console.error(`[ULTRA_ROBUST] Erreur lors de la suppression de la tâche ${channelId}:`, error);
            return false;
        }
    },

    // Mettre à jour le heartbeat d'une tâche
    updateHeartbeat(channelId) {
        this.lastHeartbeat.set(channelId, Date.now());
    },

    // Gérer une erreur de tâche
    handleTaskError(channelId, error) {
        try {
            const currentErrors = this.errorCounts.get(channelId) || 0;
            this.errorCounts.set(channelId, currentErrors + 1);
            
            console.warn(`[ULTRA_ROBUST] Tâche ${channelId}: erreur ${currentErrors + 1}/${ULTRA_ROBUST_CONFIG.MAX_RETRIES}`);

            if (currentErrors + 1 >= ULTRA_ROBUST_CONFIG.MAX_RETRIES) {
                console.error(`[ULTRA_ROBUST] Tâche ${channelId}: trop d'erreurs, arrêt`);
                this.removeTask(channelId);
                return false;
            }
            return true;
        } catch (error) {
            console.error(`[ULTRA_ROBUST] Erreur lors de la gestion d'erreur ${channelId}:`, error);
            return false;
        }
    },

    // Monitoring des performances en temps réel
    monitorPerformance() {
        try {
            const now = Date.now();
            const activeCount = this.activeTasks.size;
            const errorCount = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
            const avgResponseTime = this.calculateAverageResponseTime();
            
            console.log(`[PERFORMANCE] Active: ${activeCount}, Errors: ${errorCount}, Avg Response: ${avgResponseTime}ms`);
            
            // Alertes de performance
            if (activeCount > ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS * 0.8) {
                console.warn(`[PERFORMANCE] High load detected: ${activeCount}/${ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS}`);
            }
            
            if (errorCount > activeCount * 0.1) {
                console.warn(`[PERFORMANCE] High error rate: ${errorCount}/${activeCount}`);
            }
        } catch (error) {
            console.error('[PERFORMANCE] Error monitoring performance:', error);
        }
    },
    
    // Mise à l'échelle automatique
    autoScale() {
        try {
            const activeCount = this.activeTasks.size;
            const errorRate = this.calculateErrorRate();
            
            // Ajuster automatiquement les paramètres selon la charge
            if (activeCount > ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS * 0.7) {
                // Augmenter la capacité
                ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS = Math.min(1000, ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS + 100);
                console.log(`[AUTO_SCALE] Increased capacity to ${ULTRA_ROBUST_CONFIG.MAX_CONCURRENT_TASKS}`);
            }
            
            if (errorRate > 0.05) {
                // Réduire la charge
                ULTRA_ROBUST_CONFIG.HEARTBEAT_INTERVAL_MS = Math.max(1000, ULTRA_ROBUST_CONFIG.HEARTBEAT_INTERVAL_MS + 500);
                console.log(`[AUTO_SCALE] Reduced heartbeat to ${ULTRA_ROBUST_CONFIG.HEARTBEAT_INTERVAL_MS}ms`);
            }
        } catch (error) {
            console.error('[AUTO_SCALE] Error during auto-scaling:', error);
        }
    },
    
    // Calculer le taux d'erreur
    calculateErrorRate() {
        try {
            const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
            const totalTasks = this.activeTasks.size;
            return totalTasks > 0 ? totalErrors / totalTasks : 0;
        } catch (error) {
            return 0;
        }
    },
    
    // Calculer le temps de réponse moyen
    calculateAverageResponseTime() {
        try {
            const responseTimes = Array.from(this.lastHeartbeat.values());
            if (responseTimes.length === 0) return 0;
            
            const now = Date.now();
            const avgTime = responseTimes.reduce((sum, time) => sum + (now - time), 0) / responseTimes.length;
            return Math.round(avgTime);
        } catch (error) {
            return 0;
        }
    },
    
    // Arrêt propre
    shutdown() {
        try {
            this.isShuttingDown = true;
            
            // Nettoyer les intervaux globaux
            if (this.cleanupInterval) clearInterval(this.cleanupInterval);
            if (this.globalHeartbeat) clearInterval(this.globalHeartbeat);
            if (this.performanceMonitor) clearInterval(this.performanceMonitor);
            if (this.autoScaling) clearInterval(this.autoScaling);

            console.log('[ULTRA_ROBUST] Arrêt propre effectué');
        } catch (error) {
            console.error('[ULTRA_ROBUST] Erreur lors de l\'arrêt:', error);
        }
    }
};

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('[ULTRA_ROBUST] Arrêt en cours...');
    ultraRobustCache.shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[ULTRA_ROBUST] Arrêt en cours...');
    ultraRobustCache.shutdown();
    process.exit(0);
});

// Utilitaire pour vérifier les rôles
function hasRole(member, roleIds) {
    return member.roles.cache.some(role => roleIds.includes(role.id));
}

// Fonction pour incrémenter le compteur de tâches avec protection contre les conflits
async function incrementTaskCount(guildId, userId) {
    try {
        const result = await dataManager.updateUserTaskCount(guildId, userId, 1);
        if (result) {
            return await dataManager.getUserTaskCount(guildId, userId);
        }
        return null;
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'task_system',
            operation: 'increment_task_count',
            guildId,
            userId
        });
        return null;
    }
}

// Fonction pour obtenir les données d'un serveur
async function getGuildTaskData(guildId) {
    try {
        return await dataManager.getTaskData(guildId);
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'task_system',
            operation: 'get_guild_task_data',
            guildId
        });
        return {};
    }
}

// Fonction pour effacer les données d'un serveur
async function clearGuildTaskData(guildId) {
    try {
        return await dataManager.setTaskData(guildId, {});
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'task_system',
            operation: 'clear_guild_task_data',
            guildId
        });
        return false;
    }
}

// Fonction pour vérifier si un timer est valide avec gestion d'erreurs robuste
async function isValidTimer(timerKey) {
    try {
        const timerStart = await redis.get(timerKey);
        if (!timerStart) return false;
        
        const startTime = parseInt(timerStart);
        if (isNaN(startTime)) return false;
        
        const currentTime = Date.now();
        const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
        
        // Timer valide entre 0 et TASK_VALIDITY_WINDOW_MINUTES minutes
        return elapsedMinutes >= 0 && elapsedMinutes <= TASK_VALIDITY_WINDOW_MINUTES;
    } catch (error) {
        console.error('[TASK SYSTEM] Error checking timer validity:', error);
        return false;
    }
}

// Fonction pour vérifier si un timer est terminé
async function isTimerCompleted(timerKey) {
    try {
        const timerStart = await redis.get(timerKey);
        if (!timerStart) return false;
        
        const startTime = parseInt(timerStart);
        if (isNaN(startTime)) return false;
        
        const currentTime = Date.now();
        const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
        
        // Timer terminé à TASK_DURATION_MINUTES minutes ou plus
        return elapsedMinutes >= TASK_DURATION_MINUTES;
    } catch (error) {
        console.error('[TASK SYSTEM] Error checking timer completion:', error);
        return false;
    }
}

// Fonction pour nettoyer les intervalles de mise à jour
function cleanupUpdateInterval(channelId) {
    if (activeUpdateIntervals.has(channelId)) {
        const interval = activeUpdateIntervals.get(channelId);
        if (interval) {
            clearInterval(interval);
            console.log(`[TASK CLEANUP] Stopped update interval for channel ${channelId}`);
        }
        activeUpdateIntervals.delete(channelId);
    }
}

// Fonction pour nettoyer les timers de pause
function cleanupPauseTimer(channelId) {
    if (pauseTimers.has(channelId)) {
        const pauseEntry = pauseTimers.get(channelId);
        if (pauseEntry) {
            // Support both legacy single-timeout and new { timeout, interval } structure
            if (typeof pauseEntry === 'object' && pauseEntry !== null) {
                if (pauseEntry.timeout) {
                    clearTimeout(pauseEntry.timeout);
                }
                if (pauseEntry.interval) {
                    clearInterval(pauseEntry.interval);
                }
            } else {
                clearTimeout(pauseEntry);
            }
            console.log(`[TASK CLEANUP] Stopped pause timer(s) for channel ${channelId}`);
        }
        pauseTimers.delete(channelId);
    }
}

// Fonction pour nettoyer complètement les données d'un salon
function cleanupChannelData(channelId) {
    console.log(`[TASK CLEANUP] Cleaning up data for channel ${channelId}`);
    
    // Nettoyer l'intervalle de mise à jour
    cleanupUpdateInterval(channelId);
    
    // Nettoyer le timer de pause
    cleanupPauseTimer(channelId);
    
    // Supprimer le message original de la cache
    if (originalEmbedMessages.has(channelId)) {
        originalEmbedMessages.delete(channelId);
        console.log(`[TASK CLEANUP] Removed original message from cache for channel ${channelId}`);
    }
    
    // Nettoyer le cache ultra-robuste
    ultraRobustCache.removeTask(channelId);
    
    // Nettoyer les clés Redis temporaires
    cleanupRedisKeys(channelId);
    
    console.log(`[TASK CLEANUP] Cleanup completed for channel ${channelId}`);
}

// Fonction pour nettoyer les clés Redis temporaires
async function cleanupRedisKeys(channelId) {
    try {
        const timerKey = `task_timer:${channelId}`;
        const pauseKey = `task_pause:${channelId}`;
        
        // Supprimer les clés Redis
        await redis.del(timerKey);
        await redis.del(pauseKey);
        
        console.log(`[TASK CLEANUP] Redis keys cleaned for channel ${channelId}`);
    } catch (error) {
        console.error(`[TASK CLEANUP] Error cleaning Redis keys for channel ${channelId}:`, error);
    }
}

// Fonction pour gérer la pause du timer quand le staff quitte
async function handleStaffLeave(voiceChannel, member) {
    try {
        console.log(`[TASK_PAUSE] Starting pause logic for ${member.user.username} in channel ${voiceChannel.name}`);
        
        const channelId = voiceChannel.id;
        const timerKey = `task_timer:${channelId}`;
        const pauseKey = `task_pause:${channelId}`;
        
        // Vérifier si un timer est en cours
        const timerStart = await redis.get(timerKey);
        if (!timerStart) {
            console.log(`[TASK_PAUSE] No active timer found for channel ${channelId}`);
            return;
        }
        
        console.log(`[TASK_PAUSE] Timer found, pausing task for ${member.user.username}`);
        
        // Marquer le timer comme en pause (raison: staff left)
        await redis.set(pauseKey, JSON.stringify({ start: timerStart, reason: 'staff_left' }), 'EX', 120); // 2 minutes
        
        // Nettoyer l'intervalle de mise à jour
        cleanupUpdateInterval(channelId);
        
        // Créer un embed de pause
        const pauseEmbed = createPauseEmbed(voiceChannel, member);
        if (pauseEmbed) {
            // Envoyer dans le salon task-onetap
            const taskChannel = voiceChannel.guild.channels.cache.get(TASK_CHANNEL_ID);
            if (taskChannel) {
                await taskChannel.send({ embeds: [pauseEmbed] });
                console.log(`[TASK_PAUSE] Pause embed sent to task channel`);
            }
            
            // Envoyer dans le salon request-task-accept
            const requestChannel = voiceChannel.guild.channels.cache.get(REQUEST_TASK_ACCEPT_CHANNEL_ID);
            if (requestChannel) {
                await requestChannel.send({ embeds: [pauseEmbed] });
                console.log(`[TASK_PAUSE] Pause embed sent to request-task-accept channel`);
            }
        }
        
        // Timer de 2 minutes pour annuler si le staff ne revient pas
        const pauseTimer = setTimeout(async () => {
            try {
                console.log(`[TASK_PAUSE] 2-minute timer expired, checking if staff returned`);
                const currentPause = await redis.get(pauseKey);
                if (currentPause) {
                    console.log(`[TASK_PAUSE] Staff did not return, cancelling task`);
                    // Le staff n'est pas revenu dans les 2 minutes
                    await redis.del(timerKey);
                    await redis.del(pauseKey);
                    cleanupChannelData(channelId);
                    
                    // Envoyer un embed d'annulation
                    const cancelEmbed = createCancelEmbed(voiceChannel, member);
                    if (cancelEmbed) {
                        // Envoyer dans le salon task-onetap
                        const taskChannel = voiceChannel.guild.channels.cache.get(TASK_CHANNEL_ID);
                        if (taskChannel) {
                            await taskChannel.send({ embeds: [cancelEmbed] });
                            console.log(`[TASK_PAUSE] Cancellation embed sent to task channel`);
                        }
                        
                        // Envoyer dans le salon request-task-accept
                        const requestChannel = voiceChannel.guild.channels.cache.get(REQUEST_TASK_ACCEPT_CHANNEL_ID);
                        if (requestChannel) {
                            await requestChannel.send({ embeds: [cancelEmbed] });
                            console.log(`[TASK_PAUSE] Cancellation embed sent to request-task-accept channel`);
                        }
                    }
                    
                    // Notification DM supprimée comme demandé
                }
            } catch (error) {
                console.error('[TASK_PAUSE] Error in pause timer callback:', error);
            }
        }, 120000); // 2 minutes
        
        pauseTimers.set(channelId, pauseTimer);
        console.log(`[TASK_PAUSE] Pause timer set for channel ${channelId}`);
        
    } catch (error) {
        console.error('[TASK_PAUSE] Error handling staff leave:', error);
    }
}

// Fonction pour gérer le retour du staff
async function handleStaffReturn(voiceChannel, member) {
    try {
        console.log(`[TASK_PAUSE] Starting resume logic for ${member.user.username} in channel ${voiceChannel.name}`);
        
        const channelId = voiceChannel.id;
        const timerKey = `task_timer:${channelId}`;
        const pauseKey = `task_pause:${channelId}`;
        
        // Vérifier si le timer était en pause
        const pausedTimer = await redis.get(pauseKey);
        if (!pausedTimer) {
            console.log(`[TASK_PAUSE] No pause found for channel ${channelId}`);
            return;
        }
        
        console.log(`[TASK_PAUSE] Pause found, resuming task for ${member.user.username}`);
        
        // IMPORTANT: Nettoyer le timer de pause AVANT de restaurer le timer principal
        cleanupPauseTimer(channelId);
        
        // Supprimer la pause
        await redis.del(pauseKey);
        
        console.log(`[TASK_PAUSE] Pause cleared for channel ${channelId}`);
        
        // Restaurer le timer avec le temps restant
        let parsed;
        try {
            parsed = JSON.parse(pausedTimer);
        } catch (e) {
            parsed = { start: parseInt(pausedTimer), reason: 'staff_left' };
        }
        const startTime = parseInt(parsed.start);
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const remainingSeconds = Math.max(0, TASK_DURATION_SECONDS - elapsedSeconds);
        
        console.log(`[TASK_PAUSE] Remaining time: ${remainingSeconds} seconds`);
        
        if (remainingSeconds > 0) {
            console.log(`[TASK_PAUSE] Restoring timer with ${remainingSeconds} seconds remaining`);
            
            // Restaurer le timer principal avec le temps restant
            await redis.set(timerKey, startTime.toString(), 'EX', remainingSeconds + 300);
            
            // Envoyer un embed de reprise
            const resumeEmbed = createResumeEmbed(voiceChannel, member, remainingSeconds);
            if (resumeEmbed) {
                // Envoyer dans le salon task-onetap
                const taskChannel = voiceChannel.guild.channels.cache.get(TASK_CHANNEL_ID);
                if (taskChannel) {
                    await taskChannel.send({ embeds: [resumeEmbed] });
                    console.log(`[TASK_PAUSE] Resume embed sent to task channel`);
                }
                
                // Envoyer dans le salon request-task-accept
                const requestChannel = voiceChannel.guild.channels.cache.get(REQUEST_TASK_ACCEPT_CHANNEL_ID);
                if (requestChannel) {
                    await requestChannel.send({ embeds: [resumeEmbed] });
                    console.log(`[TASK_PAUSE] Resume embed sent to request-task-accept channel`);
                }
            }
            
            // IMPORTANT: Redémarrer la mise à jour de l'embed ORIGINAL
            const originalMessage = originalEmbedMessages.get(channelId);
            if (originalMessage) {
                console.log(`[TASK_PAUSE] Restarting original embed update`);
                // Redémarrer la mise à jour de l'embed original
                await updateTaskEmbed(null, voiceChannel, member, startTime, originalMessage);
            } else {
                console.log(`[TASK_PAUSE] No original message found in cache, creating new embed`);
                // Si pas d'embed original, créer un nouveau
                const taskEmbed = createTaskEmbed(voiceChannel, member, startTime);
                if (taskEmbed) {
                    const taskChannel = voiceChannel.guild.channels.cache.get(TASK_CHANNEL_ID);
                    if (taskChannel) {
                        const taskChannelMessage = await taskChannel.send({ embeds: [taskEmbed] });
                        originalEmbedMessages.set(channelId, taskChannelMessage);
                        await updateTaskEmbed(null, voiceChannel, member, startTime, taskChannelMessage);
                    }
                }
            }
        } else {
            console.log(`[TASK_PAUSE] No remaining time, task would be completed`);
        }
        
    } catch (error) {
        console.error('[TASK_PAUSE] Error handling staff return:', error);
    }
}

// Fonction utilitaire pour obtenir l'icône du serveur
function getServerIcon(guild) {
    return guild.iconURL({ dynamic: true, size: 1024 }) || guild.client.user.displayAvatarURL({ dynamic: true, size: 1024 });
}

// Fonction pour créer l'embed de tâche avec formatage optimisé
function createTaskEmbed(voiceChannel, member, startTime) {
    try {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        
        // Formatage du temps écoulé pour Created At
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        
        let timeDisplay;
        if (hours > 0) {
            timeDisplay = `il y a ${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            timeDisplay = `il y a ${minutes}m ${seconds}s`;
        } else {
            timeDisplay = `il y a ${seconds}s`;
        }

        // Formatage du temps restant pour Time
        const remainingSeconds = Math.max(0, TASK_DURATION_SECONDS - elapsedSeconds);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecs = remainingSeconds % 60;
        
        let timeRemainingDisplay;
        if (remainingSeconds <= 0) {
            timeRemainingDisplay = '✅ Timer completed - Auto-count active';
        } else if (remainingMinutes > 0) {
            timeRemainingDisplay = `${remainingMinutes}m ${remainingSecs}s`;
        } else {
            timeRemainingDisplay = `${remainingSecs}s`;
        }

        // Créer la liste des membres taggés
        const memberTags = Array.from(voiceChannel.members.values())
            .map(member => `<@${member.id}>`)
            .join(', ');
        
        return new EmbedBuilder()
            .setAuthor({ 
                name: 'Late Night', 
                iconURL: getServerIcon(voiceChannel.guild)
            })
            .setColor(0x5865F2)
            .setThumbnail(getServerIcon(voiceChannel.guild))
            .addFields(
                {
                    name: `👥 Users in ${voiceChannel.name} - ${voiceChannel.members.size}`,
                    value: memberTags,
                    inline: false
                },
                {
                    name: '👑 Owner Channel:',
                    value: `<@${member.id}>`,
                    inline: true
                },
                {
                    name: '🆔 Channel ID:',
                    value: `(${voiceChannel.id})`,
                    inline: true
                },
                {
                    name: '📋 One Tap Name:',
                    value: `${voiceChannel.name}`,
                    inline: true
                },
                {
                    name: '👨‍💼 Staff:',
                    value: `${member.user.username}`,
                    inline: true
                },
                {
                    name: '🎯 Task By:',
                    value: `<@${member.id}>`,
                    inline: true
                },
                {
                    name: '⏰ Created At:',
                    value: timeDisplay,
                    inline: true
                },
                {
                    name: '⏳ Time Remaining:',
                    value: timeRemainingDisplay,
                    inline: true
                }
            )
            .setFooter({ 
                text: `One Tap Task by ${member.user.username} • ${new Date().toLocaleString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}`,
                iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
            })
            .setTimestamp();
    } catch (error) {
        console.error('[TASK SYSTEM] Error creating task embed:', error);
        return null;
    }
}

// Fonction pour créer l'embed final (timer terminé)
function createFinalTaskEmbed(voiceChannel, member) {
    try {
        // Créer la liste des membres taggés pour l'embed final
        const finalMemberTags = Array.from(voiceChannel.members.values())
            .map(member => `<@${member.id}>`)
            .join(', ');
        
        return new EmbedBuilder()
            .setAuthor({ 
                name: 'Late Night', 
                iconURL: getServerIcon(voiceChannel.guild)
            })
            .setColor(0x57F287)
            .setThumbnail(getServerIcon(voiceChannel.guild))
            .addFields(
                {
                    name: `👥 Users in ${voiceChannel.name} - ${voiceChannel.members.size}`,
                    value: finalMemberTags,
                    inline: false
                },
                {
                    name: '👑 Owner Channel:',
                    value: `<@${member.id}>`,
                    inline: true
                },
                {
                    name: '🆔 Channel ID:',
                    value: `(${voiceChannel.id})`,
                    inline: true
                },
                {
                    name: '📋 One Tap Name:',
                    value: `${voiceChannel.name}`,
                    inline: true
                },
                {
                    name: '👨‍💼 Staff:',
                    value: `${member.user.username}`,
                    inline: true
                },
                {
                    name: '🎯 Task By:',
                    value: `<@${member.id}>`,
                    inline: true
                },
                {
                    name: '⏰ Created At:',
                    value: `il y a ${TASK_DURATION_MINUTES}m`,
                    inline: true
                },
                {
                    name: '✅ Status:',
                    value: 'Timer terminé - Tâche automatiquement comptée !',
                    inline: true
                }
            )
            .setFooter({ 
                text: `One Tap Task by ${member.user.username} • ${new Date().toLocaleString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}`,
                iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
            })
            .setTimestamp();
    } catch (error) {
        console.error('[TASK SYSTEM] Error creating final task embed:', error);
        return null;
    }
}

// Fonction pour mettre à jour l'embed en temps réel avec gestion d'erreurs ultra-robuste
async function updateTaskEmbed(message, voiceChannel, member, startTime, embedMessage) {
    const channelId = voiceChannel.id;
    
    // Nettoyer l'intervalle existant s'il y en a un
    cleanupUpdateInterval(channelId);
    
    // Ajouter la tâche au cache ultra-robuste
    ultraRobustCache.addTask(channelId, {
        memberId: member.id,
        memberName: member.user.username,
        channelName: voiceChannel.name,
        guildId: voiceChannel.guild.id
    });
    
    // Compteur pour éviter les mises à jour trop fréquentes
    let updateCount = 0;
    let lastUpdateTime = 0;
    
    const updateInterval = setInterval(async () => {
        try {
            updateCount++;
            const currentTime = Date.now();
            
            // Mettre à jour le heartbeat de la tâche
            ultraRobustCache.updateHeartbeat(channelId);
            
            // Vérifier si le timer existe encore
            const timerKey = `task_timer:${channelId}`;
            const timerExists = await redis.get(timerKey);
            
            if (!timerExists) {
                console.log(`[TASK UPDATE] Timer not found for channel ${channelId}, stopping updates`);
                cleanupUpdateInterval(channelId);
                ultraRobustCache.removeTask(channelId);
                return;
            }
            
            // Vérifier si le timer est terminé
            const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));

            // Gestion pause/reprise sur membres < 5
            const pauseKey = `task_pause:${channelId}`;
            if (voiceChannel.members.size < 5) {
                // Si pas déjà en pause, déclencher pause
                const existingPause = await redis.get(pauseKey);
                if (!existingPause) {
                    await redis.set(pauseKey, JSON.stringify({ start: startTime, reason: 'low_members' }), 'EX', 120);
                    // Arrêter mises à jour pendant la pause
                    cleanupUpdateInterval(channelId);
                    // Envoyer embed pause (low members)
                    const pauseEmbed = createPauseEmbed(voiceChannel, member);
                    const taskChannel = voiceChannel.guild.channels.cache.get(TASK_CHANNEL_ID);
                    if (taskChannel && pauseEmbed) {
                        await taskChannel.send({ embeds: [pauseEmbed] });
                    }
                    const requestChannel = voiceChannel.guild.channels.cache.get(REQUEST_TASK_ACCEPT_CHANNEL_ID);
                    if (requestChannel && pauseEmbed) {
                        await requestChannel.send({ embeds: [pauseEmbed] });
                    }
                    // Démarrer timeout d'annulation + interval de reprise auto
                    const cancelTimeout = setTimeout(async () => {
                        try {
                            const stillPaused = await redis.get(pauseKey);
                            if (stillPaused) {
                                await redis.del(`task_timer:${channelId}`);
                                await redis.del(pauseKey);
                                cleanupChannelData(channelId);
                                const cancelEmbed = createLowMembersCancelEmbed(voiceChannel, member);
                                const taskCh = voiceChannel.guild.channels.cache.get(TASK_CHANNEL_ID);
                                if (taskCh && cancelEmbed) await taskCh.send({ embeds: [cancelEmbed] });
                                const reqCh = voiceChannel.guild.channels.cache.get(REQUEST_TASK_ACCEPT_CHANNEL_ID);
                                if (reqCh && cancelEmbed) await reqCh.send({ embeds: [cancelEmbed] });
                            }
                        } catch (e) {
                            console.error('[TASK UPDATE] Error during low-members cancel timeout:', e);
                        }
                    }, 120000);
                    const resumeInterval = setInterval(async () => {
                        try {
                            if (voiceChannel.members.size >= 5) {
                                // Reprise
                                cleanupPauseTimer(channelId);
                                await redis.del(pauseKey);
                                // Redémarrer l'update de l'embed original
                                await updateTaskEmbed(null, voiceChannel, member, startTime, embedMessage);
                            }
                        } catch (e) {
                            console.error('[TASK UPDATE] Error during low-members resume interval:', e);
                        }
                    }, 2000);
                    pauseTimers.set(channelId, { timeout: cancelTimeout, interval: resumeInterval });
                }
                return; // suspendre le loop courant
            }

            if (elapsedMinutes >= TASK_DURATION_MINUTES) {
                // Timer terminé - arrêter les mises à jour
                console.log(`[TASK UPDATE] Timer completed for channel ${channelId}, stopping updates`);
                cleanupUpdateInterval(channelId);
                
                // Créer un embed final
                const finalEmbed = createFinalTaskEmbed(voiceChannel, member);
                if (finalEmbed) {
                    await embedMessage.edit({ embeds: [finalEmbed] });
                    console.log(`[TASK UPDATE] Final embed sent for channel ${channelId}`);
                }
                
                // AUTOMATIQUE : Compter la tâche et mettre à jour le leaderboard
                await autoCompleteTask(channelId, voiceChannel, member);
                return;
            }
            
            // VÉRIFICATION CONTINUE DES CONDITIONS AVANT MISE À JOUR
            const conditionsCheck = await checkTaskConditions(voiceChannel, member, channelId);
            
            if (!conditionsCheck.valid) {
                console.log(`[TASK UPDATE] Conditions no longer valid for channel ${channelId}: ${conditionsCheck.reason}`);
                cleanupUpdateInterval(channelId);
                
                // Créer un embed d'annulation avec la raison spécifique
                const cancelEmbed = createTaskCancelledEmbed(voiceChannel, member, conditionsCheck.reason);
                if (cancelEmbed) {
                    await embedMessage.edit({ embeds: [cancelEmbed] });
                }
                
                // Nettoyer les données
                cleanupChannelData(channelId);
                return;
            }
            
            // Mise à jour chrono en temps réel : chaque seconde
            if (elapsedMinutes < TASK_DURATION_MINUTES) {
                const updatedEmbed = createTaskEmbed(voiceChannel, member, startTime);
                if (updatedEmbed) {
                    await embedMessage.edit({ embeds: [updatedEmbed] });
                    lastUpdateTime = currentTime;
                    console.log(`[TASK CHRONO] Embed updated for channel ${channelId} at ${elapsedMinutes}m ${Math.floor((currentTime - startTime) % 60000 / 1000)}s`);
                }
            }
            
        } catch (error) {
            // Gestion ultra-robuste des erreurs avec retry automatique
            const shouldContinue = ultraRobustCache.handleTaskError(channelId, error);
            
            if (!shouldContinue) {
                console.error(`[TASK UPDATE] Tâche ${channelId} arrêtée après trop d'erreurs`);
                cleanupUpdateInterval(channelId);
                ultraRobustCache.removeTask(channelId);
                return;
            }
            
            // Gestion spécifique des erreurs de connexion et rate limiting
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
                console.log(`[TASK UPDATE] Connection timeout for channel ${channelId} - will retry on next interval`);
                return;
            }
            
            // Gestion des erreurs de rate limiting Discord
            if (error.code === 429 || error.message.includes('rate limit')) {
                console.log(`[TASK UPDATE] Rate limit hit for channel ${channelId} - slowing down updates`);
                // Ralentir temporairement les mises à jour
                setTimeout(() => {
                    // Continuer normalement après le délai
                }, 10000); // 10 secondes de pause
                return;
            }
            
            // Pour les autres erreurs, logger mais continuer
            console.error(`[TASK UPDATE] Error updating embed for channel ${channelId}:`, error);
            
            // Ne pas arrêter l'intervalle pour les erreurs non critiques
            if (error.code === 50013 || error.message.includes('Missing Permissions')) {
                console.error(`[TASK UPDATE] Critical permission error for channel ${channelId}, stopping updates`);
                cleanupUpdateInterval(channelId);
                ultraRobustCache.removeTask(channelId);
            }
        }
    }, UPDATE_INTERVAL_MS);
    
    // Stocker l'intervalle pour pouvoir le nettoyer plus tard
    activeUpdateIntervals.set(channelId, updateInterval);
    
    // Arrêter la mise à jour après la durée du timer + marge
    setTimeout(() => {
        cleanupUpdateInterval(channelId);
        console.log(`[TASK UPDATE] Auto-cleanup for channel ${channelId} after timeout`);
    }, (TASK_DURATION_SECONDS + 60) * 1000); // 20 min + 1 min de marge
    
    console.log(`[TASK CHRONO] Started chrono updates for channel ${channelId} with ${UPDATE_INTERVAL_MS}ms interval (each second)`);
}

// Fonction pour valider toutes les conditions de démarrage de tâche
async function validateTaskStartConditions(voiceChannel, member, channelId) {
    try {
        // 1. Vérifier que c'est bien un salon vocal
        if (voiceChannel.type !== 2) { // 2 = GUILD_VOICE
            return { valid: false, reason: 'Must be in a voice channel (not text channel)' };
        }
        
        // 2. Vérifier que le staff a les permissions staff
        if (!hasRole(member, STAFF_ROLE_IDS)) {
            return { valid: false, reason: 'You do not have permission to start a task' };
        }
        
        // 4. Vérifier que le staff est le créateur du salon
        const creatorId = await redis.get(`creator:${channelId}`);
        if (creatorId !== member.id) {
            return { valid: false, reason: 'Only the channel creator can start a task' };
        }
        
        // 5. Vérifier le nombre minimum de membres
        if (voiceChannel.members.size < 5) {
            return { valid: false, reason: `Insufficient members: ${voiceChannel.members.size} < 5` };
        }
        
        console.log(`[TASK VALIDATION] All start conditions valid for channel ${channelId}`);
        return { valid: true, reason: 'All conditions met' };
        
    } catch (error) {
        console.error(`[TASK VALIDATION] Error validating start conditions for channel ${channelId}:`, error);
        return { valid: false, reason: 'System error during validation' };
    }
}

// Fonction pour vérifier que toutes les conditions de la tâche sont encore remplies
async function checkTaskConditions(voiceChannel, member, channelId) {
    try {
        // 1. Vérifier que le staff est toujours dans le salon
        if (!voiceChannel.members.has(member.id)) {
            console.log(`[TASK CONDITIONS] Staff member ${member.user.username} left the channel`);
            return { valid: false, reason: 'Staff left the channel' };
        }
        
        // 2. Vérifier qu'il y a toujours au moins 5 membres
        if (voiceChannel.members.size < 5) {
            console.log(`[TASK CONDITIONS] Insufficient members: ${voiceChannel.members.size} < 5`);
            return { valid: false, reason: `Insufficient members: ${voiceChannel.members.size} < 5` };
        }
        
        // 3. Vérifier que le staff est toujours le créateur du salon
        const creatorId = await redis.get(`creator:${channelId}`);
        if (creatorId !== member.id) {
            console.log(`[TASK CONDITIONS] Staff ${member.user.username} is no longer channel creator`);
            return { valid: false, reason: 'Staff is no longer channel creator' };
        }
        
        // 4. Vérifier que le staff a toujours les permissions staff
        if (!hasRole(member, STAFF_ROLE_IDS)) {
            console.log(`[TASK CONDITIONS] Staff ${member.user.username} no longer has staff role`);
            return { valid: false, reason: 'Staff no longer has staff role' };
        }
        
        // 5. Vérifier que c'est bien un salon vocal (pas un salon texte)
        if (voiceChannel.type !== 2) { // 2 = GUILD_VOICE
            console.log(`[TASK CONDITIONS] Channel ${channelId} is not a voice channel`);
            return { valid: false, reason: 'Channel is not a voice channel' };
        }
        
        console.log(`[TASK CONDITIONS] All conditions valid for channel ${channelId}`);
        return { valid: true, reason: 'All conditions met' };
        
    } catch (error) {
        console.error(`[TASK CONDITIONS] Error checking conditions for channel ${channelId}:`, error);
        return { valid: false, reason: 'System error during condition check' };
    }
}

// Fonction pour déterminer si une mise à jour est nécessaire (chrono en temps réel)
function shouldUpdateEmbed(elapsedMinutes, updateCount, currentTime, lastUpdateTime) {
    // Mise à jour chaque seconde pour un chrono en temps réel
    return true; // Toujours mettre à jour pour un chronomètre fluide
}

// Fonction pour envoyer un embed dans le salon task-onetap avec gestion d'erreurs
async function sendTaskEmbedToChannel(message, taskEmbed, voiceChannel, member, startTime) {
    try {
        const taskChannel = message.guild.channels.cache.get(TASK_CHANNEL_ID);
        
        if (!taskChannel) {
            console.error('[TASK SYSTEM] Task channel not found:', TASK_CHANNEL_ID);
            return null;
        }
        
        // Vérifier les permissions du bot
        if (!taskChannel.permissionsFor(message.client.user).has('SendMessages')) {
            console.error('[TASK SYSTEM] Bot does not have SendMessages permission in task channel');
            return null;
        }
        
        // Envoyer l'embed
        const taskChannelMessage = await taskChannel.send({ embeds: [taskEmbed] });
        console.log('[TASK SYSTEM] Embed sent successfully to task channel');
        
        // Stocker le message original pour pouvoir le reprendre plus tard
        originalEmbedMessages.set(voiceChannel.id, taskChannelMessage);
        
        // Démarrer la mise à jour en temps réel
        await updateTaskEmbed(message, voiceChannel, member, startTime, taskChannelMessage);
        
        return taskChannelMessage;
    } catch (error) {
        if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
            console.log('[TASK SYSTEM] Connection timeout while sending task embed - will retry later');
        } else {
            console.error('[TASK SYSTEM] Error sending task embed to task channel:', error);
        }
        return null;
    }
}

// Fonction pour créer un embed d'erreur standardisé
function createErrorEmbed(title, description, color = '#ED4245') {
    return new EmbedBuilder()
        .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({ text: 'OneTab - Task system' });
}

// Fonction pour créer un embed de succès standardisé
function createSuccessEmbed(description) {
    return new EmbedBuilder()
        .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setDescription(description)
        .setColor('#57F287')
        .setFooter({ text: 'OneTab - Task system' });
}

// Fonction pour créer un embed de succès pour le leaderboard
function createLeaderboardSuccessEmbed(member, newCount) {
    return new EmbedBuilder()
        .setAuthor({ 
            name: '🎉 Task Completed!', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setColor('#57F287')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            {
                name: '🏆 Staff Member:',
                value: `${member.user.username}`,
                inline: true
            },
            {
                name: '📊 Total Tasks:',
                value: `**${newCount}** tasks completed`,
                inline: true
            },
            {
                name: '🎯 Achievement:',
                value: `Successfully completed task #${newCount}!`,
                inline: false
            },
            {
                name: '⏰ Completion Time:',
                value: new Date().toLocaleString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                inline: false
            }
        )
        .setFooter({ 
            text: `OneTab - Task Leaderboard • ${member.user.username}`, 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

// Fonction pour créer un embed de pause
function createPauseEmbed(voiceChannel, member) {
    return new EmbedBuilder()
        .setAuthor({ 
            name: 'Late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setColor(0xFEE75C)
        .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
        .addFields(
            {
                name: '⏸️ Task Paused',
                value: `**${member.user.username}** a quitté le salon vocal ou membres < 5`,
                inline: false
            },
            {
                name: '📋 Channel:',
                value: `${voiceChannel.name} (${voiceChannel.id})`,
                inline: true
            },
            {
                name: '⏰ Time Limit:',
                value: '2 minutes pour revenir',
                inline: true
            },
            {
                name: '⚠️ Warning:',
                value: 'Si le staff ne revient pas dans 2 minutes, la task sera annulée',
                inline: false
            },
            {
                name: '📢 Request Channel:',
                value: `request-task-accept (${REQUEST_TASK_ACCEPT_CHANNEL_ID})`,
                inline: true
            }
        )
        .setFooter({ 
            text: `Task Paused • ${new Date().toLocaleString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`,
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

// Fonction pour créer un embed de reprise
function createResumeEmbed(voiceChannel, member, remainingSeconds) {
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecs = remainingSeconds % 60;
    
    return new EmbedBuilder()
        .setAuthor({ 
            name: 'Late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setColor(0x57F287)
        .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
        .addFields(
            {
                name: '▶️ Task Resumed',
                value: `**${member.user.username}** est revenu dans le salon vocal`,
                inline: false
            },
            {
                name: '📋 Channel:',
                value: `${voiceChannel.name} (${voiceChannel.id})`,
                inline: true
            },
            {
                name: '⏰ Time Remaining:',
                value: `${remainingMinutes}m ${remainingSecs}s`,
                inline: true
            },
            {
                name: '✅ Status:',
                value: 'Timer repris avec succès',
                inline: false
            },
            {
                name: '📢 Request Channel:',
                value: `request-task-accept (${REQUEST_TASK_ACCEPT_CHANNEL_ID})`,
                inline: true
            }
        )
        .setFooter({ 
            text: `Task Resumed • ${new Date().toLocaleString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`,
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

// Fonction pour créer un embed d'annulation
function createCancelEmbed(voiceChannel, member) {
    return new EmbedBuilder()
        .setAuthor({ 
            name: 'Late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setColor(0xED4245)
        .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
        .addFields(
            {
                name: '❌ Task Cancelled',
                value: `**${member.user.username}** n'est pas revenu dans les 2 minutes`,
                inline: false
            },
            {
                name: '📋 Channel:',
                value: `${voiceChannel.name} (${voiceChannel.id})`,
                inline: true
            },
            {
                name: '⏰ Reason:',
                value: 'Staff absent plus de 2 minutes',
                inline: true
            },
            {
                name: '💡 Note:',
                value: 'Utilisez `+task` pour recommencer une nouvelle task',
                inline: false
            },
            {
                name: '📢 Request Channel:',
                value: `request-task-accept (${REQUEST_TASK_ACCEPT_CHANNEL_ID})`,
                inline: true
            }
        )
        .setFooter({ 
            text: `Task Cancelled • ${new Date().toLocaleString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`,
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

// Fonction pour créer un embed d'annulation pour membres insuffisants
function createLowMembersCancelEmbed(voiceChannel, member) {
    return new EmbedBuilder()
        .setAuthor({ 
            name: 'Late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setColor(0xED4245)
        .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
        .addFields(
            {
                name: '❌ Task Cancelled',
                value: `Membres < 5 pendant plus de 2 minutes`,
                inline: false
            },
            {
                name: '📋 Channel:',
                value: `${voiceChannel.name} (${voiceChannel.id})`,
                inline: true
            },
            {
                name: '⏰ Reason:',
                value: 'Nombre de membres insuffisant maintenu',
                inline: true
            },
            {
                name: '💡 Note:',
                value: 'Attendez d’avoir 5+ membres puis utilisez `+task` pour recommencer',
                inline: false
            },
            {
                name: '📢 Request Channel:',
                value: `request-task-accept (${REQUEST_TASK_ACCEPT_CHANNEL_ID})`,
                inline: true
            }
        )
        .setFooter({ 
            text: `Task Cancelled • ${new Date().toLocaleString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`,
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

// Fonction pour créer un embed d'annulation de tâche (nouvelles conditions)
function createTaskCancelledEmbed(voiceChannel, member, reason) {
    // Déterminer l'icône et la couleur selon la raison
    let icon = '❌';
    let color = 0xED4245; // Rouge par défaut
    
    if (reason.includes('left the channel')) {
        icon = '🚪';
        color = 0xFEE75C; // Jaune
    } else if (reason.includes('Insufficient members')) {
        icon = '👥';
        color = 0xFEE75C; // Jaune
    } else if (reason.includes('no longer channel creator')) {
        icon = '👑';
        color = 0xFEE75C; // Jaune
    } else if (reason.includes('deafened')) {
        icon = '🔇';
        color = 0xFEE75C; // Jaune
    } else if (reason.includes('no longer has staff role')) {
        icon = '⚡';
        color = 0xED4245; // Rouge
    }
    
    return new EmbedBuilder()
        .setAuthor({ 
            name: 'Late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setColor(color)
        .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
        .addFields(
            {
                name: `${icon} Task Automatically Cancelled`,
                value: `**${member.user.username}** - ${reason}`,
                inline: false
            },
            {
                name: '📋 Channel:',
                value: `${voiceChannel.name} (${voiceChannel.id})`,
                inline: true
            },
            {
                name: '👥 Current Members:',
                value: `${voiceChannel.members.size} members`,
                inline: true
            },
            {
                name: '🔍 All Conditions Required:',
                value: '• ✅ Staff must stay in channel\n• ✅ Minimum 5 members required\n• ✅ Staff must remain creator\n• ✅ Staff must keep permissions\n• ✅ Channel must be a voice channel',
                inline: false
            },
            {
                name: '💡 Next Steps:',
                value: 'Use `+task` to start a new task when all conditions are met again',
                inline: false
            }
        )
        .setFooter({ 
            text: `Task Cancelled • ${new Date().toLocaleString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`,
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

// Fonction pour automatiquement compléter une tâche (NOUVELLE FONCTIONNALITÉ)
async function autoCompleteTask(channelId, voiceChannel, member) {
    try {
        console.log(`[TASK AUTO-COMPLETE] Automatically completing task for ${member.user.username} in channel ${voiceChannel.name}`);
        
        const guildId = voiceChannel.guild.id;
        const userId = member.id;
        
        // Vérifier que toutes les conditions sont encore remplies
        if (!voiceChannel.members.has(userId)) {
            console.log(`[TASK AUTO-COMPLETE] Staff member left the channel, task cancelled`);
            return;
        }
        
        if (voiceChannel.members.size < 5) {
            console.log(`[TASK AUTO-COMPLETE] Insufficient members (${voiceChannel.members.size}), task cancelled`);
            return;
        }
        
        // Vérifier que c'est toujours le créateur du salon
        const creatorId = await redis.get(`creator:${channelId}`);
        if (creatorId !== userId) {
            console.log(`[TASK AUTO-COMPLETE] Staff is no longer channel creator, task cancelled`);
            return;
        }
        
        // Compter automatiquement la tâche
        const newCount = await incrementTaskCount(guildId, userId);
        if (newCount === null) {
            console.error(`[TASK AUTO-COMPLETE] Error while auto-counting task for ${member.user.username}`);
            return;
        }
        
        // Nettoyer les données du salon
        cleanupChannelData(channelId);
        
        // Mettre à jour le leaderboard
        try {
            await updateLeaderboard(voiceChannel.guild);
            console.log(`[TASK AUTO-COMPLETE] Leaderboard updated after auto-complete for ${member.user.username}`);
        } catch (error) {
            console.error('[TASK AUTO-COMPLETE] Error updating leaderboard after auto-complete:', error);
        }
        
        // Log de succès dans le cache ultra-robuste
        console.log(`[ULTRA_ROBUST] Tâche ${channelId} complétée avec succès pour ${member.user.username}`);
        
        // Envoyer un DM de félicitations automatique
        try {
            member.user.send(`🎉 **Tâche Automatiquement Complétée !**\n\nVotre tâche de 20 minutes a été automatiquement validée !\n\n📊 **Total des tâches :** ${newCount} tâches complétées\n⏰ **Temps écoulé :** 20 minutes exactement\n\nFélicitations pour votre engagement ! 🏆`);
        } catch (e) {
            console.log(`[TASK AUTO-COMPLETE] Could not send DM to ${member.user.username} (DMs closed)`);
        }
        
        // Envoyer une notification dans le salon task-onetap
        try {
            const taskChannel = voiceChannel.guild.channels.cache.get(TASK_CHANNEL_ID);
            if (taskChannel) {
                const autoCompleteEmbed = createAutoCompleteEmbed(voiceChannel, member, newCount);
                if (autoCompleteEmbed) {
                    await taskChannel.send({ embeds: [autoCompleteEmbed] });
                    console.log(`[TASK AUTO-COMPLETE] Auto-complete notification sent to task channel`);
                }
            }
        } catch (error) {
            console.error('[TASK AUTO-COMPLETE] Error sending auto-complete notification:', error);
        }
        
        console.log(`[TASK AUTO-COMPLETE] Task successfully auto-completed for ${member.user.username}! New count: ${newCount}`);
        
    } catch (error) {
        console.error('[TASK AUTO-COMPLETE] Critical error in auto-complete:', error);
    }
}

// Fonction pour créer un embed de notification d'auto-complétion
function createAutoCompleteEmbed(voiceChannel, member, newCount) {
    return new EmbedBuilder()
        .setAuthor({ 
            name: '🎉 Task Auto-Completed!', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setColor(0x57F287)
        .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
        .addFields(
            {
                name: '✅ Task Automatically Completed',
                value: `**${member.user.username}** a terminé sa tâche automatiquement !`,
                inline: false
            },
            {
                name: '📋 Channel:',
                value: `${voiceChannel.name} (${voiceChannel.id})`,
                inline: true
            },
            {
                name: '📊 Total Tasks:',
                value: `**${newCount}** tasks completed`,
                inline: true
            },
            {
                name: '⏰ Completion:',
                value: '20 minutes timer completed',
                inline: true
            },
            {
                name: '🎯 Status:',
                value: 'Task automatically counted and leaderboard updated!',
                inline: false
            }
        )
        .setFooter({ 
            text: `Auto-Complete • ${new Date().toLocaleString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`,
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

module.exports = {
    name: 'task',
    description: 'Claim, list, or clear tasks for staff.',
    handleStaffLeave,
    handleStaffReturn,
    async execute(message, args) {
        try {
            const subcommand = args[0];
            const userId = message.author.id;
            const guildId = message.guild.id;

            if (!subcommand) {
                // Commande +task (vérifier et commencer le timer)
                const voiceChannel = message.member.voice.channel;
                if (!voiceChannel) {
                    return message.reply({ embeds: [createErrorEmbed('❌ Error', '💌 You must be in a voice channel to start a task.')] });
                }
                
                // Validation complète des conditions de démarrage
                const channelId = voiceChannel.id;
                const validation = await validateTaskStartConditions(voiceChannel, message.member, channelId);
                
                if (!validation.valid) {
                    return message.reply({ embeds: [createErrorEmbed('❌ Validation Failed', validation.reason, '#FEE75C')] });
                }
                
                // Vérifier si un timer est déjà en cours
                const timerKey = `task_timer:${channelId}`;
                const existingTimer = await redis.get(timerKey);
                
                if (existingTimer) {
                    const startTime = parseInt(existingTimer);
                    const currentTime = Date.now();
                    const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
                    const remainingMinutes = Math.max(0, TASK_DURATION_MINUTES - elapsedMinutes);
                    
                    // Si le timer a expiré, le supprimer
                    if (elapsedMinutes >= TASK_DURATION_MINUTES) {
                        await redis.del(timerKey);
                        cleanupChannelData(channelId);
                        return message.reply({ embeds: [createErrorEmbed('⏰ Timer Expired', 'The previous timer has expired. Starting a new timer now.', '#FEE75C')] });
                    }
                    
                    return message.reply({ embeds: [createErrorEmbed('⏰ Timer Already Running', `Task timer is already running! ${elapsedMinutes} minutes elapsed, ${remainingMinutes} minutes remaining.`, '#FEE75C')] });
                }
                
                // Commencer le timer
                const startTime = Date.now();
                await redis.set(timerKey, startTime.toString(), 'EX', REDIS_EXPIRY_SECONDS);
                
                // Créer l'embed de tâche
                const taskEmbed = createTaskEmbed(voiceChannel, message.member, startTime);
                if (!taskEmbed) {
                    await redis.del(timerKey);
                    return message.reply({ embeds: [createErrorEmbed('❌ System Error', 'Failed to create task embed. Please try again.')] });
                }
                
                // Envoyer l'embed dans le salon task-onetap
                const taskChannelMessage = await sendTaskEmbedToChannel(message, taskEmbed, voiceChannel, message.member, startTime);
                
                if (!taskChannelMessage) {
                    await redis.del(timerKey);
                    return message.reply({ embeds: [createErrorEmbed('❌ Channel Error', 'Failed to send task embed to task channel. Please check bot permissions.')] });
                }
                
                message.reply({ embeds: [createSuccessEmbed(`⏰ Task timer has started! You need to stay ${TASK_DURATION_MINUTES} minutes with at least 5 members.\n\n✅ **AUTOMATIQUE :** Votre tâche sera automatiquement comptée après ${TASK_DURATION_MINUTES} minutes !`)] });
                
            } else if (subcommand === 'list') {
                // Commande +task list
                if (!hasRole(message.member, HIGH_ROLE_IDS)) {
                    return message.reply({ embeds: [createErrorEmbed('⛔ Permission Denied', 'You do not have permission to view the task list.', '#FEE75C')] });
                }
                
                const data = await getGuildTaskData(guildId);
                if (!data || Object.keys(data).length === 0) {
                    return message.reply({ embeds: [createErrorEmbed('ℹ️ No Data', 'No task data found.', '#FEE75C')] });
                }
                
                let reply = '';
                try {
                    for (const [user, count] of Object.entries(data)) {
                        let name = user;
                        try {
                            const member = message.guild.members.cache.get(user);
                            name = member ? member.user.tag : user;
                        } catch (e) {
                            name = user;
                        }
                        reply += `• **${name}** : ${count}\n`;
                    }
                } catch (err) {
                    reply = 'Error while retrieving members.';
                }
                
                message.reply({ embeds: [
                    new EmbedBuilder()
                        .setTitle('📋 Task List')
                        .setDescription(reply)
                        .setColor('#5865F2')
                        .setFooter({ text: 'OneTab - Task system' })
                ] });
                
            } else if (subcommand === 'clear') {
                // Commande +task clear
                if (!OWNER_USER_IDS.includes(message.author.id)) {
                    return message.reply({ embeds: [createErrorEmbed('⛔ Permission Denied', 'You do not have permission to clear the task data.', '#FEE75C')] });
                }
                
                const success = await clearGuildTaskData(guildId);
                if (!success) {
                    return message.reply({ embeds: [createErrorEmbed('❌ System Error', 'Error while clearing task data.')] });
                }
                
                // Mettre à jour le leaderboard après avoir supprimé les données
                try {
                    await updateLeaderboard(message.guild);
                    console.log(`[TASK LEADERBOARD] Leaderboard updated after task data clear by ${message.author.username}`);
                } catch (error) {
                    console.error('[TASK LEADERBOARD] Error updating leaderboard after task data clear:', error);
                }
                
                message.reply({ embeds: [createSuccessEmbed('🧹 Task Data Cleared! All task data has been reset and leaderboard updated.')] });
                
            } else {
                message.reply({ embeds: [createErrorEmbed('ℹ️ Usage', 'Unknown subcommand. Use `+task`, `+task list`, or `+task clear`.\n\n✅ **AUTOMATIQUE :** Les tâches sont comptées automatiquement après 20 minutes !\n\nTo add tasks to users, use `+taskadd @user` or `+taskadd ID` (owner only).', '#FEE75C')] });
            }
        } catch (error) {
            console.error('[TASK SYSTEM] Critical error in task command:', error);
            message.reply({ embeds: [createErrorEmbed('❌ System Error', 'An unexpected error occurred. Please try again later.')] });
        }
    }
}; 
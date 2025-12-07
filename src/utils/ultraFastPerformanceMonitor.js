// 🚀 MONITORING ULTRA-RAPIDE DES PERFORMANCES
// Surveille les performances en temps réel avec alertes automatiques

class UltraFastPerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.alerts = new Map();
        this.performanceHistory = [];
        this.startTime = Date.now();
        this.operationCount = 0;
        this.errorCount = 0;
        this.redisLatency = [];
        this.channelCreationTimes = [];
        
        // Seuils de performance ULTRA-RAPIDES
        this.thresholds = {
            channelCreation: 200, // 200ms max
            redisLatency: 50, // 50ms max
            errorRate: 0.01, // 1% max
            memoryUsage: 100 * 1024 * 1024, // 100MB max
            cpuUsage: 0.8 // 80% max
        };
        
        this.startMonitoring();
    }
    
    // 🚀 DÉMARRER LE MONITORING
    startMonitoring() {
        console.log('[PERFORMANCE] 🚀 Monitoring ultra-rapide activé');
        
        // Monitoring toutes les 100ms pour la réactivité maximale
        setInterval(() => this.collectMetrics(), 100);
        
        // Rapport de performance toutes les 5 secondes
        setInterval(() => this.generateReport(), 5000);
        
        // Optimisation automatique toutes les 10 secondes
        setInterval(() => this.autoOptimize(), 10000);
    }
    
    // 📊 COLLECTER LES MÉTRIQUES
    collectMetrics() {
        try {
            const currentTime = Date.now();
            
            // Métriques système
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            this.metrics.set('memory', {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external
            });
            
            this.metrics.set('cpu', {
                user: cpuUsage.user,
                system: cpuUsage.system,
                timestamp: currentTime
            });
            
            // Métriques de performance
            this.metrics.set('performance', {
                uptime: currentTime - this.startTime,
                operationCount: this.operationCount,
                errorCount: this.errorCount,
                errorRate: this.errorCount / Math.max(this.operationCount, 1),
                avgChannelCreationTime: this.calculateAverage(this.channelCreationTimes),
                avgRedisLatency: this.calculateAverage(this.redisLatency)
            });
            
            // Vérifier les seuils et déclencher des alertes
            this.checkThresholds();
            
        } catch (error) {
            console.error('[PERFORMANCE] Erreur collecte métriques:', error.message);
        }
    }
    
    // 🚨 VÉRIFIER LES SEUILS
    checkThresholds() {
        const performance = this.metrics.get('performance');
        const memory = this.metrics.get('memory');
        
        // Vérifier le temps de création des salons
        if (performance.avgChannelCreationTime > this.thresholds.channelCreation) {
            this.triggerAlert('SLOW_CHANNEL_CREATION', {
                current: performance.avgChannelCreationTime,
                threshold: this.thresholds.channelCreation,
                message: 'Création de salons trop lente'
            });
        }
        
        // Vérifier la latence Redis
        if (performance.avgRedisLatency > this.thresholds.redisLatency) {
            this.triggerAlert('HIGH_REDIS_LATENCY', {
                current: performance.avgRedisLatency,
                threshold: this.thresholds.redisLatency,
                message: 'Latence Redis trop élevée'
            });
        }
        
        // Vérifier le taux d'erreur
        if (performance.errorRate > this.thresholds.errorRate) {
            this.triggerAlert('HIGH_ERROR_RATE', {
                current: performance.errorRate,
                threshold: this.thresholds.errorRate,
                message: 'Taux d\'erreur trop élevé'
            });
        }
        
        // Vérifier l'utilisation mémoire
        if (memory.heapUsed > this.thresholds.memoryUsage) {
            this.triggerAlert('HIGH_MEMORY_USAGE', {
                current: memory.heapUsed,
                threshold: this.thresholds.memoryUsage,
                message: 'Utilisation mémoire trop élevée'
            });
        }
    }
    
    // 🚨 DÉCLENCHER UNE ALERTE
    triggerAlert(type, data) {
        const alertKey = `${type}_${Date.now()}`;
        
        // Éviter les alertes en double
        if (this.alerts.has(type)) {
            const lastAlert = this.alerts.get(type);
            if (Date.now() - lastAlert.timestamp < 30000) { // 30s entre alertes
                return;
            }
        }
        
        this.alerts.set(type, {
            timestamp: Date.now(),
            data: data
        });
        
        console.warn(`[PERFORMANCE] 🚨 ALERTE: ${data.message}`, data);
        
        // Actions automatiques selon le type d'alerte
        this.handleAlert(type, data);
    }
    
    // 🛠️ GÉRER LES ALERTES
    handleAlert(type, data) {
        switch (type) {
            case 'SLOW_CHANNEL_CREATION':
                this.optimizeChannelCreation();
                break;
            case 'HIGH_REDIS_LATENCY':
                this.optimizeRedisConnections();
                break;
            case 'HIGH_ERROR_RATE':
                this.triggerErrorRecovery();
                break;
            case 'HIGH_MEMORY_USAGE':
                this.triggerMemoryCleanup();
                break;
        }
    }
    
    // ⚡ OPTIMISER LA CRÉATION DE SALONS
    optimizeChannelCreation() {
        console.log('[PERFORMANCE] ⚡ Optimisation création de salons...');
        
        // Réduire les timeouts
        global.OPERATION_TIMEOUT = Math.max(200, global.OPERATION_TIMEOUT * 0.8);
        global.CHANNEL_CREATION_TIMEOUT = Math.max(100, global.CHANNEL_CREATION_TIMEOUT * 0.8);
        
        // Augmenter la taille des lots
        global.BATCH_CREATION_SIZE = Math.min(200, global.BATCH_CREATION_SIZE * 1.2);
        
        console.log('[PERFORMANCE] ✅ Optimisations appliquées');
    }
    
    // 🔌 OPTIMISER LES CONNEXIONS REDIS
    optimizeRedisConnections() {
        console.log('[PERFORMANCE] 🔌 Optimisation connexions Redis...');
        
        // Augmenter le pool de connexions
        if (global.redisPool && global.redisPool.maxConnections < 500) {
            global.redisPool.maxConnections = Math.min(500, global.redisPool.maxConnections * 1.5);
        }
        
        // Réduire les timeouts Redis
        global.REDIS_TIMEOUT = Math.max(100, global.REDIS_TIMEOUT * 0.8);
        
        console.log('[PERFORMANCE] ✅ Optimisations Redis appliquées');
    }
    
    // 🔄 DÉCLENCHER LA RÉCUPÉRATION D'ERREURS
    triggerErrorRecovery() {
        console.log('[PERFORMANCE] 🔄 Récupération d\'erreurs...');
        
        // Nettoyer les caches
        this.cleanupCaches();
        
        // Redémarrer les connexions défaillantes
        this.restartFailedConnections();
        
        console.log('[PERFORMANCE] ✅ Récupération terminée');
    }
    
    // 🧹 DÉCLENCHER LE NETTOYAGE MÉMOIRE
    triggerMemoryCleanup() {
        console.log('[PERFORMANCE] 🧹 Nettoyage mémoire...');
        
        // Forcer le garbage collection
        if (global.gc) {
            global.gc();
        }
        
        // Nettoyer les caches
        this.cleanupCaches();
        
        // Nettoyer l'historique des performances
        this.performanceHistory = this.performanceHistory.slice(-100);
        
        console.log('[PERFORMANCE] ✅ Nettoyage mémoire terminé');
    }
    
    // 📊 GÉNÉRER UN RAPPORT
    generateReport() {
        const performance = this.metrics.get('performance');
        const memory = this.metrics.get('memory');
        
        const report = {
            timestamp: new Date().toISOString(),
            uptime: Math.floor(performance.uptime / 1000) + 's',
            operations: performance.operationCount,
            errors: performance.errorCount,
            errorRate: (performance.errorRate * 100).toFixed(2) + '%',
            avgChannelCreation: performance.avgChannelCreationTime + 'ms',
            avgRedisLatency: performance.avgRedisLatency + 'ms',
            memoryUsage: Math.floor(memory.heapUsed / 1024 / 1024) + 'MB',
            alerts: this.alerts.size
        };
        
        // Sauvegarder dans l'historique
        this.performanceHistory.push(report);
        
        // Garder seulement les 100 derniers rapports
        if (this.performanceHistory.length > 100) {
            this.performanceHistory = this.performanceHistory.slice(-100);
        }
        
        // Log du rapport toutes les 5 secondes
        console.log('[PERFORMANCE] 📊 Rapport:', report);
    }
    
    // 🔧 OPTIMISATION AUTOMATIQUE
    autoOptimize() {
        const performance = this.metrics.get('performance');
        
        // Optimisation basée sur les métriques
        if (performance.errorRate > 0.05) { // 5% d'erreurs
            this.triggerErrorRecovery();
        }
        
        if (performance.avgChannelCreationTime > 300) { // 300ms
            this.optimizeChannelCreation();
        }
        
        // Nettoyage automatique des anciennes métriques
        this.cleanupOldMetrics();
    }
    
    // 🧹 NETTOYER LES CACHES
    cleanupCaches() {
        // Nettoyer les caches de configuration
        if (global.configCache) {
            const now = Date.now();
            for (const [key, value] of global.configCache.entries()) {
                if (now - value.timestamp > 30000) { // 30s
                    global.configCache.delete(key);
                }
            }
        }
        
        // Nettoyer les caches de rate limiting
        if (global.rateLimitCache) {
            const now = Date.now();
            for (const [key, value] of global.rateLimitCache.entries()) {
                if (now - value.timestamp > 10000) { // 10s
                    global.rateLimitCache.delete(key);
                }
            }
        }
    }
    
    // 🔄 REDÉMARRER LES CONNEXIONS DÉFAILLANTES
    restartFailedConnections() {
        // Redémarrer le pool Redis si nécessaire
        if (global.redisPool) {
            global.redisPool.cleanup();
            global.redisPool.preloadConnections();
        }
    }
    
    // 🧹 NETTOYER LES ANCIENNES MÉTRIQUES
    cleanupOldMetrics() {
        const oneHourAgo = Date.now() - 3600000;
        
        // Nettoyer les métriques anciennes
        for (const [key, value] of this.metrics.entries()) {
            if (value.timestamp && value.timestamp < oneHourAgo) {
                this.metrics.delete(key);
            }
        }
        
        // Nettoyer les alertes anciennes
        for (const [key, value] of this.alerts.entries()) {
            if (Date.now() - value.timestamp > 300000) { // 5 minutes
                this.alerts.delete(key);
            }
        }
    }
    
    // 📈 CALCULER LA MOYENNE
    calculateAverage(array) {
        if (array.length === 0) return 0;
        return Math.round(array.reduce((a, b) => a + b, 0) / array.length);
    }
    
    // 📝 ENREGISTRER UNE OPÉRATION
    recordOperation(type, duration, success = true) {
        this.operationCount++;
        
        if (!success) {
            this.errorCount++;
        }
        
        switch (type) {
            case 'channel_creation':
                this.channelCreationTimes.push(duration);
                // Garder seulement les 100 derniers temps
                if (this.channelCreationTimes.length > 100) {
                    this.channelCreationTimes = this.channelCreationTimes.slice(-100);
                }
                break;
            case 'redis_operation':
                this.redisLatency.push(duration);
                // Garder seulement les 100 dernières latences
                if (this.redisLatency.length > 100) {
                    this.redisLatency = this.redisLatency.slice(-100);
                }
                break;
        }
    }
    
    // 📊 OBTENIR LES STATISTIQUES
    getStats() {
        return {
            metrics: Object.fromEntries(this.metrics),
            alerts: Object.fromEntries(this.alerts),
            performanceHistory: this.performanceHistory.slice(-10), // 10 derniers rapports
            thresholds: this.thresholds
        };
    }
}

// 🚀 EXPORT DU MONITORING
module.exports = {
    UltraFastPerformanceMonitor,
    createPerformanceMonitor: () => new UltraFastPerformanceMonitor()
};

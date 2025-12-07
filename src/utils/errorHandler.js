const fs = require('fs');
const path = require('path');

// Configuration du système de gestion d'erreurs
const ERROR_CONFIG = {
    LOG_DIR: path.join(__dirname, '../logs'),
    MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_LOG_FILES: 5,
    LOG_RETENTION_DAYS: 30,
    ERROR_NOTIFICATION_WEBHOOK: process.env.ERROR_WEBHOOK_URL,
    CRITICAL_ERRORS: [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ECONNRESET',
        'Unexpected token',
        'Cannot read property',
        'Cannot set property',
        'Maximum call stack size exceeded'
    ]
};

// Types d'erreurs
const ERROR_TYPES = {
    CRITICAL: 'CRITICAL',
    WARNING: 'WARNING',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Système de logging avancé
class AdvancedLogger {
    constructor() {
        this.ensureLogDirectory();
        this.logQueue = [];
        this.isProcessing = false;
        this.startPeriodicFlush();
    }

    ensureLogDirectory() {
        try {
            if (!fs.existsSync(ERROR_CONFIG.LOG_DIR)) {
                fs.mkdirSync(ERROR_CONFIG.LOG_DIR, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    getLogFileName(type = 'general') {
        const date = new Date().toISOString().split('T')[0];
        return path.join(ERROR_CONFIG.LOG_DIR, `${type}-${date}.log`);
    }

    async writeLog(level, category, message, error = null, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            category,
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            } : null,
            context,
            processId: process.pid,
            memoryUsage: process.memoryUsage()
        };

        this.logQueue.push(logEntry);

        // Log immédiat pour les erreurs critiques
        if (level === ERROR_TYPES.CRITICAL) {
            await this.flushQueue();
        }

        // Log console pour les erreurs importantes
        if (level === ERROR_TYPES.CRITICAL || level === ERROR_TYPES.WARNING) {
            console.error(`[${level}] [${category}] ${message}`, error || '');
        }
    }

    async flushQueue() {
        if (this.isProcessing || this.logQueue.length === 0) return;

        this.isProcessing = true;
        try {
            const logsToWrite = [...this.logQueue];
            this.logQueue = [];

            const logGroups = {};
            logsToWrite.forEach(log => {
                const category = log.category || 'general';
                if (!logGroups[category]) logGroups[category] = [];
                logGroups[category].push(log);
            });

            for (const [category, logs] of Object.entries(logGroups)) {
                const logFile = this.getLogFileName(category);
                const logContent = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
                
                try {
                    await fs.promises.appendFile(logFile, logContent);
                } catch (error) {
                    console.error('Failed to write log file:', error);
                }
            }
        } catch (error) {
            console.error('Error flushing log queue:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    startPeriodicFlush() {
        setInterval(() => {
            this.flushQueue();
        }, 5000); // Flush toutes les 5 secondes
    }

    async cleanupOldLogs() {
        try {
            const files = await fs.promises.readdir(ERROR_CONFIG.LOG_DIR);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - ERROR_CONFIG.LOG_RETENTION_DAYS);

            for (const file of files) {
                const filePath = path.join(ERROR_CONFIG.LOG_DIR, file);
                const stats = await fs.promises.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.promises.unlink(filePath);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old logs:', error);
        }
    }
}

// Gestionnaire d'erreurs principal
class ErrorHandler {
    constructor() {
        this.logger = new AdvancedLogger();
        this.errorCounts = new Map();
        this.recoveryStrategies = new Map();
        this.setupRecoveryStrategies();
        this.startPeriodicCleanup();
    }

    setupRecoveryStrategies() {
        // Stratégies de récupération pour différents types d'erreurs
        this.recoveryStrategies.set('ECONNREFUSED', {
            action: 'retry',
            maxRetries: 3,
            delay: 5000,
            description: 'Connection refused - will retry'
        });

        this.recoveryStrategies.set('ETIMEDOUT', {
            action: 'retry',
            maxRetries: 3,
            delay: 3000,
            description: 'Connection timeout - will retry'
        });

        this.recoveryStrategies.set('ENOTFOUND', {
            action: 'skip',
            description: 'Resource not found - skipping'
        });

        this.recoveryStrategies.set('ECONNRESET', {
            action: 'retry',
            maxRetries: 2,
            delay: 2000,
            description: 'Connection reset - will retry'
        });
    }

    async handleError(error, context = {}) {
        const errorInfo = this.analyzeError(error);
        const errorKey = `${errorInfo.type}:${errorInfo.code || 'unknown'}`;
        
        // Incrémenter le compteur d'erreurs
        this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

        // Log de l'erreur
        await this.logger.writeLog(
            errorInfo.level,
            context.category || 'general',
            errorInfo.message,
            error,
            {
                ...context,
                errorCount: this.errorCounts.get(errorKey),
                errorKey
            }
        );

        // Appliquer la stratégie de récupération
        const strategy = this.recoveryStrategies.get(errorInfo.code);
        if (strategy) {
            return this.applyRecoveryStrategy(strategy, error, context);
        }

        return { handled: true, action: 'logged' };
    }

    analyzeError(error) {
        const errorMessage = error.message || error.toString();
        const errorCode = error.code || error.errno;

        // Déterminer le niveau de criticité
        let level = ERROR_TYPES.INFO;
        let type = 'UNKNOWN';

        if (ERROR_CONFIG.CRITICAL_ERRORS.some(critical => 
            errorMessage.includes(critical) || (errorCode && errorCode.toString().includes(critical))
        )) {
            level = ERROR_TYPES.CRITICAL;
            type = 'CRITICAL';
        } else if (errorCode) {
            level = ERROR_TYPES.WARNING;
            type = 'SYSTEM';
        }

        return {
            level,
            type,
            code: errorCode,
            message: errorMessage
        };
    }

    async applyRecoveryStrategy(strategy, error, context) {
        switch (strategy.action) {
            case 'retry':
                return this.handleRetry(strategy, error, context);
            case 'skip':
                return { handled: true, action: 'skipped', reason: strategy.description };
            default:
                return { handled: true, action: 'logged' };
        }
    }

    async handleRetry(strategy, error, context) {
        const retryCount = context.retryCount || 0;
        
        if (retryCount >= strategy.maxRetries) {
            await this.logger.writeLog(
                ERROR_TYPES.CRITICAL,
                context.category || 'retry',
                `Max retries exceeded for ${strategy.description}`,
                error,
                { ...context, retryCount }
            );
            return { handled: true, action: 'max_retries_exceeded' };
        }

        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, strategy.delay));

        return {
            handled: false,
            action: 'retry',
            retryCount: retryCount + 1,
            delay: strategy.delay
        };
    }

    // Wrapper pour les fonctions asynchrones
    async wrapAsync(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                await this.handleError(error, context);
                throw error; // Re-throw pour permettre la gestion par l'appelant
            }
        };
    }

    // Wrapper pour les fonctions synchrones
    wrapSync(fn, context = {}) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handleError(error, context);
                throw error;
            }
        };
    }

    // Gestionnaire pour les promesses non gérées
    setupUnhandledRejectionHandler() {
        process.on('unhandledRejection', async (reason, promise) => {
            await this.handleError(reason, {
                category: 'unhandled_rejection',
                promise: promise.toString()
            });
        });

        process.on('uncaughtException', async (error) => {
            await this.handleError(error, {
                category: 'uncaught_exception'
            });
            
            // Pour les erreurs critiques non gérées, on peut choisir de redémarrer
            if (this.analyzeError(error).level === ERROR_TYPES.CRITICAL) {
                console.error('Critical uncaught exception - consider restarting the process');
            }
        });
    }

    startPeriodicCleanup() {
        // Nettoyer les logs anciens toutes les 24 heures
        setInterval(() => {
            this.logger.cleanupOldLogs();
        }, 24 * 60 * 60 * 1000);

        // Réinitialiser les compteurs d'erreurs toutes les heures
        setInterval(() => {
            this.errorCounts.clear();
        }, 60 * 60 * 1000);
    }

    // Méthodes utilitaires
    async logInfo(message, context = {}) {
        await this.logger.writeLog(ERROR_TYPES.INFO, context.category || 'info', message, null, context);
    }

    async logWarning(message, context = {}) {
        await this.logger.writeLog(ERROR_TYPES.WARNING, context.category || 'warning', message, null, context);
    }

    async logDebug(message, context = {}) {
        await this.logger.writeLog(ERROR_TYPES.DEBUG, context.category || 'debug', message, null, context);
    }

    getErrorStats() {
        return {
            totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0),
            errorBreakdown: Object.fromEntries(this.errorCounts),
            logQueueSize: this.logger.logQueue.length
        };
    }
}

// Instance globale du gestionnaire d'erreurs
const errorHandler = new ErrorHandler();

// Configuration des gestionnaires d'erreurs non gérées
errorHandler.setupUnhandledRejectionHandler();

module.exports = {
    errorHandler,
    ERROR_TYPES,
    AdvancedLogger
}; 
const fs = require('fs');
const path = require('path');
const { errorHandler } = require('./errorHandler');

// Configuration centralisée du système
const SYSTEM_CONFIG = {
    // Configuration du bot
    BOT: {
        PREFIX: process.env.BOT_PREFIX || '.v',
        TOKEN: process.env.DISCORD_TOKEN,
        OWNER_IDS: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
        SUPPORT_GUILD_ID: process.env.SUPPORT_GUILD_ID,
        LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID
    },

    // Configuration Redis
    REDIS: {
        URL: process.env.REDIS_URL,
        HOST: process.env.REDIS_HOST || 'localhost',
        PORT: parseInt(process.env.REDIS_PORT) || 6379,
        PASSWORD: process.env.REDIS_PASSWORD,
        DB: parseInt(process.env.REDIS_DB) || 0,
        MAX_RETRIES: 3,
        CONNECT_TIMEOUT: 10000,
        COMMAND_TIMEOUT: 5000
    },

    // Configuration des rôles
    ROLES: {
        STAFF: process.env.STAFF_ROLE_IDS ? process.env.STAFF_ROLE_IDS.split(',') : [],
        HIGH: process.env.HIGH_ROLE_IDS ? process.env.HIGH_ROLE_IDS.split(',') : [],
        OWNER: process.env.OWNER_USER_IDS ? process.env.OWNER_USER_IDS.split(',') : []
    },

    // Configuration des salons
    CHANNELS: {
        TASK: process.env.TASK_CHANNEL_ID || '1401174532798287922',
        LOGS: process.env.LOGS_CHANNEL_ID,
        WELCOME: process.env.WELCOME_CHANNEL_ID
    },

    // Configuration des limites
    LIMITS: {
        RATE_LIMIT_COMMANDS: 5,
        RATE_LIMIT_WINDOW: 60, // secondes
        TASK_DURATION: 20, // minutes
        TASK_VALIDITY_WINDOW: 25, // minutes
        MAX_VOICE_CHANNELS: 50,
        MAX_MEMBERS_PER_CHANNEL: 99
    },

    // Configuration des timeouts
    TIMEOUTS: {
        COMMAND_EXECUTION: 30000, // 30 secondes
        CONNECTION: 15000, // 15 secondes
        LOGIN: 30000, // 30 secondes
        EMBED_UPDATE: 5000 // 5 secondes
    },

    // Configuration des chemins
    PATHS: {
        DATA_DIR: path.join(__dirname, '../data'),
        LOGS_DIR: path.join(__dirname, '../logs'),
        COMMANDS_DIR: path.join(__dirname, '../commands'),
        EVENTS_DIR: path.join(__dirname, '../events'),
        UTILS_DIR: path.join(__dirname, '../utils')
    },

    // Configuration des logs
    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'INFO',
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_FILES: 5,
        RETENTION_DAYS: 30,
        ENABLE_CONSOLE: process.env.LOG_CONSOLE !== 'false',
        ENABLE_FILE: process.env.LOG_FILE !== 'false'
    },

    // Configuration de la sécurité
    SECURITY: {
        ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
        ENABLE_PERMISSION_CHECKS: process.env.ENABLE_PERMISSION_CHECKS !== 'false',
        ENABLE_INPUT_VALIDATION: process.env.ENABLE_INPUT_VALIDATION !== 'false',
        MAX_INPUT_LENGTH: 2000,
        ALLOWED_FILE_TYPES: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        MAX_FILE_SIZE: 8 * 1024 * 1024 // 8MB
    }
};

// Classe de gestion de configuration avec validation
class ConfigManager {
    constructor() {
        this.config = SYSTEM_CONFIG;
        this.validationErrors = [];
        this.validateConfiguration();
    }

    // Validation de la configuration
    validateConfiguration() {
        try {
            // Validation des variables critiques
            if (!this.config.BOT.TOKEN) {
                this.validationErrors.push('DISCORD_TOKEN is required');
            }

            // Redis n'est plus requis - le bot peut fonctionner sans
            // if (!this.config.REDIS.URL && !this.config.REDIS.HOST) {
            //     this.validationErrors.push('REDIS_URL or REDIS_HOST is required');
            // }

            // Validation des IDs Discord
            this.validateDiscordIds();

            // Validation des chemins
            this.validatePaths();

            // Validation des limites
            this.validateLimits();

            if (this.validationErrors.length > 0) {
                errorHandler.logWarning('Configuration validation errors found', {
                    category: 'config_validation',
                    errors: this.validationErrors
                });
            } else {
                errorHandler.logInfo('Configuration validated successfully', {
                    category: 'config_validation'
                });
            }
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'config_validation',
                critical: true
            });
        }
    }

    // Validation des IDs Discord
    validateDiscordIds() {
        const discordIdPattern = /^\d{17,19}$/;
        
        // Validation des IDs de rôles
        this.config.ROLES.STAFF.forEach((id, index) => {
            if (!discordIdPattern.test(id)) {
                this.validationErrors.push(`Invalid STAFF_ROLE_ID at index ${index}: ${id}`);
            }
        });

        this.config.ROLES.HIGH.forEach((id, index) => {
            if (!discordIdPattern.test(id)) {
                this.validationErrors.push(`Invalid HIGH_ROLE_ID at index ${index}: ${id}`);
            }
        });

        this.config.ROLES.OWNER.forEach((id, index) => {
            if (!discordIdPattern.test(id)) {
                this.validationErrors.push(`Invalid OWNER_USER_ID at index ${index}: ${id}`);
            }
        });

        // Validation des IDs de salons
        if (this.config.CHANNELS.TASK && !discordIdPattern.test(this.config.CHANNELS.TASK)) {
            this.validationErrors.push(`Invalid TASK_CHANNEL_ID: ${this.config.CHANNELS.TASK}`);
        }

        if (this.config.CHANNELS.LOGS && !discordIdPattern.test(this.config.CHANNELS.LOGS)) {
            this.validationErrors.push(`Invalid LOGS_CHANNEL_ID: ${this.config.CHANNELS.LOGS}`);
        }
    }

    // Validation des chemins
    validatePaths() {
        Object.entries(this.config.PATHS).forEach(([key, path]) => {
            try {
                // Vérifier si le répertoire existe ou peut être créé
                if (!fs.existsSync(path)) {
                    fs.mkdirSync(path, { recursive: true });
                    errorHandler.logInfo(`Created directory: ${path}`, {
                        category: 'config_validation'
                    });
                }
            } catch (error) {
                this.validationErrors.push(`Cannot create directory for ${key}: ${path}`);
            }
        });
    }

    // Validation des limites
    validateLimits() {
        if (this.config.LIMITS.TASK_DURATION <= 0) {
            this.validationErrors.push('TASK_DURATION must be greater than 0');
        }

        if (this.config.LIMITS.TASK_VALIDITY_WINDOW <= this.config.LIMITS.TASK_DURATION) {
            this.validationErrors.push('TASK_VALIDITY_WINDOW must be greater than TASK_DURATION');
        }

        if (this.config.LIMITS.RATE_LIMIT_COMMANDS <= 0) {
            this.validationErrors.push('RATE_LIMIT_COMMANDS must be greater than 0');
        }

        if (this.config.TIMEOUTS.COMMAND_EXECUTION <= 0) {
            this.validationErrors.push('COMMAND_EXECUTION_TIMEOUT must be greater than 0');
        }
    }

    // Méthodes d'accès sécurisées
    get(key, defaultValue = null) {
        try {
            const keys = key.split('.');
            let value = this.config;
            
            for (const k of keys) {
                if (value && typeof value === 'object' && k in value) {
                    value = value[k];
                } else {
                    return defaultValue;
                }
            }
            
            return value;
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'config_access',
                key
            });
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            const keys = key.split('.');
            const lastKey = keys.pop();
            let current = this.config;
            
            for (const k of keys) {
                if (!(k in current) || typeof current[k] !== 'object') {
                    current[k] = {};
                }
                current = current[k];
            }
            
            current[lastKey] = value;
            
            errorHandler.logInfo(`Configuration updated: ${key} = ${JSON.stringify(value)}`, {
                category: 'config_update'
            });
            
            return true;
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'config_update',
                key,
                value
            });
            return false;
        }
    }

    // Vérification de la validité de la configuration
    isValid() {
        return this.validationErrors.length === 0;
    }

    // Obtenir les erreurs de validation
    getValidationErrors() {
        return [...this.validationErrors];
    }

    // Sauvegarder la configuration
    async saveToFile(filePath = null) {
        try {
            const configPath = filePath || path.join(this.config.PATHS.DATA_DIR, 'config.json');
            
            // Créer une copie de la configuration sans les fonctions
            const configToSave = JSON.parse(JSON.stringify(this.config));
            
            await fs.promises.writeFile(configPath, JSON.stringify(configToSave, null, 2));
            
            errorHandler.logInfo(`Configuration saved to: ${configPath}`, {
                category: 'config_save'
            });
            
            return true;
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'config_save',
                filePath
            });
            return false;
        }
    }

    // Charger la configuration depuis un fichier
    async loadFromFile(filePath = null) {
        try {
            const configPath = filePath || path.join(this.config.PATHS.DATA_DIR, 'config.json');
            
            if (!fs.existsSync(configPath)) {
                errorHandler.logWarning(`Configuration file not found: ${configPath}`, {
                    category: 'config_load'
                });
                return false;
            }
            
            const fileContent = await fs.promises.readFile(configPath, 'utf8');
            const loadedConfig = JSON.parse(fileContent);
            
            // Fusionner avec la configuration par défaut
            this.config = this.mergeConfigs(this.config, loadedConfig);
            
            // Re-valider la configuration
            this.validateConfiguration();
            
            errorHandler.logInfo(`Configuration loaded from: ${configPath}`, {
                category: 'config_load'
            });
            
            return true;
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'config_load',
                filePath
            });
            return false;
        }
    }

    // Fusionner les configurations
    mergeConfigs(defaultConfig, loadedConfig) {
        const merged = { ...defaultConfig };
        
        for (const [key, value] of Object.entries(loadedConfig)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                merged[key] = this.mergeConfigs(merged[key] || {}, value);
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    // Obtenir un résumé de la configuration
    getSummary() {
        return {
            bot: {
                prefix: this.config.BOT.PREFIX,
                hasToken: !!this.config.BOT.TOKEN,
                ownerCount: this.config.BOT.OWNER_IDS.length
            },
            redis: {
                hasUrl: !!this.config.REDIS.URL,
                host: this.config.REDIS.HOST,
                port: this.config.REDIS.PORT
            },
            roles: {
                staffCount: this.config.ROLES.STAFF.length,
                highCount: this.config.ROLES.HIGH.length,
                ownerCount: this.config.ROLES.OWNER.length
            },
            channels: {
                taskChannel: this.config.CHANNELS.TASK,
                hasLogsChannel: !!this.config.CHANNELS.LOGS
            },
            limits: {
                taskDuration: this.config.LIMITS.TASK_DURATION,
                rateLimit: this.config.LIMITS.RATE_LIMIT_COMMANDS
            },
            validation: {
                isValid: this.isValid(),
                errorCount: this.validationErrors.length
            }
        };
    }
}

// Instance globale du gestionnaire de configuration
const configManager = new ConfigManager();

// Configuration par défaut pour les guildes
const DEFAULT_CONFIG = {
    createChannelName: '➕ Créer un salon',
    createChannelId: null,
    tempChannelCategory: null,
    tempChannelCategoryId: null,
    autoDeleteEmpty: true,
    allowRenaming: true,
    defaultUserLimit: 0,
    prefix: process.env.BOT_PREFIX || '.v'
};

// Fonctions pour gérer la configuration des guildes
async function getGuildConfig(guildId) {
    try {
        const { dataManager } = require('./dataManager');
        const guildConfigsPath = path.join(__dirname, '../data/guildConfigs.json');
        const guildConfigs = await dataManager.readJsonFile(guildConfigsPath, {});
        return guildConfigs[guildId] || { ...DEFAULT_CONFIG };
    } catch (error) {
        console.error(`Error getting guild config for ${guildId}:`, error);
        return { ...DEFAULT_CONFIG };
    }
}

async function updateGuildConfig(guildId, newConfig) {
    try {
        const { dataManager } = require('./dataManager');
        const guildConfigsPath = path.join(__dirname, '../data/guildConfigs.json');
        const guildConfigs = await dataManager.readJsonFile(guildConfigsPath, {});
        
        // Fusionner avec la configuration existante
        guildConfigs[guildId] = {
            ...DEFAULT_CONFIG,
            ...guildConfigs[guildId],
            ...newConfig
        };
        
        await dataManager.writeJsonFile(guildConfigsPath, guildConfigs);
        return guildConfigs[guildId];
    } catch (error) {
        console.error(`Error updating guild config for ${guildId}:`, error);
        return { ...DEFAULT_CONFIG, ...newConfig };
    }
}

module.exports = {
    configManager,
    SYSTEM_CONFIG,
    getGuildConfig,
    updateGuildConfig,
    DEFAULT_CONFIG
};
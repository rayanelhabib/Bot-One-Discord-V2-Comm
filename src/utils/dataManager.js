const fs = require('fs');
const path = require('path');
const { errorHandler } = require('./errorHandler');
const { configManager } = require('./configManager');

// Configuration du système de données
const DATA_CONFIG = {
    // Chemins des fichiers de données
    PATHS: {
        TASK_DATA: path.join(__dirname, '../data/taskData.json'),
        PREMIUM_USERS: path.join(__dirname, '../data/premiumUsers.json'),
        GUILD_CONFIGS: path.join(__dirname, '../data/guildConfigs.json'),
        USER_STATS: path.join(__dirname, '../data/userStats.json'),
        SYSTEM_LOGS: path.join(__dirname, '../data/systemLogs.json'),
        BACKUP_DIR: path.join(__dirname, '../data/backups')
    },
    
    // Configuration de sauvegarde
    BACKUP: {
        AUTO_BACKUP: true,
        BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 heures
        MAX_BACKUPS: 7, // Garder 7 jours de sauvegardes
        BACKUP_ON_WRITE: true // Sauvegarde avant chaque écriture
    },
    
    // Configuration de validation
    VALIDATION: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_JSON_DEPTH: 10,
        ALLOWED_DATA_TYPES: ['string', 'number', 'boolean', 'object', 'array']
    },
    
    // Configuration de cache
    CACHE: {
        ENABLED: true,
        TTL: 5 * 60 * 1000, // 5 minutes
        MAX_ENTRIES: 1000
    }
};

// Cache en mémoire pour les données fréquemment accédées
class DataCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.startCleanup();
    }

    set(key, value) {
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now());
        
        // Limiter la taille du cache
        if (this.cache.size > DATA_CONFIG.CACHE.MAX_ENTRIES) {
            const oldestKey = this.timestamps.entries().next().value[0];
            this.cache.delete(oldestKey);
            this.timestamps.delete(oldestKey);
        }
    }

    get(key) {
        const timestamp = this.timestamps.get(key);
        if (!timestamp) return null;
        
        // Vérifier si le cache a expiré
        if (Date.now() - timestamp > DATA_CONFIG.CACHE.TTL) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            return null;
        }
        
        return this.cache.get(key);
    }

    delete(key) {
        this.cache.delete(key);
        this.timestamps.delete(key);
    }

    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }

    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, timestamp] of this.timestamps.entries()) {
                if (now - timestamp > DATA_CONFIG.CACHE.TTL) {
                    this.cache.delete(key);
                    this.timestamps.delete(key);
                }
            }
        }, 60 * 1000); // Nettoyage toutes les minutes
    }
}

// Gestionnaire de données principal
class DataManager {
    constructor() {
        this.cache = new DataCache();
        this.ensureDirectories();
        this.setupAutoBackup();
    }

    // Créer les répertoires nécessaires
    ensureDirectories() {
        try {
            const dataDir = path.dirname(DATA_CONFIG.PATHS.TASK_DATA);
            const backupDir = DATA_CONFIG.PATHS.BACKUP_DIR;
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            errorHandler.logInfo('Data directories ensured', {
                category: 'data_manager',
                dataDir,
                backupDir
            });
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'data_manager',
                operation: 'ensure_directories'
            });
        }
    }

    // Lecture sécurisée d'un fichier JSON
    async readJsonFile(filePath, defaultValue = {}) {
        try {
            // Vérifier le cache d'abord
            const cacheKey = `file:${filePath}`;
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Vérifier si le fichier existe
            if (!fs.existsSync(filePath)) {
                await errorHandler.logInfo(`File not found, creating default: ${filePath}`, {
                    category: 'data_manager',
                    filePath
                });
                
                await this.writeJsonFile(filePath, defaultValue);
                this.cache.set(cacheKey, defaultValue);
                return defaultValue;
            }

            // Lire le fichier
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            
            // Vérifier la taille du fichier
            if (fileContent.length > DATA_CONFIG.VALIDATION.MAX_FILE_SIZE) {
                throw new Error(`File too large: ${filePath}`);
            }

            // Parser le JSON avec gestion d'erreurs de syntaxe
            let data;
            try {
                data = JSON.parse(fileContent);
            } catch (parseError) {
                await errorHandler.handleError(parseError, {
                    category: 'data_manager',
                    operation: 'parse_json',
                    filePath
                });
                
                // Essayer de récupérer depuis une sauvegarde
                const recovered = await this.emergencyRecovery(filePath);
                if (recovered) {
                    return await this.readJsonFile(filePath, defaultValue);
                }
                
                // Si pas de sauvegarde, retourner les données par défaut
                await this.writeJsonFile(filePath, defaultValue);
                this.cache.set(cacheKey, defaultValue);
                return defaultValue;
            }
            
            // Valider la structure
            this.validateDataStructure(data);
            
            // Mettre en cache
            this.cache.set(cacheKey, data);
            
            await errorHandler.logDebug(`File read successfully: ${filePath}`, {
                category: 'data_manager',
                filePath,
                dataSize: JSON.stringify(data).length
            });
            
            return data;
        } catch (error) {
            await errorHandler.handleError(error, {
                category: 'data_manager',
                operation: 'read_json',
                filePath
            });
            
            // Retourner les données par défaut en cas d'erreur
            return defaultValue;
        }
    }

    // Écriture sécurisée d'un fichier JSON
    async writeJsonFile(filePath, data, options = {}) {
        try {
            // Valider les données
            this.validateDataStructure(data);
            
            // Créer une sauvegarde si nécessaire
            if (DATA_CONFIG.BACKUP.BACKUP_ON_WRITE) {
                await this.createBackup(filePath);
            }

            // Préparer les données pour l'écriture
            const jsonString = JSON.stringify(data, null, 2);
            
            // Écrire dans un fichier temporaire d'abord
            const tempPath = `${filePath}.tmp`;
            await fs.promises.writeFile(tempPath, jsonString, 'utf8');
            
            // Déplacer le fichier temporaire vers la destination finale
            await fs.promises.rename(tempPath, filePath);
            
            // Mettre à jour le cache
            const cacheKey = `file:${filePath}`;
            this.cache.set(cacheKey, data);
            
            await errorHandler.logInfo(`File written successfully: ${filePath}`, {
                category: 'data_manager',
                filePath,
                dataSize: jsonString.length
            });
            
            return true;
        } catch (error) {
            await errorHandler.handleError(error, {
                category: 'data_manager',
                operation: 'write_json',
                filePath
            });
            return false;
        }
    }

    // Validation de la structure des données
    validateDataStructure(data, depth = 0) {
        if (depth > DATA_CONFIG.VALIDATION.MAX_JSON_DEPTH) {
            throw new Error('JSON structure too deep');
        }

        if (data === null || data === undefined) {
            return;
        }

        const dataType = Array.isArray(data) ? 'array' : typeof data;
        
        if (!DATA_CONFIG.VALIDATION.ALLOWED_DATA_TYPES.includes(dataType)) {
            throw new Error(`Invalid data type: ${dataType}`);
        }

        if (dataType === 'object' || dataType === 'array') {
            for (const value of Object.values(data)) {
                this.validateDataStructure(value, depth + 1);
            }
        }
    }

    // Créer une sauvegarde
    async createBackup(filePath) {
        try {
            if (!fs.existsSync(filePath)) return;

            const fileName = path.basename(filePath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(DATA_CONFIG.PATHS.BACKUP_DIR, `${fileName}.${timestamp}.backup`);
            
            await fs.promises.copyFile(filePath, backupPath);
            
            errorHandler.logDebug(`Backup created: ${backupPath}`, {
                category: 'data_manager',
                originalFile: filePath,
                backupFile: backupPath
            });
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'data_manager',
                operation: 'create_backup',
                filePath
            });
        }
    }

    // Nettoyer les anciennes sauvegardes
    async cleanupOldBackups() {
        try {
            const files = await fs.promises.readdir(DATA_CONFIG.PATHS.BACKUP_DIR);
            const backupFiles = files.filter(file => file.endsWith('.backup'));
            
            // Trier par date de modification
            const fileStats = await Promise.all(
                backupFiles.map(async (file) => {
                    const filePath = path.join(DATA_CONFIG.PATHS.BACKUP_DIR, file);
                    const stats = await fs.promises.stat(filePath);
                    return { file, filePath, mtime: stats.mtime };
                })
            );
            
            fileStats.sort((a, b) => b.mtime - a.mtime);
            
            // Supprimer les anciennes sauvegardes
            for (let i = DATA_CONFIG.BACKUP.MAX_BACKUPS; i < fileStats.length; i++) {
                await fs.promises.unlink(fileStats[i].filePath);
                errorHandler.logInfo(`Old backup deleted: ${fileStats[i].file}`, {
                    category: 'data_manager',
                    operation: 'cleanup_backups'
                });
            }
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'data_manager',
                operation: 'cleanup_backups'
            });
        }
    }

    // Configuration de la sauvegarde automatique
    setupAutoBackup() {
        if (DATA_CONFIG.BACKUP.AUTO_BACKUP) {
            setInterval(async () => {
                await this.createBackup(DATA_CONFIG.PATHS.TASK_DATA);
                await this.createBackup(DATA_CONFIG.PATHS.PREMIUM_USERS);
                await this.cleanupOldBackups();
            }, DATA_CONFIG.BACKUP.BACKUP_INTERVAL);
        }
    }

    // Méthodes spécifiques pour les données de tâches
    async getTaskData(guildId) {
        const data = await this.readJsonFile(DATA_CONFIG.PATHS.TASK_DATA, {});
        return data[guildId] || {};
    }

    async setTaskData(guildId, taskData) {
        const data = await this.readJsonFile(DATA_CONFIG.PATHS.TASK_DATA, {});
        data[guildId] = taskData;
        return await this.writeJsonFile(DATA_CONFIG.PATHS.TASK_DATA, data);
    }

    async updateUserTaskCount(guildId, userId, increment = 1) {
        const guildData = await this.getTaskData(guildId);
        guildData[userId] = (guildData[userId] || 0) + increment;
        return await this.setTaskData(guildId, guildData);
    }

    async getUserTaskCount(guildId, userId) {
        const guildData = await this.getTaskData(guildId);
        return guildData[userId] || 0;
    }

    // Méthodes pour les utilisateurs premium
    async getPremiumUsers() {
        return await this.readJsonFile(DATA_CONFIG.PATHS.PREMIUM_USERS, {
            guilds: {},
            metadata: {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                totalUsers: 0,
                totalGuilds: 0
            }
        });
    }

    async setPremiumUsers(data) {
        return await this.writeJsonFile(DATA_CONFIG.PATHS.PREMIUM_USERS, data);
    }

    async addPremiumUser(guildId, userId) {
        const data = await this.getPremiumUsers();
        
        if (!data.guilds[guildId]) {
            data.guilds[guildId] = [];
        }
        
        if (!data.guilds[guildId].includes(userId)) {
            data.guilds[guildId].push(userId);
            data.metadata.totalUsers = Object.values(data.guilds).flat().length;
            data.metadata.totalGuilds = Object.keys(data.guilds).length;
            data.metadata.lastUpdated = new Date().toISOString();
        }
        
        return await this.setPremiumUsers(data);
    }

    async removePremiumUser(guildId, userId) {
        const data = await this.getPremiumUsers();
        
        if (data.guilds[guildId]) {
            data.guilds[guildId] = data.guilds[guildId].filter(id => id !== userId);
            
            if (data.guilds[guildId].length === 0) {
                delete data.guilds[guildId];
            }
            
            data.metadata.totalUsers = Object.values(data.guilds).flat().length;
            data.metadata.totalGuilds = Object.keys(data.guilds).length;
            data.metadata.lastUpdated = new Date().toISOString();
        }
        
        return await this.setPremiumUsers(data);
    }

    async isPremiumUser(guildId, userId) {
        const data = await this.getPremiumUsers();
        return data.guilds[guildId]?.includes(userId) || false;
    }

    // Méthodes pour les statistiques système
    async getSystemStats() {
        try {
            const stats = {
                taskData: {
                    fileSize: fs.existsSync(DATA_CONFIG.PATHS.TASK_DATA) ? 
                        fs.statSync(DATA_CONFIG.PATHS.TASK_DATA).size : 0,
                    guildCount: 0,
                    userCount: 0
                },
                premiumUsers: {
                    fileSize: fs.existsSync(DATA_CONFIG.PATHS.PREMIUM_USERS) ? 
                        fs.statSync(DATA_CONFIG.PATHS.PREMIUM_USERS).size : 0,
                    guildCount: 0,
                    userCount: 0
                },
                cache: {
                    size: this.cache.cache.size,
                    hitRate: 0
                },
                backups: {
                    count: 0,
                    totalSize: 0
                }
            };

            // Compter les guildes et utilisateurs
            const taskData = await this.getTaskData();
            stats.taskData.guildCount = Object.keys(taskData).length;
            stats.taskData.userCount = Object.values(taskData).reduce((sum, guild) => 
                sum + Object.keys(guild).length, 0);

            const premiumData = await this.getPremiumUsers();
            stats.premiumUsers.guildCount = Object.keys(premiumData.guilds).length;
            stats.premiumUsers.userCount = Object.values(premiumData.guilds).flat().length;

            // Compter les sauvegardes
            if (fs.existsSync(DATA_CONFIG.PATHS.BACKUP_DIR)) {
                const backupFiles = fs.readdirSync(DATA_CONFIG.PATHS.BACKUP_DIR)
                    .filter(file => file.endsWith('.backup'));
                stats.backups.count = backupFiles.length;
                stats.backups.totalSize = backupFiles.reduce((sum, file) => 
                    sum + fs.statSync(path.join(DATA_CONFIG.PATHS.BACKUP_DIR, file)).size, 0);
            }

            return stats;
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'data_manager',
                operation: 'get_system_stats'
            });
            return null;
        }
    }

    // Méthode de récupération d'urgence
    async emergencyRecovery(filePath) {
        try {
            const backupDir = DATA_CONFIG.PATHS.BACKUP_DIR;
            const fileName = path.basename(filePath);
            const backupFiles = fs.readdirSync(backupDir)
                .filter(file => file.startsWith(fileName) && file.endsWith('.backup'))
                .sort()
                .reverse();

            if (backupFiles.length === 0) {
                throw new Error('No backup files found');
            }

            const latestBackup = path.join(backupDir, backupFiles[0]);
            await fs.promises.copyFile(latestBackup, filePath);
            
            // Vider le cache pour forcer une relecture
            this.cache.delete(`file:${filePath}`);
            
            errorHandler.logWarning(`Emergency recovery completed: ${filePath}`, {
                category: 'data_manager',
                operation: 'emergency_recovery',
                filePath,
                backupFile: latestBackup
            });
            
            return true;
        } catch (error) {
            errorHandler.handleError(error, {
                category: 'data_manager',
                operation: 'emergency_recovery',
                filePath
            });
            return false;
        }
    }
}

// Instance globale du gestionnaire de données
const dataManager = new DataManager();

module.exports = {
    dataManager,
    DATA_CONFIG
}; 
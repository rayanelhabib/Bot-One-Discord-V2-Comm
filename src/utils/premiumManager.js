const { redis, redisEnabled } = require('../redisClient');
const fs = require('fs').promises;
const path = require('path');

class PremiumManager {
  constructor() {
    this.jsonPath = path.join(__dirname, '../data/premiumUsers.json');
    this.cache = new Map(); // Cache en mémoire pour les performances
    this.lastSave = 0;
    this.saveInterval = 30000; // Sauvegarde toutes les 30 secondes
  }

  // Charger les données depuis JSON
  async loadFromJSON() {
    try {
      const data = await fs.readFile(this.jsonPath, 'utf8');
      const jsonData = JSON.parse(data);
      
      // Synchroniser avec Redis seulement si disponible
      if (redisEnabled && redis) {
        for (const [guildId, users] of Object.entries(jsonData.guilds || {})) {
          if (users && users.length > 0) {
            try {
              await redis.sadd(`premium_users:${guildId}`, ...users);
            } catch (redisError) {
              console.log('[PREMIUM] Redis sync failed, continuing with cache only:', redisError.message);
            }
            this.cache.set(guildId, new Set(users));
          }
        }
        console.log('[PREMIUM] Data loaded from JSON and synchronized with Redis');
      } else {
        // Si Redis n'est pas disponible, charger seulement dans le cache
        for (const [guildId, users] of Object.entries(jsonData.guilds || {})) {
          if (users && users.length > 0) {
            this.cache.set(guildId, new Set(users));
          }
        }
        console.log('[PREMIUM] Data loaded from JSON (Redis not available, using cache only)');
      }
      
      return jsonData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Fichier n'existe pas, créer la structure par défaut
        await this.saveToJSON();
        console.log('[PREMIUM] Created new premium users file');
        return { guilds: {}, metadata: { version: "1.0", lastUpdated: new Date().toISOString(), totalUsers: 0, totalGuilds: 0 } };
      }
      console.error('[PREMIUM] Error loading from JSON:', error);
      return { guilds: {}, metadata: { version: "1.0", lastUpdated: new Date().toISOString(), totalUsers: 0, totalGuilds: 0 } };
    }
  }

  // Sauvegarder les données vers JSON
  async saveToJSON() {
    try {
      const data = { guilds: {}, metadata: {} };
      let totalUsers = 0;
      let totalGuilds = 0;

      if (redisEnabled && redis) {
        // Récupérer toutes les clés premium de Redis
        try {
          const keys = await redis.keys('premium_users:*');
          
          for (const key of keys) {
            const guildId = key.replace('premium_users:', '');
            const users = await redis.smembers(key);
            
            if (users && users.length > 0) {
              data.guilds[guildId] = users;
              totalUsers += users.length;
              totalGuilds++;
              
              // Mettre à jour le cache
              this.cache.set(guildId, new Set(users));
            }
          }
        } catch (redisError) {
          console.log('[PREMIUM] Redis read failed, saving from cache only:', redisError.message);
        }
      }

      // Si Redis n'est pas disponible ou a échoué, sauvegarder depuis le cache
      if (totalGuilds === 0) {
        for (const [guildId, users] of this.cache.entries()) {
          if (users && users.size > 0) {
            data.guilds[guildId] = Array.from(users);
            totalUsers += users.size;
            totalGuilds++;
          }
        }
      }

      // Mettre à jour les métadonnées
      data.metadata = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        totalUsers,
        totalGuilds
      };

      // Sauvegarder avec formatage
      await fs.writeFile(this.jsonPath, JSON.stringify(data, null, 2));
      this.lastSave = Date.now();
      
      console.log(`[PREMIUM] Saved ${totalUsers} premium users across ${totalGuilds} guilds`);
    } catch (error) {
      console.error('[PREMIUM] Error saving to JSON:', error);
    }
  }

  // Vérifier si un utilisateur a l'accès premium
  async hasPremiumAccess(guildId, userId) {
    // Vérifier d'abord le cache
    const cachedUsers = this.cache.get(guildId);
    if (cachedUsers && cachedUsers.has(userId)) {
      return true;
    }

    // Vérifier Redis seulement si disponible
    if (redisEnabled && redis) {
      try {
        const hasAccess = await redis.sismember(`premium_users:${guildId}`, userId);
        
        // Mettre à jour le cache si nécessaire
        if (hasAccess) {
          if (!this.cache.has(guildId)) {
            this.cache.set(guildId, new Set());
          }
          this.cache.get(guildId).add(userId);
        }
        
        return hasAccess;
      } catch (redisError) {
        console.log('[PREMIUM] Redis check failed, using cache only:', redisError.message);
        return false;
      }
    }
    
    // Si Redis n'est pas disponible, retourner false
    return false;
  }

  // Ajouter un utilisateur premium
  async addPremiumUser(guildId, userId) {
    try {
      // Ajouter à Redis seulement si disponible
      if (redisEnabled && redis) {
        try {
          await redis.sadd(`premium_users:${guildId}`, userId);
        } catch (redisError) {
          console.log('[PREMIUM] Redis add failed, continuing with cache only:', redisError.message);
        }
      }
      
      // Mettre à jour le cache
      if (!this.cache.has(guildId)) {
        this.cache.set(guildId, new Set());
      }
      this.cache.get(guildId).add(userId);
      
      // Sauvegarder si nécessaire
      await this.autoSave();
      
      console.log(`[PREMIUM] Added premium access for user ${userId} in guild ${guildId}`);
      return true;
    } catch (error) {
      console.error('[PREMIUM] Error adding premium user:', error);
      return false;
    }
  }

  // Retirer un utilisateur premium
  async removePremiumUser(guildId, userId) {
    try {
      // Retirer de Redis seulement si disponible
      if (redisEnabled && redis) {
        try {
          await redis.srem(`premium_users:${guildId}`, userId);
        } catch (redisError) {
          console.log('[PREMIUM] Redis remove failed, continuing with cache only:', redisError.message);
        }
      }
      
      // Mettre à jour le cache
      const cachedUsers = this.cache.get(guildId);
      if (cachedUsers) {
        cachedUsers.delete(userId);
        if (cachedUsers.size === 0) {
          this.cache.delete(guildId);
        }
      }
      
      // Sauvegarder si nécessaire
      await this.autoSave();
      
      console.log(`[PREMIUM] Removed premium access for user ${userId} in guild ${guildId}`);
      return true;
    } catch (error) {
      console.error('[PREMIUM] Error removing premium user:', error);
      return false;
    }
  }

  // Obtenir tous les utilisateurs premium d'un serveur
  async getPremiumUsers(guildId) {
    // Vérifier d'abord le cache
    const cachedUsers = this.cache.get(guildId);
    if (cachedUsers) {
      return Array.from(cachedUsers);
    }

    // Récupérer depuis Redis seulement si disponible
    if (redisEnabled && redis) {
      try {
        const users = await redis.smembers(`premium_users:${guildId}`);
        
        // Mettre à jour le cache
        if (users && users.length > 0) {
          this.cache.set(guildId, new Set(users));
        }
        
        return users;
      } catch (redisError) {
        console.log('[PREMIUM] Redis get failed, returning empty array:', redisError.message);
        return [];
      }
    }
    
    // Si Redis n'est pas disponible, retourner un tableau vide
    return [];
  }

  // Obtenir tous les serveurs avec des utilisateurs premium
  async getAllPremiumGuilds() {
    if (redisEnabled && redis) {
      try {
        const keys = await redis.keys('premium_users:*');
        return keys.map(key => key.replace('premium_users:', ''));
      } catch (redisError) {
        console.log('[PREMIUM] Redis keys failed, returning from cache:', redisError.message);
      }
    }
    
    // Si Redis n'est pas disponible, retourner depuis le cache
    return Array.from(this.cache.keys());
  }

  // Sauvegarde automatique (avec throttling)
  async autoSave() {
    const now = Date.now();
    if (now - this.lastSave > this.saveInterval) {
      await this.saveToJSON();
    }
  }

  // Sauvegarde forcée
  async forceSave() {
    await this.saveToJSON();
  }

  // Restaurer depuis JSON (en cas de problème Redis)
  async restoreFromJSON() {
    try {
      const data = await fs.readFile(this.jsonPath, 'utf8');
      const jsonData = JSON.parse(data);
      
      // Vider Redis seulement si disponible
      if (redisEnabled && redis) {
        try {
          const keys = await redis.keys('premium_users:*');
          if (keys.length > 0) {
            await redis.del(...keys);
          }
          
          // Restaurer depuis JSON vers Redis
          for (const [guildId, users] of Object.entries(jsonData.guilds || {})) {
            if (users && users.length > 0) {
              await redis.sadd(`premium_users:${guildId}`, ...users);
            }
          }
        } catch (redisError) {
          console.log('[PREMIUM] Redis restore failed, continuing with cache only:', redisError.message);
        }
      }
      
      // Toujours restaurer dans le cache
      for (const [guildId, users] of Object.entries(jsonData.guilds || {})) {
        if (users && users.length > 0) {
          this.cache.set(guildId, new Set(users));
        }
      }
      
      console.log('[PREMIUM] Successfully restored from JSON');
      return true;
    } catch (error) {
      console.error('[PREMIUM] Error restoring from JSON:', error);
      return false;
    }
  }

  // Obtenir les statistiques
  async getStats() {
    try {
      const data = await fs.readFile(this.jsonPath, 'utf8');
      const jsonData = JSON.parse(data);
      return jsonData.metadata;
    } catch (error) {
      return { totalUsers: 0, totalGuilds: 0, lastUpdated: 'Never' };
    }
  }
}

// Instance singleton
const premiumManager = new PremiumManager();

module.exports = premiumManager; 
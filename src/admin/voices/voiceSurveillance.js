const { VoiceState } = require('discord.js');

/**
 * Système de surveillance vocale pour le bot
 * Permet au bot de rejoindre et rester dans des salons vocaux spécifiques
 */

class VoiceSurveillanceManager {
  constructor(client) {
    this.client = client;
    this.surveillanceChannels = new Map(); // channelId -> { userId, startTime, isActive }
    this.allowedUsers = new Set(); // IDs des utilisateurs autorisés
    this.isMonitoring = false;
    
    // Configuration par défaut
    this.config = {
      maxSurveillanceChannels: 10,
      checkInterval: 30000, // 30 secondes
      reconnectDelay: 5000, // 5 secondes
      logActivity: true
    };
  }

  /**
   * Ajoute un utilisateur à la liste des utilisateurs autorisés
   * @param {string} userId - ID de l'utilisateur
   */
  addAllowedUser(userId) {
    this.allowedUsers.add(userId);
    if (this.config.logActivity) {
      console.log(`[VOICE SURVEILLANCE] User ${userId} added to allowed list`);
    }
  }

  /**
   * Supprime un utilisateur de la liste des utilisateurs autorisés
   * @param {string} userId - ID de l'utilisateur
   */
  removeAllowedUser(userId) {
    this.allowedUsers.delete(userId);
    if (this.config.logActivity) {
      console.log(`[VOICE SURVEILLANCE] User ${userId} removed from allowed list`);
    }
  }

  /**
   * Vérifie si un utilisateur est autorisé
   * @param {string} userId - ID de l'utilisateur
   * @returns {boolean}
   */
  isUserAllowed(userId) {
    return this.allowedUsers.has(userId);
  }

  /**
   * Rejoint un salon vocal pour surveillance
   * @param {string} channelId - ID du salon vocal
   * @param {string} userId - ID de l'utilisateur qui a demandé
   * @returns {Promise<boolean>}
   */
  async joinVoiceChannel(channelId, userId) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel || !channel.isVoiceBased()) {
        throw new Error('Channel not found or not a voice channel');
      }

      // Vérifier si le bot peut rejoindre le salon
      if (!channel.joinable) {
        throw new Error('Cannot join this voice channel');
      }

      // Rejoindre le salon vocal
      const connection = await channel.join();
      
      // Enregistrer la surveillance
      this.surveillanceChannels.set(channelId, {
        userId,
        startTime: Date.now(),
        isActive: true,
        connection
      });

      if (this.config.logActivity) {
        console.log(`[VOICE SURVEILLANCE] Bot joined voice channel ${channelId} for user ${userId}`);
      }

      // Démarrer la surveillance si pas déjà active
      if (!this.isMonitoring) {
        this.startMonitoring();
      }

      return true;
    } catch (error) {
      console.error(`[VOICE SURVEILLANCE] Error joining channel ${channelId}:`, error);
      return false;
    }
  }

  /**
   * Quitte un salon vocal de surveillance
   * @param {string} channelId - ID du salon vocal
   * @returns {Promise<boolean>}
   */
  async leaveVoiceChannel(channelId) {
    try {
      const surveillance = this.surveillanceChannels.get(channelId);
      if (!surveillance) {
        return false;
      }

      // Quitter le salon vocal
      if (surveillance.connection) {
        surveillance.connection.destroy();
      }

      // Supprimer de la surveillance
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

  /**
   * Démarre le monitoring des connexions vocales
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkConnections();
    }, this.config.checkInterval);

    console.log('[VOICE SURVEILLANCE] Monitoring started');
  }

  /**
   * Arrête le monitoring des connexions vocales
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Quitter tous les salons de surveillance
    for (const [channelId] of this.surveillanceChannels) {
      this.leaveVoiceChannel(channelId);
    }

    console.log('[VOICE SURVEILLANCE] Monitoring stopped');
  }

  /**
   * Vérifie l'état des connexions vocales
   */
  async checkConnections() {
    for (const [channelId, surveillance] of this.surveillanceChannels) {
      try {
        if (!surveillance.isActive) continue;

        const channel = await this.client.channels.fetch(channelId);
        if (!channel) {
          // Salon supprimé
          this.surveillanceChannels.delete(channelId);
          continue;
        }

        // Vérifier si la connexion est toujours active
        if (!surveillance.connection || surveillance.connection.status === 'destroyed') {
          // Reconnexion automatique
          console.log(`[VOICE SURVEILLANCE] Reconnecting to channel ${channelId}`);
          await this.joinVoiceChannel(channelId, surveillance.userId);
        }

      } catch (error) {
        console.error(`[VOICE SURVEILLANCE] Error checking channel ${channelId}:`, error);
      }
    }
  }

  /**
   * Obtient la liste des salons surveillés
   * @returns {Array}
   */
  getSurveillanceChannels() {
    return Array.from(this.surveillanceChannels.entries()).map(([channelId, data]) => ({
      channelId,
      userId: data.userId,
      startTime: data.startTime,
      isActive: data.isActive,
      duration: Date.now() - data.startTime
    }));
  }

  /**
   * Obtient les statistiques de surveillance
   * @returns {Object}
   */
  getStats() {
    return {
      totalChannels: this.surveillanceChannels.size,
      allowedUsers: this.allowedUsers.size,
      isMonitoring: this.isMonitoring,
      channels: this.getSurveillanceChannels()
    };
  }

  /**
   * Nettoie les données de surveillance
   */
  cleanup() {
    this.stopMonitoring();
    this.surveillanceChannels.clear();
    this.allowedUsers.clear();
    console.log('[VOICE SURVEILLANCE] Cleanup completed');
  }
}

module.exports = VoiceSurveillanceManager;
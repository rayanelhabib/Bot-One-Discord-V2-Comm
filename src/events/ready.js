const { REST, Routes } = require('discord.js');
const { getGuildConfig, updateGuildConfig, DEFAULT_CONFIG } = require('../utils/configManager');
const { redis } = require('../redisClient');
const { ChannelType, PermissionsBitField } = require('discord.js');
const { initializeLeaderboard } = require('../utils/leaderboardManager');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // --- SYSTÈME ROBUSTE : Vérification du setup ---
    for (const guild of client.guilds.cache.values()) {
      try {
        console.log(`[READY] 🔧 Vérification du setup pour: ${guild.name} (${guild.id})`);
        
        // Récupérer la config
        let config = await getGuildConfig(guild.id);
        console.log(`[READY] Config récupérée:`, config);
        
        // Vérifier si la config est valide
        const isConfigValid = config && 
          config.createChannelId && 
          config.tempChannelCategory && 
          config.createChannelName;
        
        if (!isConfigValid) {
          console.log(`[READY] ⚠️ Config incomplète ou absente. Aucune création automatique. Attente de la commande setup.`);
          continue; // On passe à la guilde suivante sans rien faire
        }
        
        // === GESTION DE LA CATÉGORIE ===
        // Suppression de toute recréation automatique de catégorie
        let category = null;
        if (config.tempChannelCategory && typeof config.tempChannelCategory === 'string') {
          category = guild.channels.cache.get(config.tempChannelCategory);
          console.log(`[READY] Catégorie trouvée:`, category ? category.name : '❌ NON TROUVÉE');
        }
        // On ne recrée jamais la catégorie automatiquement
        if (!category || category.type !== ChannelType.GuildCategory) {
          console.log(`[READY] ⚠️ Catégorie manquante ou invalide. Merci de refaire la commande setup.`);
          continue;
        }

        // === GESTION DU SALON DE CRÉATION ===
        // Suppression de toute recréation automatique de salon vocal
        let createChannel = null;
        if (config.createChannelId) {
          createChannel = guild.channels.cache.get(config.createChannelId);
          console.log(`[READY] Salon de création trouvé:`, createChannel ? createChannel.name : '❌ NON TROUVÉ');
        }
        if (!createChannel || createChannel.type !== ChannelType.GuildVoice) {
          console.log(`[READY] ⚠️ Salon de création manquant ou invalide. Merci de refaire la commande setup.`);
          continue;
        }

        // === NETTOYAGE DES ANCIENS SALONS ===
        // Suppression désactivée : on ne supprime plus jamais automatiquement les anciens salons de création
        
        // === MISE À JOUR DE LA CONFIG ===
        const needsUpdate = 
          config.createChannelId !== createChannel.id ||
          config.tempChannelCategory !== category.id ||
          config.createChannelName !== createChannel.name;
        
        if (needsUpdate) {
          console.log(`[READY] 🔄 Mise à jour de la config...`);
          try {
            const updatedConfig = await updateGuildConfig(guild.id, {
              createChannelId: createChannel.id,
              createChannelName: createChannel.name,
              tempChannelCategory: category.id,
              tempChannelCategoryId: category.id,
              autoDeleteEmpty: config.autoDeleteEmpty !== undefined ? config.autoDeleteEmpty : true,
              allowRenaming: config.allowRenaming !== undefined ? config.allowRenaming : true,
              defaultUserLimit: config.defaultUserLimit || 0
            });
            console.log(`[READY] ✅ Config mise à jour pour ${guild.name}:`, updatedConfig);
            
            // Vérification de la sauvegarde
            const savedConfig = await getGuildConfig(guild.id);
            if (savedConfig && savedConfig.createChannelId === createChannel.id) {
              console.log(`[READY] ✅ Config sauvegardée avec succès`);
            } else {
              console.log(`[READY] ⚠️ Problème de sauvegarde de la config`);
            }
          } catch (error) {
            console.error(`[READY] ❌ Erreur mise à jour config:`, error.message);
          }
        } else {
          console.log(`[READY] ✅ Setup déjà correct pour ${guild.name}`);
        }
        
        // === VÉRIFICATION FINALE ===
        console.log(`[READY] 🎯 Setup final pour ${guild.name}:`);
        console.log(`[READY]   - Catégorie: ${category.name} (${category.id})`);
        console.log(`[READY]   - Salon de création: ${createChannel.name} (${createChannel.id})`);
        console.log(`[READY]   - Config ID: ${config.createChannelId} → ${createChannel.id}`);
        
      } catch (err) {
        console.error(`[READY] ❌ Erreur critique pour la guilde ${guild.id}:`, err);
      }
    }
    // --- FIN SYSTÈME ROBUSTE ---

    // Enregistrement des commandes slash
    const rest = new REST({ version: '10' }).setToken(client.token);
    const commandsData = Array.from(client.commands.slash.values()).map(cmd => cmd.data.toJSON());
    const useGlobal = process.env.USE_GLOBAL === 'true';

    try {
      if (useGlobal) {
        const route = Routes.applicationCommands(client.user.id);
        const result = await rest.put(route, { body: commandsData });
        console.log(`🌐 Registered ${result.length} global slash commands.`);
        console.log('⚠️ Global commands may take up to 1 hour to appear in all servers.');
      } else {
        const guilds = client.guilds.cache.map(guild => guild.id);
        console.log(`🔁 Registering slash commands in ${guilds.length} guilds...`);

        for (const guildId of guilds) {
          const route = Routes.applicationGuildCommands(client.user.id, guildId);
          const result = await rest.put(route, { body: commandsData });
          console.log(`✅ Registered ${result.length} commands in guild ${guildId}`);
        }
      }
    } catch (err) {
      console.error('💀 Failed to register commands:', err);
    }

    // Initialiser le leaderboard pour toutes les guildes
    console.log('🏆 Initializing task leaderboards...');
    for (const guild of client.guilds.cache.values()) {
      try {
        await initializeLeaderboard(guild);
      } catch (error) {
        console.error(`[LEADERBOARD] Error initializing leaderboard for guild ${guild.id}:`, error);
      }
    }
    console.log('✅ Task leaderboards initialized');
  }
};

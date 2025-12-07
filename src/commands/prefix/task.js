const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SectionBuilder,
  SeparatorBuilder,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder
} = require('discord.js');
const { redis } = require('../../redisClient');
const { dataManager } = require('../../utils/dataManager');
const { updateLeaderboard } = require('../../utils/leaderboardManager');

// Configuration du système avancé
const STAFF_ROLE_IDS = ['1409235424257511464'];
const HIGH_ROLE_IDS = ['1388840745577873550'];
const OWNER_USER_IDS = ['1366651120373600296'];

// Configuration des canaux
const TASK_CHANNEL_ID = '1415737373408366774';
const REQUEST_TASK_ACCEPT_CHANNEL_ID = '1395159918046089277';
const TASK_LEADERBOARD_CHANNEL_ID = '1395159806838444112';

// Configuration des tâches
const TASK_DURATION_MINUTES = 20;
const TASK_DURATION_SECONDS = TASK_DURATION_MINUTES * 60;
const TASK_VALIDITY_WINDOW_MINUTES = 25;
const UPDATE_INTERVAL_MS = 1000; // Mise à jour chaque seconde
const REDIS_EXPIRY_SECONDS = TASK_DURATION_SECONDS + 300; // 20 min + 5 min de marge

// Cache pour les intervalles de mise à jour
const activeUpdateIntervals = new Map();
const pauseTimers = new Map();
const originalEmbedMessages = new Map();

// Fonction utilitaire pour vérifier les rôles
function hasRole(member, roleIds) {
    return Array.from(member.roles.cache.values()).some(role => roleIds.includes(role.id));
}

// Fonction utilitaire pour trouver un canal de fallback
function findFallbackChannel(guild, preferredChannelId = null) {
    // D'abord essayer le canal préféré
    if (preferredChannelId) {
        const preferredChannel = guild.channels.cache.get(preferredChannelId);
        if (preferredChannel && preferredChannel.type === 0 && 
            preferredChannel.permissionsFor(guild.members.me).has('SendMessages')) {
            return preferredChannel;
        }
    }
    
    // Chercher un canal de fallback par nom
    const fallbackChannels = [
        'general',
        'général', 
        'logs',
        'bot',
        'commands',
        'tasks',
        'task',
        'staff',
        'admin'
    ];
    
    let taskChannel = null;
    for (const [id, channel] of guild.channels.cache) {
        if (channel.type === 0 && // Text channel
            channel.permissionsFor(guild.members.me).has('SendMessages') &&
            (fallbackChannels.some(name => 
                channel.name.toLowerCase().includes(name.toLowerCase())
            ) || channel.name.includes('task') || channel.name.includes('log'))) {
            taskChannel = channel;
            break;
        }
    }
    
    if (!taskChannel) {
        // Utiliser le premier canal textuel disponible
        for (const [id, channel] of guild.channels.cache) {
            if (channel.type === 0 && // Text channel
                channel.permissionsFor(guild.members.me).has('SendMessages')) {
                taskChannel = channel;
                break;
            }
        }
    }
    
    return taskChannel;
}

// Fonction pour incrémenter le compteur de tâches
async function incrementTaskCount(guildId, userId) {
    try {
        const result = await dataManager.updateUserTaskCount(guildId, userId, 1);
        if (result) {
            return await dataManager.getUserTaskCount(guildId, userId);
        }
        return null;
    } catch (error) {
        console.error('[TASK SYSTEM] Error incrementing task count:', error);
        return null;
    }
}

// Fonction pour valider les conditions de démarrage de tâche
async function validateTaskStartConditions(voiceChannel, member, channelId) {
    try {
        // 1. Vérifier que c'est bien un salon vocal
        if (voiceChannel.type !== 2) {
            return { valid: false, reason: 'Must be in a voice channel (not text channel)' };
        }
        
        // 2. Vérifier que le staff a les permissions staff
        if (!hasRole(member, STAFF_ROLE_IDS)) {
            return { valid: false, reason: 'You do not have permission to start a task' };
        }
        
        // 3. Vérifier que le staff est le créateur du salon
        const creatorId = await redis.get(`creator:${channelId}`);
        if (creatorId !== member.id) {
            return { valid: false, reason: 'Only the channel creator can start a task' };
        }
        
        // 4. Vérifier le nombre minimum de membres
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
            return { valid: false, reason: 'Staff left the channel' };
        }
        
        // 2. Vérifier qu'il y a toujours au moins 5 membres
        if (voiceChannel.members.size < 5) {
            return { valid: false, reason: `Insufficient members: ${voiceChannel.members.size} < 5` };
        }
        
        // 3. Vérifier que le staff est toujours le créateur du salon
        const creatorId = await redis.get(`creator:${channelId}`);
        if (creatorId !== member.id) {
            return { valid: false, reason: 'Staff is no longer channel creator' };
        }
        
        // 4. Vérifier que le staff a toujours les permissions staff
        if (!hasRole(member, STAFF_ROLE_IDS)) {
            return { valid: false, reason: 'Staff no longer has staff role' };
        }
        
        // 5. Vérifier que c'est bien un salon vocal
        if (voiceChannel.type !== 2) {
            return { valid: false, reason: 'Channel is not a voice channel' };
        }
        
        return { valid: true, reason: 'All conditions met' };
        
    } catch (error) {
        console.error(`[TASK CONDITIONS] Error checking conditions for channel ${channelId}:`, error);
        return { valid: false, reason: 'System error during condition check' };
    }
}

// Fonction pour créer les composants V2 de tâche
function createTaskComponents(voiceChannel, member, startTime) {
    try {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);

        // Formatage du temps écoulé
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

        // Formatage du temps restant
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

        // Créer les composants TextDisplay pour Discord Components V2 (style leaderboard/welcome)
        const titleText = new TextDisplayBuilder()
            .setContent(`# <:cropped_circle_image1:1414352260955242767>  Task en cours - ${voiceChannel.name}`);

        const taskInfoText = new TextDisplayBuilder()
            .setContent(`<:maxright:1409235539214864465>  **Informations de la Tâche**\n\n> **👥 Utilisateurs dans ${voiceChannel.name}:** ${voiceChannel.members.size}\n> **👑 Propriétaire du salon:** <@${member.id}>\n> **🆔 ID du salon:** \`${voiceChannel.id}\`\n> **📋 Nom One Tap:** ${voiceChannel.name}\n> **👨‍💼 Staff:** ${member.user.username}\n> **🎯 Tâche par:** <@${member.id}>`);

        const timerText = new TextDisplayBuilder()
            .setContent(`### <:windows:1409235505928994836> Timer de la Tâche\n> **⏰ Créée à:** ${timeDisplay}\n> **⏳ Temps restant:** ${timeRemainingDisplay}\n> **🔄 Mise à jour:** En temps réel`);

        const membersText = new TextDisplayBuilder()
            .setContent(`### <:cropped_circle_image:1414200758877950054> Membres dans le salon\n> ${memberTags}`);

        // Bouton de contrôle (seulement Annuler pour le créateur)
        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`task_cancel_${voiceChannel.id}`)
                .setLabel('❌ Annuler la Tâche')
                .setStyle(ButtonStyle.Danger)
        );

        // Galerie média avec l'image de la tâche
        const mediaGallery = new MediaGalleryBuilder()
            .addItems(
                mediaGalleryItem => mediaGalleryItem
                    .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1413842170431143956/telechargement_1.gif?ex=68bd66a1&is=68bc1521&hm=3d81872c4cf9e61ad2d175615babb04343a8a17e233ee953f67d2d5cfe580cc8')
            );

        // Section des informations de la tâche avec thumbnail
        const taskInfoSection = new SectionBuilder()
            .addTextDisplayComponents(taskInfoText)
            .setThumbnailAccessory(
                thumbnail => thumbnail
                    .setDescription('Task Management System')
                    .setURL('attachment://task_thumb.gif')
            );

        // Séparateur pour organiser le container
        const separator = new SeparatorBuilder().setDivider(true);

        // Container principal avec structure V2 (comme leaderboard/welcome)
        const mainContainer = new ContainerBuilder()
            .addTextDisplayComponents(titleText)
            .addSeparatorComponents(separator)
            .addSectionComponents(taskInfoSection)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(timerText)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(membersText)
            .addSeparatorComponents(separator)
            .addMediaGalleryComponents(mediaGallery)
            .addSeparatorComponents(separator)
            .addActionRowComponents(controlRow);

        // Fichiers d'attachement (style leaderboard)
        const creatorAvatarFile = new AttachmentBuilder('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
            .setName('task_thumb.gif');

        return {
            mainContainer,
            creatorAvatarFile,
            // Données pour la mise à jour
            timeDisplay,
            timeRemainingDisplay,
            memberTags
        };
    } catch (error) {
        console.error('[TASK SYSTEM] Error creating task components:', error);
        return null;
    }
}

// Fonction pour créer l'embed de tâche (ancienne version - gardée pour compatibilité)
function createTaskEmbed(voiceChannel, member, startTime) {
    try {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);

        // Formatage du temps écoulé
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

        // Formatage du temps restant
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
                name: 'skz_rayan23',
                iconURL: voiceChannel.guild.iconURL({ dynamic: true, size: 1024 }) || 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
            })
            .setColor(0x5865F2)
            .setThumbnail(voiceChannel.guild.iconURL({ dynamic: true, size: 1024 }) || 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
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

// Fonction pour automatiquement compléter une tâche
async function autoCompleteTask(channelId, voiceChannel, member) {
    try {
        console.log(`[TASK AUTO-COMPLETE] Automatically completing task for ${member.user.username} in channel ${voiceChannel.name}`);
        
        const guildId = voiceChannel.guild.id;
        const userId = member.id;
        
        // Vérifier que toutes les conditions sont encore remplies
        const conditionsCheck = await checkTaskConditions(voiceChannel, member, channelId);
        if (!conditionsCheck.valid) {
            console.log(`[TASK AUTO-COMPLETE] Conditions no longer valid: ${conditionsCheck.reason}`);
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
        
        console.log(`[TASK AUTO-COMPLETE] Task successfully auto-completed for ${member.user.username}! New count: ${newCount}`);
        
    } catch (error) {
        console.error('[TASK AUTO-COMPLETE] Critical error in auto-complete:', error);
    }
}

// Fonction pour nettoyer les données d'un salon
function cleanupChannelData(channelId) {
    console.log(`[TASK CLEANUP] Cleaning up data for channel ${channelId}`);
    
    // Nettoyer l'intervalle de mise à jour
    if (activeUpdateIntervals.has(channelId)) {
        const interval = activeUpdateIntervals.get(channelId);
        if (interval) {
            clearInterval(interval);
        }
        activeUpdateIntervals.delete(channelId);
    }
    
    // Nettoyer le timer de pause
    if (pauseTimers.has(channelId)) {
        const pauseEntry = pauseTimers.get(channelId);
        if (pauseEntry) {
            if (typeof pauseEntry === 'object' && pauseEntry !== null) {
                if (pauseEntry.timeout) clearTimeout(pauseEntry.timeout);
                if (pauseEntry.interval) clearInterval(pauseEntry.interval);
            } else {
                clearTimeout(pauseEntry);
            }
        }
        pauseTimers.delete(channelId);
    }
    
    // Supprimer le message original de la cache
    if (originalEmbedMessages.has(channelId)) {
        originalEmbedMessages.delete(channelId);
    }
    
    // Nettoyer les clés Redis
    cleanupRedisKeys(channelId);
    
    console.log(`[TASK CLEANUP] Cleanup completed for channel ${channelId}`);
}

// Fonction pour nettoyer les clés Redis
async function cleanupRedisKeys(channelId) {
    try {
        const timerKey = `task_timer:${channelId}`;
        const pauseKey = `task_pause:${channelId}`;
        
        await redis.del(timerKey);
        await redis.del(pauseKey);
        
        console.log(`[TASK CLEANUP] Redis keys cleaned for channel ${channelId}`);
    } catch (error) {
        console.error(`[TASK CLEANUP] Error cleaning Redis keys for channel ${channelId}:`, error);
    }
}

// Fonction pour démarrer l'intervalle de mise à jour de la tâche
function startTaskUpdateInterval(channelId, voiceChannel, member, startTime, embedMessage) {
    // Nettoyer l'intervalle existant s'il y en a un
    if (activeUpdateIntervals.has(channelId)) {
        const existingInterval = activeUpdateIntervals.get(channelId);
        if (existingInterval) {
            clearInterval(existingInterval);
        }
        activeUpdateIntervals.delete(channelId);
    }
    
    const updateInterval = setInterval(async () => {
        try {
            const currentTime = Date.now();
            const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
            
            // Vérifier si le timer existe encore
            const timerKey = `task_timer:${channelId}`;
            const timerExists = await redis.get(timerKey);
            
            if (!timerExists) {
                console.log(`[TASK UPDATE] Timer not found for channel ${channelId}, stopping updates`);
                clearInterval(updateInterval);
                activeUpdateIntervals.delete(channelId);
                return;
            }
            
            // Vérifier si le timer est terminé
            if (elapsedMinutes >= TASK_DURATION_MINUTES) {
                console.log(`[TASK UPDATE] Timer completed for channel ${channelId}, stopping updates`);
                clearInterval(updateInterval);
                activeUpdateIntervals.delete(channelId);
                
                // AUTOMATIQUE : Compter la tâche et mettre à jour le leaderboard
                await autoCompleteTask(channelId, voiceChannel, member);
                return;
            }
            
            // Vérifier les conditions de la tâche
            const conditionsCheck = await checkTaskConditions(voiceChannel, member, channelId);
            
            if (!conditionsCheck.valid) {
                console.log(`[TASK UPDATE] Conditions no longer valid for channel ${channelId}: ${conditionsCheck.reason}`);
                clearInterval(updateInterval);
                activeUpdateIntervals.delete(channelId);
                
                // Nettoyer les données
                cleanupChannelData(channelId);
                return;
            }
            
            // Mise à jour des composants V2
            const updatedComponents = createTaskComponents(voiceChannel, member, startTime);
            if (updatedComponents) {
                await embedMessage.edit({ 
                    flags: MessageFlags.IsComponentsV2,
                    components: [updatedComponents.mainContainer],
                    files: [updatedComponents.creatorAvatarFile]
                });
                console.log(`[TASK CHRONO] Components updated for channel ${channelId} at ${elapsedMinutes}m ${Math.floor((currentTime - startTime) % 60000 / 1000)}s`);
            }

        } catch (error) {
            console.error(`[TASK UPDATE] Error updating embed for channel ${channelId}:`, error);
            
            // Arrêter l'intervalle en cas d'erreur critique
            if (error.code === 50013 || error.message.includes('Missing Permissions')) {
                console.error(`[TASK UPDATE] Critical permission error for channel ${channelId}, stopping updates`);
                clearInterval(updateInterval);
                activeUpdateIntervals.delete(channelId);
            }
        }
    }, UPDATE_INTERVAL_MS);
    
    // Stocker l'intervalle pour pouvoir le nettoyer plus tard
    activeUpdateIntervals.set(channelId, updateInterval);
    
    // Arrêter la mise à jour après la durée du timer + marge
    setTimeout(() => {
        if (activeUpdateIntervals.has(channelId)) {
            clearInterval(activeUpdateIntervals.get(channelId));
            activeUpdateIntervals.delete(channelId);
            console.log(`[TASK UPDATE] Auto-cleanup for channel ${channelId} after timeout`);
        }
    }, (TASK_DURATION_SECONDS + 60) * 1000); // 20 min + 1 min de marge
    
    console.log(`[TASK CHRONO] Started chrono updates for channel ${channelId} with ${UPDATE_INTERVAL_MS}ms interval (each second)`);
}

// Fonction pour gérer la pause du timer quand le staff quitte
async function handleStaffLeave(voiceChannel, member) {
  try {
    const { redis } = require('../../redisClient');
    const { updateLeaderboard } = require('../../utils/leaderboardManager');
    
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
    
    // Marquer le timer comme en pause
    await redis.set(pauseKey, JSON.stringify({ 
      start: timerStart, 
      reason: 'staff_left',
      pausedAt: Date.now()
    }), 'EX', 120); // 2 minutes
    
    // Mettre à jour le leaderboard
    try {
      await updateLeaderboard(voiceChannel.guild);
      console.log(`[TASK_PAUSE] Leaderboard updated after pause`);
    } catch (error) {
      console.error('[TASK_PAUSE] Error updating leaderboard:', error);
    }
    
  } catch (error) {
    console.error('[TASK_PAUSE] Error in handleStaffLeave:', error);
  }
}

// Fonction pour gérer la reprise du timer quand le staff revient
async function handleStaffReturn(voiceChannel, member) {
  try {
    const { redis } = require('../../redisClient');
    const { updateLeaderboard } = require('../../utils/leaderboardManager');
    
    console.log(`[TASK_RESUME] Starting resume logic for ${member.user.username} in channel ${voiceChannel.name}`);
    
    const channelId = voiceChannel.id;
    const timerKey = `task_timer:${channelId}`;
    const pauseKey = `task_pause:${channelId}`;
    
    // Vérifier s'il y a une pause en cours
    const pauseData = await redis.get(pauseKey);
    if (!pauseData) {
      console.log(`[TASK_RESUME] No pause found for channel ${channelId}`);
      return;
    }
    
    const pause = JSON.parse(pauseData);
    console.log(`[TASK_RESUME] Pause found, resuming task for ${member.user.username}`);
    
    // Supprimer la pause
    await redis.del(pauseKey);
    
    // Redémarrer le timer
    await redis.set(timerKey, pause.start, 'EX', 1200); // 20 minutes
    
    // Mettre à jour le leaderboard
    try {
      await updateLeaderboard(voiceChannel.guild);
      console.log(`[TASK_RESUME] Leaderboard updated after resume`);
    } catch (error) {
      console.error('[TASK_RESUME] Error updating leaderboard:', error);
    }
    
  } catch (error) {
    console.error('[TASK_RESUME] Error in handleStaffReturn:', error);
  }
}

module.exports = {
  name: 'task',
  description: 'Manage voice channel tasks',
  usage: '.v task [info]',
  handleStaffLeave,
  handleStaffReturn,
  findFallbackChannel,
  async execute(message, args, client) {
    try {
      const subcommand = args[0];
      const userId = message.author.id;
      const guildId = message.guild.id;
    
      if (!subcommand) {
        // Commande +task (vérifier et commencer le timer)
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
          return message.reply({ 
            embeds: [new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('❌ Error')
              .setDescription('💌 You must be in a voice channel to start a task.')
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
        }
        
        // Validation complète des conditions de démarrage
        const channelId = voiceChannel.id;
        const validation = await validateTaskStartConditions(voiceChannel, message.member, channelId);
        
        if (!validation.valid) {
      return message.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FEE75C')
              .setTitle('❌ Validation Failed')
              .setDescription(validation.reason)
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
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
            return message.reply({ 
              embeds: [new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle('⏰ Timer Expired')
                .setDescription('The previous timer has expired. Starting a new timer now.')
                .setFooter({ text: 'OneTab - Task system' })
              ] 
            });
          }

      return message.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FEE75C')
              .setTitle('⏰ Timer Already Running')
              .setDescription(`Task timer is already running! ${elapsedMinutes} minutes elapsed, ${remainingMinutes} minutes remaining.`)
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
        }
        
        // Commencer le timer
        const startTime = Date.now();
        await redis.set(timerKey, startTime.toString(), 'EX', REDIS_EXPIRY_SECONDS);
        
        // Créer les composants V2 de tâche
        const taskComponents = createTaskComponents(voiceChannel, message.member, startTime);
        if (!taskComponents) {
          await redis.del(timerKey);
          return message.reply({ 
            embeds: [new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('❌ System Error')
              .setDescription('Failed to create task components. Please try again.')
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
        }
        
        // Envoyer l'embed dans le salon task-onetap (avec fallback)
        const taskChannel = findFallbackChannel(message.guild, TASK_CHANNEL_ID);
        
        if (!taskChannel) {
          await redis.del(timerKey);
          return message.reply({ 
            embeds: [new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('❌ Channel Error')
              .setDescription('Aucun canal textuel trouvé pour envoyer les messages de tâches. Veuillez créer un canal ou vérifier les permissions du bot.')
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
        }
        
        console.log(`[TASK] Utilisation du canal: ${taskChannel.name} (${taskChannel.id})`);
        
        const taskChannelMessage = await taskChannel.send({ 
          flags: MessageFlags.IsComponentsV2,
          components: [taskComponents.mainContainer],
          files: [taskComponents.creatorAvatarFile]
        });
        originalEmbedMessages.set(channelId, taskChannelMessage);
        
        // Démarrer la mise à jour en temps réel
        startTaskUpdateInterval(channelId, voiceChannel, message.member, startTime, taskChannelMessage);
        
        message.reply({ 
          embeds: [new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Task Started')
            .setDescription(`⏰ Task timer has started! You need to stay ${TASK_DURATION_MINUTES} minutes with at least 5 members.\n\n✅ **AUTOMATIQUE :** Votre tâche sera automatiquement comptée après ${TASK_DURATION_MINUTES} minutes !`)
            .setFooter({ text: 'OneTab - Task system' })
          ] 
        });
        
      } else if (subcommand === 'list') {
        // Commande +task list
        if (!hasRole(message.member, HIGH_ROLE_IDS)) {
        return message.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FEE75C')
              .setTitle('⛔ Permission Denied')
              .setDescription('You do not have permission to view the task list.')
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
        }
        
        const data = await dataManager.getTaskData(guildId);
        if (!data || Object.keys(data).length === 0) {
          return message.reply({ 
            embeds: [new EmbedBuilder()
              .setColor('#FEE75C')
              .setTitle('ℹ️ No Data')
              .setDescription('No task data found.')
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
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
        
        message.reply({ 
          embeds: [new EmbedBuilder()
            .setTitle('📋 Task List')
            .setDescription(reply)
            .setColor('#5865F2')
            .setFooter({ text: 'OneTab - Task system' })
          ] 
        });
        
      } else if (subcommand === 'clear') {
        // Commande +task clear
        if (!OWNER_USER_IDS.includes(message.author.id)) {
          return message.reply({ 
            embeds: [new EmbedBuilder()
              .setColor('#FEE75C')
              .setTitle('⛔ Permission Denied')
              .setDescription('You do not have permission to clear the task data.')
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
        }
        
        const success = await dataManager.setTaskData(guildId, {});
        if (!success) {
          return message.reply({ 
            embeds: [new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('❌ System Error')
              .setDescription('Error while clearing task data.')
              .setFooter({ text: 'OneTab - Task system' })
            ] 
          });
        }
        
        // Mettre à jour le leaderboard après avoir supprimé les données
        try {
          await updateLeaderboard(message.guild);
          console.log(`[TASK LEADERBOARD] Leaderboard updated after task data clear by ${message.author.username}`);
        } catch (error) {
          console.error('[TASK LEADERBOARD] Error updating leaderboard after task data clear:', error);
        }
        
        message.reply({ 
          embeds: [new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ Task Data Cleared')
            .setDescription('🧹 Task Data Cleared! All task data has been reset and leaderboard updated.')
            .setFooter({ text: 'OneTab - Task system' })
          ] 
        });
        
      } else {
        message.reply({ 
          embeds: [new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('ℹ️ Usage')
            .setDescription('Unknown subcommand. Use `+task`, `+task list`, or `+task clear`.\n\n✅ **AUTOMATIQUE :** Les tâches sont comptées automatiquement après 20 minutes !\n\nTo add tasks to users, use `+taskadd @user` or `+taskadd ID` (owner only).')
            .setFooter({ text: 'OneTab - Task system' })
          ] 
        });
      }
    } catch (error) {
      console.error('[TASK SYSTEM] Critical error in task command:', error);
      message.reply({ 
        embeds: [new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('❌ System Error')
          .setDescription('An unexpected error occurred. Please try again later.')
          .setFooter({ text: 'OneTab - Task system' })
        ] 
      });
    }
  }
};

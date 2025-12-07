const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ChannelType, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  SeparatorBuilder,
  AttachmentBuilder
} = require('discord.js');
const { dataManager } = require('./dataManager');
const { errorHandler } = require('./errorHandler');

// Configuration
const TASK_LEADERBOARD_CHANNEL_ID = '1395159806838444112';

// Cache pour stocker le message du leaderboard
let leaderboardMessage = null;
let leaderboardCheckInterval = null;

// Fonction pour créer les composants du leaderboard avec Discord Components V2
function createLeaderboardComponents(taskData) {
    try {
        // Trier les utilisateurs par nombre de tâches (décroissant)
        const sortedUsers = Object.entries(taskData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 seulement

        let leaderboardContent = '';
        let rank = 1;

        if (sortedUsers.length === 0) {
            leaderboardContent = '📊 **Aucune tâche complétée pour le moment.**\n\nCommencez à utiliser `+task` pour apparaître dans le classement !';
        } else {
            for (const [userId, taskCount] of sortedUsers) {
                let medal = '';
                if (rank === 1) medal = `<:ones:1409235508202176552>`;
                else if (rank === 2) medal = `<:twos:1409235464589672550>`;
                else if (rank === 3) medal = `<:threes:1409235450463518732>`;
                else medal = `**${rank}.**`;

                leaderboardContent += `${medal} <@${userId}> - **${taskCount}** tâches\n`;
                rank++;
            }
        }

        // Créer les composants TextDisplay pour Discord Components V2
        const titleText = new TextDisplayBuilder()
            .setContent(`# <:cropped_circle_image1:1414352260955242767>  Task Leaderboard`);

        const leaderboardText = new TextDisplayBuilder()
            .setContent(`<:maxright:1409235539214864465>  **Classement des Staff**\n\n${leaderboardContent}`);

        const statsText = new TextDisplayBuilder()
            .setContent(`### <:windows:1409235505928994836> Statistiques
> **• Total des tâches:** **${Object.values(taskData).reduce((a, b) => a + b, 0)}** tâches complétées
> **• Staff participants:** **${Object.keys(taskData).length}** membres
> **• Dernière mise à jour:** ${new Date().toLocaleString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`);

        // Footer supprimé selon la demande

        // Bouton pour actualiser seulement la section
        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('leaderboard_refresh')
                .setLabel('🔄 Actualiser')
                .setStyle(ButtonStyle.Primary)
        );

        // Galerie média avec l'image du leaderboard
        const mediaGallery = new MediaGalleryBuilder()
            .addItems(
                mediaGalleryItem => mediaGalleryItem
                    .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1415762392528191698/36113e3f191c49d87eadb6578216045b_gif_500203_pixels.gif')
            );

        // Section des statistiques sans thumbnail pour éviter les erreurs
        const statsSection = new SectionBuilder()
            .addTextDisplayComponents(statsText);

        // Séparateur pour organiser le container
        const separator = new SeparatorBuilder().setDivider(true);

        // Section principale avec titre seulement
        const mainSection = new SectionBuilder()
            .addTextDisplayComponents(titleText);

        // Section du classement avec thumbnail (comme le message de welcome)
        const leaderboardSection = new SectionBuilder()
            .addTextDisplayComponents(leaderboardText)
            .setThumbnailAccessory(
                thumbnail => thumbnail
                    .setDescription('Task Leaderboard System')
                    .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
            );

        // Container principal avec section du classement
        const mainContainer = new ContainerBuilder()
            .addTextDisplayComponents(titleText)
            .addSeparatorComponents(separator)
            .addSectionComponents(leaderboardSection)
            .addSeparatorComponents(separator)
            .addMediaGalleryComponents(mediaGallery)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(statsText)
            .addActionRowComponents(controlRow);

        // Créer l'attachment pour le thumbnail du leaderboard (comme le message de welcome)
        const leaderboardThumbnailFile = new AttachmentBuilder('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
            .setName('leaderboard_thumb.gif');

        return {
            mainContainer,
            leaderboardThumbnailFile
        };

    } catch (error) {
        console.error('[LEADERBOARD] Error creating leaderboard components:', error);
        return null;
    }
}

// Fonction pour envoyer ou mettre à jour le leaderboard
async function updateLeaderboard(guild) {
    try {
        const leaderboardChannel = guild.channels.cache.get(TASK_LEADERBOARD_CHANNEL_ID);
        if (!leaderboardChannel) {
            console.error('[LEADERBOARD] Leaderboard channel not found:', TASK_LEADERBOARD_CHANNEL_ID);
            return;
        }

        // Récupérer les données des tâches
        const taskData = await dataManager.getTaskData(guild.id);
        if (!taskData) {
            console.error('[LEADERBOARD] Failed to get task data');
            return;
        }

        // Créer les composants du leaderboard
        const components = createLeaderboardComponents(taskData);
        if (!components) {
            console.error('[LEADERBOARD] Failed to create leaderboard components');
            return;
        }

        // Si on a déjà un message, essayer de le mettre à jour avec retry
        if (leaderboardMessage) {
            try {
                // Vérifier si le message existe encore avant de le modifier
                const fetchedMessage = await fetchMessageWithRetry(leaderboardMessage);
                if (fetchedMessage) {
                    await fetchedMessage.edit({
                        flags: MessageFlags.IsComponentsV2,
                        components: [components.mainContainer],
                        files: [components.leaderboardThumbnailFile]
                    });
                    console.log('[LEADERBOARD] Leaderboard updated successfully');
                    return;
                } else {
                    console.log('[LEADERBOARD] Message was deleted or unreachable, creating new one');
                    leaderboardMessage = null;
                }
            } catch (error) {
                if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
                    console.warn('[LEADERBOARD] Connection timeout while updating, will retry later');
                    return; // Ne pas recréer immédiatement, laisser le monitoring gérer
                } else if (error.code === 10008) { // Unknown Message
                    console.log('[LEADERBOARD] Message was deleted, creating new one');
                    leaderboardMessage = null;
                } else {
                    console.error('[LEADERBOARD] Error updating leaderboard message:', error);
                    leaderboardMessage = null;
                }
            }
        }

        // Si on n'a pas de message ou s'il a été supprimé, en créer un nouveau
        if (!leaderboardMessage) {
            try {
                // Supprimer les anciens messages de leaderboard (optionnel)
                try {
                    const messages = await leaderboardChannel.messages.fetch({ limit: 10 });
                    const oldLeaderboards = messages.filter(msg => 
                        msg.author.id === guild.client.user.id && 
                        msg.components && 
                        msg.components.some(row => 
                            row.components.some(component => 
                                component.customId && component.customId.includes('leaderboard')
                            )
                        )
                    );
                    
                    if (oldLeaderboards.size > 0) {
                        await leaderboardChannel.bulkDelete(oldLeaderboards);
                    }
                } catch (cleanupError) {
                    console.warn('[LEADERBOARD] Could not cleanup old messages:', cleanupError.message);
                    // Continuer même si le nettoyage échoue
                }

                // Créer le nouveau message avec retry
                leaderboardMessage = await createMessageWithRetry(leaderboardChannel, {
                    flags: MessageFlags.IsComponentsV2,
                    components: [components.mainContainer],
                    files: [components.leaderboardThumbnailFile]
                });
                if (leaderboardMessage) {
                    console.log('[LEADERBOARD] New leaderboard message created');
                } else {
                    console.error('[LEADERBOARD] Failed to create new leaderboard message after retries');
                }
            } catch (error) {
                if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
                    console.warn('[LEADERBOARD] Connection timeout while creating message, will retry later');
                } else {
                    console.error('[LEADERBOARD] Error creating new leaderboard message:', error);
                }
            }
        }

    } catch (error) {
        console.error('[LEADERBOARD] Error updating leaderboard:', error);
        await errorHandler.handleError(error, {
            category: 'leaderboard_system',
            operation: 'update_leaderboard',
            guildId: guild.id
        });
    }
}

// Fonction pour initialiser le leaderboard
async function initializeLeaderboard(guild) {
    try {
        console.log('[LEADERBOARD] Initializing leaderboard for guild:', guild.id);
        await updateLeaderboard(guild);
        
        // Démarrer le monitoring périodique
        startLeaderboardMonitoring(guild);
    } catch (error) {
        console.error('[LEADERBOARD] Error initializing leaderboard:', error);
    }
}

// Fonction pour vérifier si le message du leaderboard existe encore avec retry automatique
async function checkLeaderboardMessage(guild) {
    try {
        if (!leaderboardMessage) {
            // Vérifier si le channel existe avant de créer le message
            const channel = guild.channels.cache.get(TASK_LEADERBOARD_CHANNEL_ID);
            if (!channel) {
                console.log('[LEADERBOARD] Leaderboard channel not found:', TASK_LEADERBOARD_CHANNEL_ID);
                return;
            }
            await updateLeaderboard(guild);
            return;
        }

        // Essayer de récupérer le message avec retry automatique
        const message = await fetchMessageWithRetry(leaderboardMessage);
        if (message) {
            console.log('[LEADERBOARD] Message still exists, no action needed');
            return;
        }

        // Si le message n'existe plus, le recréer
        console.log('[LEADERBOARD] Message was deleted or unreachable, recreating...');
        leaderboardMessage = null;
        await updateLeaderboard(guild);
        
    } catch (error) {
        console.error('[LEADERBOARD] Error in checkLeaderboardMessage:', error);
        // En cas d'erreur critique, essayer de recréer le leaderboard
        if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
            console.warn('[LEADERBOARD] Connection timeout detected, will retry on next interval');
        } else {
            console.error('[LEADERBOARD] Critical error, attempting to recreate leaderboard');
            try {
                leaderboardMessage = null;
                await updateLeaderboard(guild);
            } catch (recreateError) {
                console.error('[LEADERBOARD] Failed to recreate leaderboard after error:', recreateError);
            }
        }
    }
}

// Fonction de retry automatique pour récupérer les messages
async function fetchMessageWithRetry(message, maxRetries = 3, baseDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const fetchedMessage = await message.fetch();
            return fetchedMessage;
        } catch (error) {
            // Gestion spécifique des erreurs de connexion
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1); // Backoff exponentiel
                    console.warn(`[LEADERBOARD] Connection timeout (attempt ${attempt}/${maxRetries}), retry in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    console.error(`[LEADERBOARD] Max retries reached (${maxRetries}) for message fetch`);
                    return null;
                }
            }
            
            // Gestion des erreurs de rate limiting Discord
            if (error.code === 429 || error.message.includes('rate limit')) {
                const retryAfter = error.retry_after || 5;
                console.warn(`[LEADERBOARD] Rate limit hit, waiting ${retryAfter}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            }
            
            // Pour les autres erreurs (comme Unknown Message), retourner null
            if (error.code === 10008) {
                console.log('[LEADERBOARD] Message was deleted (Unknown Message)');
                return null;
            }
            
            // Erreur inattendue, logger et arrêter
            console.error(`[LEADERBOARD] Unexpected error on attempt ${attempt}:`, error);
            return null;
        }
    }
    return null;
}

// Fonction de retry automatique pour créer des messages
async function createMessageWithRetry(channel, content, maxRetries = 3, baseDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const message = await channel.send(content);
            return message;
        } catch (error) {
            // Gestion spécifique des erreurs de connexion
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('Connect Timeout')) {
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1); // Backoff exponentiel
                    console.warn(`[LEADERBOARD] Connection timeout creating message (attempt ${attempt}/${maxRetries}), retry in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    console.error(`[LEADERBOARD] Max retries reached (${maxRetries}) for message creation`);
                    return null;
                }
            }
            
            // Gestion des erreurs de rate limiting Discord
            if (error.code === 429 || error.message.includes('rate limit')) {
                const retryAfter = error.retryAfter || 5;
                console.warn(`[LEADERBOARD] Rate limit hit while creating message, waiting ${retryAfter}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            }
            
            // Pour les autres erreurs, logger et arrêter
            console.error(`[LEADERBOARD] Unexpected error creating message on attempt ${attempt}:`, error);
            return null;
        }
    }
    return null;
}

// Fonction pour démarrer la vérification périodique
function startLeaderboardMonitoring(guild) {
    try {
        // Arrêter l'intervalle existant s'il y en a un
        if (leaderboardCheckInterval) {
            clearInterval(leaderboardCheckInterval);
        }

        // Vérifier toutes les 60 secondes pour éviter de spammer l'API
        leaderboardCheckInterval = setInterval(async () => {
            await checkLeaderboardMessage(guild);
        }, 60000); // 60 secondes (1 minute)

        console.log('[LEADERBOARD] Started periodic monitoring for guild:', guild.id);
    } catch (error) {
        console.error('[LEADERBOARD] Error starting monitoring:', error);
    }
}

// Fonction pour arrêter la vérification périodique
function stopLeaderboardMonitoring() {
    try {
        if (leaderboardCheckInterval) {
            clearInterval(leaderboardCheckInterval);
            leaderboardCheckInterval = null;
            console.log('[LEADERBOARD] Stopped periodic monitoring');
        }
    } catch (error) {
        console.error('[LEADERBOARD] Error stopping monitoring:', error);
    }
}

// Fonction pour forcer la mise à jour du leaderboard
async function forceUpdateLeaderboard(guild) {
    try {
        leaderboardMessage = null; // Forcer la création d'un nouveau message
        await updateLeaderboard(guild);
    } catch (error) {
        console.error('[LEADERBOARD] Error forcing leaderboard update:', error);
    }
}

module.exports = {
    updateLeaderboard,
    initializeLeaderboard,
    forceUpdateLeaderboard,
    startLeaderboardMonitoring,
    stopLeaderboardMonitoring,
    checkLeaderboardMessage,
    createLeaderboardComponents,
    TASK_LEADERBOARD_CHANNEL_ID
}; 
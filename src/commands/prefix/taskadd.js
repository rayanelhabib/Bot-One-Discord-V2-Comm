const { EmbedBuilder } = require('discord.js');
const { dataManager } = require('../../utils/dataManager');
const { errorHandler } = require('../../utils/errorHandler');
const { updateLeaderboard } = require('../../utils/leaderboardManager');

// Configuration des rôles
const STAFF_ROLE_IDS = ['1372723869047328768' , '1372715819649335327'];
const HIGH_ROLE_IDS = ['1373603481524502570' , '1372700459193729126' , '1372700468782039110' , '1373624244897841162' , '1377334338840166420' , '1399199681380094062' , '1377333188191588533' , '1378092097365868688'];

// Utilitaire pour vérifier les rôles
function hasRole(member, roleIds) {
    return member.roles.cache.some(role => roleIds.includes(role.id));
}

// Fonction pour incrémenter le compteur de tâches avec protection contre les conflits
async function incrementTaskCount(guildId, userId, count = 1) {
    try {
        const result = await dataManager.updateUserTaskCount(guildId, userId, count);
        if (result) {
            return await dataManager.getUserTaskCount(guildId, userId);
        }
        return null;
    } catch (error) {
        await errorHandler.handleError(error, {
            category: 'task_system',
            operation: 'increment_task_count',
            guildId,
            userId,
            count
        });
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

module.exports = {
    name: 'taskadd',
    description: 'Add tasks to a user (High role only)',
    async execute(message, args) {
        try {
            const userId = message.author.id;
            const guildId = message.guild.id;

            // Vérifier que l'utilisateur a un rôle high
            if (!hasRole(message.member, HIGH_ROLE_IDS)) {
                return message.reply({ embeds: [createErrorEmbed('⛔ Permission Denied', 'Only high role members can add tasks to other users.', '#FEE75C')] });
            }

            // Vérifier qu'un utilisateur est mentionné ou qu'un ID est fourni
            if (args.length === 0) {
                return message.reply({ embeds: [createErrorEmbed('❌ Missing User', 'Please mention a user or provide a valid user ID.\n\nUsage: `+taskadd @user [number]` or `+taskadd ID [number]`\n\nExample: `+taskadd @user 5` or `+taskadd 123456789 3`', '#FEE75C')] });
            }

            let targetUserId;
            let targetUser;
            let taskCount = 1; // Nombre de tâches par défaut
            
            // Vérifier si c'est une mention ou un ID
            if (message.mentions.users.size > 0) {
                targetUser = message.mentions.users.first();
                targetUserId = targetUser.id;
                
                // Vérifier s'il y a un nombre de tâches spécifié
                if (args[1] && args[1].match(/^\d+$/)) {
                    taskCount = parseInt(args[1]);
                    if (taskCount <= 0) {
                        return message.reply({ embeds: [createErrorEmbed('❌ Invalid Number', 'The number of tasks must be greater than 0.', '#FEE75C')] });
                    }
                    if (taskCount > 100) {
                        return message.reply({ embeds: [createErrorEmbed('❌ Too Many Tasks', 'You can only add up to 100 tasks at once.', '#FEE75C')] });
                    }
                }
            } else if (args[0].match(/^\d+$/)) {
                targetUserId = args[0];
                targetUser = message.client.users.cache.get(targetUserId);
                
                // Vérifier s'il y a un nombre de tâches spécifié
                if (args[1] && args[1].match(/^\d+$/)) {
                    taskCount = parseInt(args[1]);
                    if (taskCount <= 0) {
                        return message.reply({ embeds: [createErrorEmbed('❌ Invalid Number', 'The number of tasks must be greater than 0.', '#FEE75C')] });
                    }
                    if (taskCount > 100) {
                        return message.reply({ embeds: [createErrorEmbed('❌ Too Many Tasks', 'You can only add up to 100 tasks at once.', '#FEE75C')] });
                    }
                }
            } else {
                return message.reply({ embeds: [createErrorEmbed('❌ Invalid User', 'Please mention a user or provide a valid user ID.\n\nUsage: `+taskadd @user [number]` or `+taskadd ID [number]`', '#FEE75C')] });
            }
            
            if (!targetUser) {
                return message.reply({ embeds: [createErrorEmbed('❌ User Not Found', 'The specified user was not found.', '#FEE75C')] });
            }
            
            // Vérifier si l'utilisateur cible est dans le serveur
            const targetMember = message.guild.members.cache.get(targetUserId);
            if (!targetMember) {
                return message.reply({ embeds: [createErrorEmbed('❌ User Not in Server', 'The specified user is not a member of this server.', '#FEE75C')] });
            }
            
            // Vérifier si l'utilisateur cible a un rôle staff
            if (!hasRole(targetMember, STAFF_ROLE_IDS)) {
                return message.reply({ embeds: [createErrorEmbed('❌ User Not Staff', 'The specified user does not have staff permissions.', '#FEE75C')] });
            }
            
                            // Ajouter les tâches à l'utilisateur
                const newCount = await incrementTaskCount(guildId, targetUserId, taskCount);
                if (newCount === null) {
                    return message.reply({ embeds: [createErrorEmbed('❌ System Error', 'Error while adding tasks to user.')] });
                }
                
                const taskText = taskCount === 1 ? 'task' : 'tasks';
                message.reply({ embeds: [createSuccessEmbed(`✅ **${taskCount}** ${taskText} added to **${targetUser.tag}**! They now have **${newCount}** tasks completed.`)] });
                
                // Mettre à jour le leaderboard
                try {
                    await updateLeaderboard(message.guild);
                    console.log(`[TASK LEADERBOARD] Leaderboard updated after task add for ${targetUser.tag} (added by high role member)`);
                } catch (error) {
                    console.error('[TASK LEADERBOARD] Error updating leaderboard after task add:', error);
                }
                
                // Notifier l'utilisateur cible
                try {
                    const taskText = taskCount === 1 ? 'task' : 'tasks';
                    targetUser.send(`🎉 A high role member has added **${taskCount}** ${taskText} to your account! You now have **${newCount}** tasks completed.`);
                } catch (e) {
                    // Ignore si l'utilisateur a les DM fermés
                }
            
        } catch (error) {
            console.error('[TASKADD] Critical error in taskadd command:', error);
            message.reply({ embeds: [createErrorEmbed('❌ System Error', 'An unexpected error occurred. Please try again later.')] });
        }
    }
}; 
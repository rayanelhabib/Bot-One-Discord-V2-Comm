const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const { dataManager } = require('../../utils/dataManager');

// Rôles autorisés
const HIGH_ROLE_IDS = ['1373603481524502570', '1372700459193729126', '1372700468782039110', '1373624244897841162', '1377334338840166420', '1399199681380094062', '1377333188191588533', '1378092097365868688'];

function hasRole(member, roleIds) {
    return member.roles.cache.some(role => roleIds.includes(role.id));
}

function createLeaderboardEmbed(taskData, guild) {
    const sortedUsers = Object.entries(taskData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    let description = '';
    let rank = 1;

    if (sortedUsers.length === 0) {
        description = '📊 **Aucune tâche complétée pour le moment.**\n\nCommencez à utiliser `+task` !';
    } else {
        for (const [userId, taskCount] of sortedUsers) {
            let medal = '';
            if (rank === 1) medal = '🥇';
            else if (rank === 2) medal = '🥈';
            else if (rank === 3) medal = '🥉';
            else medal = `**${rank}.**`;

            description += `${medal} <@${userId}> - **${taskCount}** tâches\n`;
            rank++;
        }
    }

    const totalTasks = Object.values(taskData).reduce((a, b) => a + b, 0);
    const totalParticipants = Object.keys(taskData).length;

    return new EmbedBuilder()
        .setAuthor({ 
            name: '🏆 Task Leaderboard', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTitle('📊 Classement des Staff')
        .setDescription(description)
        .setColor('#5865F2')
        .addFields(
            {
                name: '📈 Total des tâches',
                value: `**${totalTasks}** tâches`,
                inline: true
            },
            {
                name: '👥 Participants',
                value: `**${totalParticipants}** membres`,
                inline: true
            },
            {
                name: '⏰ Mise à jour',
                value: new Date().toLocaleString('fr-FR'),
                inline: true
            }
        )
        .setFooter({ 
            text: 'OneTab - Task Leaderboard • +task pour apparaître !', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
        })
        .setTimestamp();
}

module.exports = {
    name: 'leaderboard',
    description: 'Afficher le classement des tâches',
    async execute(message, args) {
        try {
            if (!hasRole(message.member, HIGH_ROLE_IDS)) {
                return message.reply('⛔ Seuls les membres avec un rôle élevé peuvent voir le leaderboard.');
            }

            const taskData = await dataManager.getTaskData(message.guild.id);
            if (!taskData || Object.keys(taskData).length === 0) {
                return message.reply('ℹ️ Aucune donnée de tâche trouvée. Utilisez `+task` !');
            }

            const leaderboardEmbed = createLeaderboardEmbed(taskData, message.guild);
            await message.reply({ embeds: [leaderboardEmbed] });

            console.log(`[LEADERBOARD] Displayed for ${message.member.user.username}`);

        } catch (error) {
            console.error('[LEADERBOARD] Error:', error);
            message.reply('❌ Erreur lors de l\'affichage du leaderboard.');
        }
    }
}; 
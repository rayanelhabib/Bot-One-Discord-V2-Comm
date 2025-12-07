const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

// Emojis personnalisés ou centralisés (remplace les ID par les tiens si tu veux personnaliser)
const EMOJI_VOICE = '🔊';
const EMOJI_BLACKLIST = '⛔';
const EMOJI_WHITELIST = '✅';
const EMOJI_COOWNERS = '🤝';
const EMOJI_ADD = '➕';
const EMOJI_REMOVE = '➖';
const EMOJI_LIST = '📋';
const EMOJI_CLEAR = '🧹';
const EMOJI_CHANNEL = '🔈';
const EMOJI_LIMIT = '👥';
const EMOJI_RESET = '♻️';
const EMOJI_INFO = 'ℹ️';
const EMOJI_OWNER = '👑';
const EMOJI_LOCK = '🔒';
const EMOJI_UNLOCK = '🔓';
const EMOJI_RENAME = '📝';
const EMOJI_SETTINGS = '⚙️';
const EMOJI_MUTE = '🔇';
const EMOJI_UNMUTE = '🔊';
const EMOJI_HIDE = '🙈';
const EMOJI_UNHIDE = '👁️';
const EMOJI_PERMIT = '✅';
const EMOJI_REJECT = '⛔';
const EMOJI_PERMITROLE = '🟢';
const EMOJI_REJECTROLE = '🔴';
const EMOJI_TLOCK = '💬';
const EMOJI_TUNLOCK = '💬';
const EMOJI_REQUEST = '📩';
const EMOJI_KICK = '👢';
const EMOJI_FM = '🔇';
const EMOJI_FUNM = '🔊';
const EMOJI_CLAIM = '🏆';
const EMOJI_TRANSFER = '👑';
const EMOJI_FEATURES = '✨';
const EMOJI_SETUP = '🛠️';
const EMOJI_ADMIN = '🛡️';
const EMOJI_LISTLINK = '🔗';
const EMOJI_STATUS = '📝';
const EMOJI_TASK = '📋';
const EMOJI_CAM = '📷';
const EMOJI_STREAM = '😤';
const EMOJI_SB = '🔊';
const EMOJI_ARROW = '➡️';

// Pages de détail (créées une seule fois)
const detailPages = {
  commands: new EmbedBuilder()
    .setAuthor({ 
      name: '🔊 Late Night Voice Channel Commands', 
      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
    })
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0x5865F2)
    .setDescription([
      '**Manage your temporary voice channels with ease!**',
      '',
      `${EMOJI_ARROW} __**Channel Management:**__`,
      `${EMOJI_CHANNEL}  .v name <name>  — Rename your channel`,
      `${EMOJI_LIMIT}  .v limit <number>  — Limit users`,
      `${EMOJI_RESET}  .v reset  — Reset channel settings`,
      `${EMOJI_INFO}  .v vcinfo  — Channel info`,
      `${EMOJI_OWNER}  .v owner  — View owner`,
      `${EMOJI_STATUS}  .v status [emoji] [text]  — Set channel status`,
      `${EMOJI_CLEAR}  .v clear  — Kick all users`,
      '',
      `${EMOJI_ARROW} __**Access Control:**__`,
      `${EMOJI_LOCK}  .v lock  — Lock channel`,
      `${EMOJI_UNLOCK}  .v unlock  — Unlock channel`,
      `${EMOJI_HIDE}  .v hide  — Hide channel (Premium)`,
      `${EMOJI_UNHIDE}  .v unhide  — Unhide channel (Premium)`,
      `${EMOJI_PERMIT}  .v permit @user  — Permit user`,
      `${EMOJI_REJECT}  .v reject @user  — Reject user`,
      `${EMOJI_PERMITROLE}  .v permitrole @role  — Permit role`,
      `${EMOJI_REJECTROLE}  .v rejectrole @role  — Reject role`,
      `${EMOJI_TLOCK}  .v tlock  — Lock chat`,
      `${EMOJI_TUNLOCK}  .v tunlock  — Unlock chat`,
      `${EMOJI_REQUEST}  .v request  — Request access`,
      '',
      `${EMOJI_ARROW} __**User Management:**__`,
      `${EMOJI_KICK}  .v kick @user  — Kick user`,
      `${EMOJI_FM}  .v fm  — Mute all`,
      `${EMOJI_FUNM}  .v funm  — Unmute all`,
      `${EMOJI_CLAIM}  .v claim  — Claim ownership`,
      `${EMOJI_TRANSFER}  .v transfer @user  — Transfer ownership`,
      `${EMOJI_TASK}  +task  — Start task timer(only for staff )`,
      '',
      '⚡ Use `.v help <command>` for more details on each command.'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v help commands' }),
  blacklist: new EmbedBuilder()
    .setTitle(`${EMOJI_BLACKLIST} Blacklist System`)
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0xED4245)
    .setDescription([
      '**Block users from joining your voice channels!**',
      '',
      `${EMOJI_ADD}  .v blacklist add @user  or  .v bl add @user`,
      '> Add a user to your blacklist (they will be blocked from your future VCs).',
      '',
      `${EMOJI_REMOVE}  .v blacklist remove @user  or  .v bl remove @user`,
      '> Remove a user from your blacklist.',
      '',
      `${EMOJI_LIST}  .v blacklist list  or  .v bl list`,
      '> View your blacklist.',
      '',
      `${EMOJI_CLEAR}  .v blacklist clear  or  .v bl clear`,
      '> Clear your blacklist.',
      '',
      '⚠️ Blacklist applies to all temporary VCs you create.',
      '',
      '**💡 Tips:**',
      '• Use blacklist to keep unwanted users out',
      '• Combine with whitelist for maximum control',
      '• Blacklist is server-wide for your channels'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v blacklist or .v bl' }),
  whitelist: new EmbedBuilder()
    .setTitle(`${EMOJI_WHITELIST} Whitelist System`)
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0x57F287)
    .setDescription([
      '**Allow only trusted users to join your voice channels!**',
      '',
      `${EMOJI_ADD}  .v whitelist add @user  or  .v wl add @user`,
      '> Add a user to your whitelist (they will always be able to join your VCs).',
      '',
      `${EMOJI_REMOVE}  .v whitelist remove @user  or  .v wl remove @user`,
      '> Remove a user from your whitelist.',
      '',
      `${EMOJI_LIST}  .v whitelist list  or  .v wl list`,
      '> View your whitelist.',
      '',
      `${EMOJI_CLEAR}  .v whitelist clear  or  .v wl clear`,
      '> Clear your whitelist.',
      '',
      '⚠️ Whitelist applies to all temporary VCs you create.',
      '',
      '**💡 Tips:**',
      '• Use whitelist for exclusive channels',
      '• Perfect for private meetings or events',
      '• Whitelist overrides blacklist for specific users'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v whitelist or .v wl' }),
  manager: new EmbedBuilder()
    .setTitle(`${EMOJI_COOWNERS} Manager (Co-Owner) System`)
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0x5865F2)
    .setDescription([
      `**Easily share channel management with trusted users!**`,
      '',
      `${EMOJI_ADD}  .v manager add @user  or  .v manager add <ID>` +
      '\n` .v man add @user ` or `.v man add <ID>`',
      '> Add a user as manager (co-owner) of your voice channel.',
      '',
      `${EMOJI_REMOVE}  .v manager remove @user  or  .v manager remove <ID>` +
      '\n` .v man remove @user ` or `.v man remove <ID>`',
      '> Remove a user from your managers.',
      '',
      `${EMOJI_CLEAR}  .v manager clear  or  .v man clear`,
      '> Remove all managers from your channel.',
      '',
      `${EMOJI_LIST}  .v manager show  or  .v man show`,
      '> List all current managers (co-owners) of your channel.',
      '',
      '**Managers can:**',
      '- Manage the channel (rename, limit, kick, mute, etc.)',
      '- Help you moderate your voice room',
      '- Use all voice commands except transfer ownership',
      '',
      '⚠️ Only the channel owner can manage the managers list.',
      '',
      '**💡 Tips:**',
      '• Choose trusted friends as managers',
      '• Managers can help moderate when you\'re away',
      '• Perfect for team leaders and moderators'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v manager or .v man' }),
  features: new EmbedBuilder()
    .setTitle(`${EMOJI_FEATURES} Voice Channel Features`)
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0xFEE75C)
    .setDescription([
      '**Enhance your voice experience with extra features!**',
      '',
      `${EMOJI_FEATURES}  .v activity on  — Enable activities`,
      '> Watch Together, Poker Night, Chess, and more interactive activities.',
      '',
      `${EMOJI_CAM}  .v cam on  — Enable camera`,
      '> Allow video sharing in your voice channel.',
      '',
      `${EMOJI_STREAM}  .v stream on  — Enable stream`,
      '> Enable screen sharing and streaming capabilities.',
      '',
      `${EMOJI_SB}  .v sb on  — Enable soundboard`,
      '> Play sound effects and music through the soundboard.',
      '',
      '**To disable any feature, use:**',
      '`.v activity off`, `.v cam off`, `.v stream off`, `.v sb off`',
      '',
      '✨ Try these features in your voice channel!',
      '',
      '**💡 Tips:**',
      '• Activities require 2+ users to work properly',
      '• Some features may need specific permissions',
      '• Great for gaming sessions and group activities'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v help features' }),
  setup: new EmbedBuilder()
    .setTitle(`${EMOJI_SETUP} Setup Commands`)
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0x5865F2)
    .setDescription([
      '**Server administrators can configure the bot for your community.**',
      '',
      `${EMOJI_SETUP}  .v setup  — Start the setup process`,
      '> Interactive setup wizard to configure voice channel creation.',
      '',
      '**Setup includes:**',
      '- Voice channel creation settings',
      '- Permission configurations',
      '- Role assignments',
      '- Channel naming patterns',
      '',
      '**Requirements:**',
      '- Administrator permissions',
      '- Manage channels permission',
      '- Manage roles permission',
      '',
      '⚙️ More setup options coming soon!',
      '',
      '**💡 Tips:**',
      '• Run setup in a dedicated admin channel',
      '• Test the setup with a few users first',
      '• Keep backup of your current settings'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v help setup' }),
  admin: new EmbedBuilder()
    .setTitle(`${EMOJI_ADMIN} Admin Commands`)
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0xED4245)
    .setDescription([
      '**Reserved for server administrators.**',
      '',
      `${EMOJI_ADMIN}  .v admin  — Admin panel (coming soon)`,
      '> Server-wide voice channel management and analytics.',
      '',
      '**Future admin features:**',
      '- Server-wide voice channel overview',
      '- User permission management',
      '- Bot configuration settings',
      '- Analytics and statistics',
      '- Advanced moderation tools',
      '',
      '🔒 Only users with admin permissions can use these commands.',
      '',
      '**💡 Tips:**',
      '• Admin panel will provide detailed server insights',
      '• Monitor voice channel usage and activity',
      '• Manage bot settings across the entire server'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v help admin' }),
  task: new EmbedBuilder()
    .setTitle(`${EMOJI_TASK} Task System (Special Prefix)`)
    .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
    .setColor(0x5865F2)
    .setDescription([
      '**Staff task management system for voice channel activities!**',
      '',
      '⚠️ **Note:** This command uses the special prefix `+` instead of `.v`',
      '',
      `${EMOJI_TASK}  +task  — Start task timer`,
      '> Start a 20-minute timer when you have 5+ members in your VC.',
      '',
      `${EMOJI_TASK}  +task  — AUTOMATIC completion`,
      '> Tasks are automatically counted after 20 minutes! No need to claim.',
      '',
      `${EMOJI_TASK}  +task list  — View task statistics`,
      '> View all staff members and their completed tasks (High roles only).',
      '',
      `${EMOJI_TASK}  +task clear  — Reset task data`,
      '> Clear all task data from the server (Owners only).',
      '',
      `${EMOJI_TASK}  +leaderboard  — View task leaderboard`,
      '> View the top 10 staff members by completed tasks (High roles only).',
      '',
      '⚠️ **Requirements to start a task:**',
      '• Must be in a voice channel',
      '• Must have staff role',
      '• Must be the channel creator',
      '• Must have 5+ members in the channel',
      '',
      '⏰ **Process:**',
      '1. Use `+task` to start the timer',
      '2. Stay 20 minutes with 5+ members',
      '3. ✅ **AUTOMATIC :** Task is automatically counted!',
      '',
      '**💡 Tips:**',
      '• Perfect for staff activity tracking',
      '• Great for community engagement',
      '• Monitor staff performance and activity',
      '• ✅ **Fully automatic** - no manual claiming needed!'
    ].join('\n'))
    .setFooter({ text: 'OneTab - Voice management | Use .v help task' })
};

// Mapping des alias pour les sous-commandes
const aliasMap = {
  commands: 'commands',
  bl: 'blacklist',
  blacklist: 'blacklist',
  wl: 'whitelist',
  whitelist: 'whitelist',
  'co-owners': 'manager',
  coowners: 'manager',
  manager: 'manager',
  setup: 'setup',
  admin: 'admin',
  features: 'features',
  task: 'task',
  lb: 'leaderboard',
  leaderboard: 'leaderboard'
};

module.exports = {
  name: 'help',
  description: 'Show help menu for voice channel commands',
  usage: '.v help',
  async execute(message, args, client) {
    // Gestion des sous-commandes textuelles pour chaque catégorie (optimisée)
    if (args[0]) {
      const key = args[0].toLowerCase();
      const embedKey = aliasMap[key];
      if (embedKey && detailPages[embedKey]) {
        return message.reply({ embeds: [detailPages[embedKey]] });
      }
    }

    // Boutons pour les différentes catégories (constante)
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('commands')
        .setLabel('Commands')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:badge:1410413998335328318>'),
      new ButtonBuilder()
        .setCustomId('features')
        .setLabel('Features')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:badge:1410413998335328318>'),
      new ButtonBuilder()
        .setCustomId('blacklist')
        .setLabel('Blacklist')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:badge:1410413998335328318>'),
      new ButtonBuilder()
        .setCustomId('whitelist')
        .setLabel('Whitelist')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('<:badge:1410413998335328318>')
    );



    // Embed principal (constante)
    const serverName = message.guild.name;
    const mainEmbed = new EmbedBuilder()
      .setAuthor({ 
        name: 'Help Commands | Late Night Community', 
        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
      })
      .setThumbnail('https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024')
      .setDescription(
        `**We are thrilled to introduce our latest addition to the server, Serinas**\n\n` +
        `> My Prefix : .v\n\n` +
        `${EMOJI_VOICE} **・Voice Commands**\n` +
        '<:badge:1410413998335328318> ` .v help commands `\n\n' +
        `${EMOJI_BLACKLIST} **・BlackList Commands**\n` +
        '<:badge:1410413998335328318> ` .v help bl `\n\n' +
        `${EMOJI_WHITELIST} **・Whitelist Commands**\n` +
        '<:badge:1410413998335328318> ` .v help wl `\n\n' +
        `${EMOJI_COOWNERS} **・Manager (Co-Owner) Commands**\n` +
        '<:badge:1410413998335328318> ` .v help manager `\n\n' +
        `${EMOJI_TASK} **・Task System (Special Prefix)**\n` +
        '<:badge:1410413998335328318> ` +task ` \n\n' +
        `**Use:** \` .v help setup \` To See Setup Commands\n\n` +
        `**Use:** \` .v help admin \` To See Admin Commands\n\n` +
        `**Use:** \` .v help features \` To See Voice Features\n\n` +
        `${EMOJI_LISTLINK} **Links:** [Support](your_link) | [InviteBot](your_link) | [Vote](your_link)`
      )
      .setColor('#5865F2')
      .setFooter({ text: 'OneTab - Voice management' });

    await message.reply({
      embeds: [mainEmbed],
      components: [row1]
    }).then(reply => {
      // Création du collector pour les boutons
      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300_000 // 5 minutes
      });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: '❌ Only the command author can use these buttons.',
            ephemeral: true
          });
        }

        const page = detailPages[interaction.customId];
        if (page) {
          await interaction.reply({
            embeds: [page],
            ephemeral: true
          });
        } else if (interaction.customId === 'help_main') {
          // Ancien code supprimé : retour au menu principal
        }
      });

      collector.on('end', async () => {
        try {
          // Ne rien faire à la fin du collector pour garder les boutons visibles
        } catch (_) {}
      });
    });
  }
};
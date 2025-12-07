const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags
  } = require('discord.js');
  
  const {
    SectionBuilder,
    ThumbnailBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ContainerBuilder,
    MediaGalleryBuilder
  } = require('@discordjs/builders');
  
  const BOT_CONFIG = require('./config');
  
  // 🎨 Configuration des couleurs et emojis
  const COLORS = {
    PRIMARY: 0x5865F2,    // Bleu Discord
    SUCCESS: 0x57F287,    // Vert
    DANGER: 0xED4245,     // Rouge
    WARNING: 0xFEE75C,    // Jaune
    INFO: 0x5BC0DE,       // Cyan
    PREMIUM: 0xFF73FA     // Rose/Magenta
  };
  
  const EMOJIS = {
    BOT: '🤖',
    VOICE: '🔊',
    LOCK: '🔒',
    TEAM: '👥',
    ADMIN: '👨‍💼',
    CHANNEL: '📢',
    ADD: '➕',
    SUCCESS: '✅',
    INFO: 'ℹ️',
    SPARKLES: '✨',
    SETTINGS: '⚙️',
    SHIELD: '🛡️',
    INVITE: '🔗',
    SUPPORT: '🆘',
    STATS: '📊',
    PREMIUM: '💎',
    GITHUB: '📱',
    DISCORD: '💬'
  };
  
  // URLs des médias
  const MEDIA_GALLERY = {
    THUMBNAILS: {
      BOT_MAIN: 'https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif',
      VOICE: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/voice_thumb.png',
      ADMIN: 'https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif',
      SUPPORT: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/support_thumb.png'
    }
  };
  
  /**
   * Crée les composants V2 pour le message de mention du bot
   * @param {Client} client - Le client Discord
   * @param {Guild} guild - Le serveur où le bot a été mentionné
   * @returns {Array} Les composants V2
   */
  function createMentionComponents(client, guild) {
    // Section principale avec informations du bot (simplifiée)
    const mainSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(`# <:cropped_circle_image2:1416431817006776360> Welcome to OneTab Bot!
  
  > **Professional Voice Channel Management System**
  > **Create, manage and control voice channels instantly**`)
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          .setDescription("OneTab Voice Management Bot")
      );
  
    // Section des statistiques du bot (simplifiée)
    const statsSection = new SectionBuilder()
      .addTextDisplayComponents(
        /*new TextDisplayBuilder()
          .setContent(`### <:soutientechnique:1413960321625755739> **Bot Statistics**
  
  • **Servers:** /*${client.guilds.cache.size.toLocaleString()}
  • **Users:** ${client.users.cache.size.toLocaleString()}
  • **Uptime:** ${formatUptime(client.uptime)}
  • **Support:** 24/7 Available
  
  > **Need help? Join our support server: [Support Server](https://discord.gg/wyWGcKWssQ)**`)
      )*/
        new TextDisplayBuilder()
          .setContent(`### <:soutientechnique:1413960321625755739> **Bot Statistics**
  
  • **Servers:** 9
  • **Users:** 4367
  • **Uptime:** ${formatUptime(client.uptime)}
  • **Support:** 24/7 Available
  
  > **Need help? Join our support server: [Support Server](https://discord.gg/wyWGcKWssQ)**`)
      )
      .setThumbnailAccessory(
        new ThumbnailBuilder()
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          .setDescription("Bot Statistics")
      );
  
    // MediaGallery pour remplacer le texte des fonctionnalités
    const mediaGallery = new MediaGalleryBuilder()
      .addItems(
        mediaGalleryItem => mediaGalleryItem
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1416429025202667642/telechargement_4.gif')
      );
  
    // Boutons principaux (simplifiés)
    const actionRow1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Invite Bot')
          .setStyle(ButtonStyle.Link)
          .setURL(BOT_CONFIG.INVITE_URL),
        new ButtonBuilder()
          .setLabel('Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL(BOT_CONFIG.SUPPORT_SERVER)
      );
  
  
    // Container principal (simplifié)
    const mainContainer = new ContainerBuilder()
      .addSectionComponents(mainSection)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addMediaGalleryComponents(mediaGallery)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addSectionComponents(statsSection)
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(actionRow1);
  
    return {
      components: [mainContainer],
      files: []
    };
  }
  
  /**
   * Formate le temps de fonctionnement du bot
   * @param {number} uptime - Temps en millisecondes
   * @returns {string} Temps formaté
   */
  function formatUptime(uptime) {
    const days = Math.floor(uptime / 86400000);
    const hours = Math.floor((uptime % 86400000) / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  /**
   * Gère les interactions des boutons de mention
   * @param {Interaction} interaction - L'interaction Discord
   */
  async function handleMentionInteraction(interaction) {
    const { customId } = interaction;
    
    try {
      switch (customId) {
        case 'bot_invite':
          await handleInviteBot(interaction);
          break;
        case 'bot_support':
          await handleSupportServer(interaction);
          break;
        case 'bot_premium':
          await handlePremiumFeatures(interaction);
          break;
        case 'bot_stats':
          await handleBotStats(interaction);
          break;
        case 'bot_help':
          await handleQuickHelp(interaction);
          break;
        default:
          if (customId.startsWith('bot_features_menu')) {
            await handleFeatureMenu(interaction);
          }
          break;
      }
    } catch (error) {
      console.error(`[MENTION HANDLER] Error handling interaction ${customId}:`, error);
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        ephemeral: true
      });
    }
  }
  
  /**
   * Gère l'invitation du bot
   */
  async function handleInviteBot(interaction) {
    const inviteUrl = BOT_CONFIG.INVITE_URL.replace('1409259003481165876', interaction.client.user.id);
    const permissions = BOT_CONFIG.REQUIRED_PERMISSIONS.map(p => `• ${p}`).join('\n');
    
    await interaction.reply({
      content: `🔗 **Invite OneTab Bot to your server!**\n\n[Click here to invite](${inviteUrl})\n\n**Required Permissions:**\n${permissions}`,
      ephemeral: true
    });
  }
  
  /**
   * Gère le serveur de support
   */
  async function handleSupportServer(interaction) {
    await interaction.reply({
      content: `🆘 **Need Help? Join our Support Server!**\n\n[Discord Support Server](${BOT_CONFIG.SUPPORT_SERVER})\n\n**What you'll find:**\n• ${BOT_CONFIG.STATS.SUPPORT_AVAILABILITY} Support\n• Feature Requests\n• Bug Reports\n• Community Help\n• Beta Testing`,
      ephemeral: true
    });
  }
  
  
  /**
   * Gère les fonctionnalités premium
   */
  async function handlePremiumFeatures(interaction) {
    const features = BOT_CONFIG.PREMIUM_FEATURES.map(f => `• ${f}`).join('\n');
    
    await interaction.reply({
      content: `💎 **Premium Features Available!**\n\n**What you get:**\n${features}\n\n**Pricing:**\n• Monthly: $${BOT_CONFIG.PRICING.MONTHLY}\n• Yearly: $${BOT_CONFIG.PRICING.YEARLY} (Save ${BOT_CONFIG.PRICING.YEARLY_SAVINGS}%)\n\n[Get Premium Now](${BOT_CONFIG.PREMIUM_URL})`,
      ephemeral: true
    });
  }
  
  /**
   * Gère les statistiques du bot
   */
  async function handleBotStats(interaction) {
    const client = interaction.client;
    const uptime = formatUptime(client.uptime);
    
    await interaction.reply({
      content: `📊 **Bot Statistics**\n\n**General:**\n• Servers: ${client.guilds.cache.size.toLocaleString()}\n• Users: ${client.users.cache.size.toLocaleString()}\n• Uptime: ${uptime}\n• Commands: ${BOT_CONFIG.STATS.COMMANDS_COUNT}+\n• Features: ${BOT_CONFIG.STATS.FEATURES_COUNT}+\n\n**Performance:**\n• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n• Node.js: ${process.version}\n• Discord.js: ${require('discord.js').version}`,
      ephemeral: true
    });
  }
  
  /**
   * Gère l'aide rapide
   */
  async function handleQuickHelp(interaction) {
    await interaction.reply({
      content: `ℹ️ **Quick Help**\n\n**Getting Started:**\n1. Use \`+setup\` to configure voice channels\n2. Join a voice channel to create your own\n3. Use the buttons to manage your channel\n\n**Need More Help?**\n• Use \`+help\` for full command list\n• Join our [Support Server](${BOT_CONFIG.SUPPORT_SERVER})\n• Check our [Documentation](${BOT_CONFIG.DOCS_URL})`,
      ephemeral: true
    });
  }
  
  /**
   * Gère le menu des fonctionnalités
   */
  async function handleFeatureMenu(interaction) {
    const selectedValue = interaction.values[0];
    
    const featureInfo = {
      'feature_voice': {
        title: '🔊 Voice Channel Management',
        description: 'Create, manage, and control voice channels automatically.',
        details: '• Auto-create channels when users join\n• Custom channel names and limits\n• Automatic cleanup when empty\n• Voice activity detection'
      },
      'feature_permissions': {
        title: '🔒 Permission System',
        description: 'Advanced permission controls for your channels.',
        details: '• Lock/unlock channels\n• Hide/show channels\n• Permit/deny specific users\n• Role-based access control'
      },
      'feature_team': {
        title: '👥 Team Management',
        description: 'Manage your team and assign roles easily.',
        details: '• Transfer channel ownership\n• Assign channel managers\n• Team member permissions\n• Collaboration tools'
      },
      'feature_security': {
        title: '🛡️ Security Features',
        description: 'Keep your server secure with advanced protection.',
        details: '• Anti-spam protection\n• User verification\n• Channel monitoring\n• Automatic moderation'
      },
      'feature_premium': {
        title: '💎 Premium Features',
        description: 'Unlock advanced capabilities with premium.',
        details: '• Unlimited channels\n• Custom themes\n• Priority support\n• Beta features\n• Advanced analytics'
      }
    };
    
    const feature = featureInfo[selectedValue];
    if (feature) {
      await interaction.reply({
        content: `**${feature.title}**\n\n${feature.description}\n\n**Features:**\n${feature.details}`,
        ephemeral: true
      });
    }
  }
  
  module.exports = {
    createMentionComponents,
    handleMentionInteraction,
    formatUptime
  };
  
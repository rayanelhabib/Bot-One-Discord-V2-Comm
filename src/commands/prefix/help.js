const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  TextDisplayBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SeparatorBuilder,
  AttachmentBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  ContainerBuilder
} = require('discord.js');
const { detailPages } = require('../../utils/helpPages');

// ===== EMOJIS CENTRALISÉS =====
const EMOJIS = {
  // Catégories principales
  VOICE: '🔊',
  BLACKLIST: '⛔',
  WHITELIST: '✅',
  MANAGER: '🤝',
  FEATURES: '✨',
  SETUP: '🛠️',
  ADMIN: '🛡️',
  TASK: '📋',
  
  // Actions
  ADD: '➕',
  REMOVE: '➖',
  LIST: '📋',
  CLEAR: '🧹',
  ARROW: '➡️',
  
  // Commandes
  CHANNEL: '🔈',
  LIMIT: '👥',
  RESET: '♻️',
  INFO: 'ℹ️',
  OWNER: '👑',
  LOCK: '🔒',
  UNLOCK: '🔓',
  RENAME: '📝',
  SETTINGS: '⚙️',
  MUTE: '🔇',
  UNMUTE: '🔊',
  HIDE: '🙈',
  UNHIDE: '👁️',
  PERMIT: '✅',
  REJECT: '⛔',
  PERMITROLE: '🟢',
  REJECTROLE: '🔴',
  TLOCK: '💬',
  TUNLOCK: '💬',
  REQUEST: '📩',
  KICK: '👢',
  FM: '🔇',
  FUNM: '🔊',
  CLAIM: '🏆',
  TRANSFER: '👑',
  STATUS: '📝',
  CAM: '📷',
  STREAM: '😤',
  SB: '🔊',
  LISTLINK: '🔗'
};

// ===== MAPPING DES ALIAS =====
const aliasMap = {
  commands: 'commands',
  bl: 'blacklist',
  blacklist: 'blacklist',
  wl: 'whitelist',
  whitelist: 'whitelist',
  'co-owners': 'manager',
  coowners: 'manager',
  manager: 'manager',
  man: 'manager',
  setup: 'setup',
  admin: 'admin',
  features: 'features',
  task: 'task',
  lb: 'leaderboard',
  leaderboard: 'leaderboard'
};

// ===== FONCTION PRINCIPALE =====
module.exports = {
  name: 'help',
  description: 'Show help menu for voice channel commands',
  usage: '.v help [category]',
  
  async execute(message, args, client) {
    // Gestion des sous-commandes textuelles
    if (args[0]) {
      const key = args[0].toLowerCase();
      const pageKey = aliasMap[key];
      
      if (pageKey && detailPages[pageKey]) {
        const page = detailPages[pageKey];
        
        // === DISCORD COMPONENTS V2 RESPONSE (comme dans voiceStateUpdate.js) ===
        // Thumbnail pour les pages de détail (URL directe)
        
        const titleText = new TextDisplayBuilder().setContent(`# ${page.title}`);
        const contentText = new TextDisplayBuilder().setContent(page.content);
        const footerText = new TextDisplayBuilder().setContent(page.footer);

        // Section principale avec thumbnail (comme dans voiceStateUpdate.js)
        const detailSection = new SectionBuilder()
          .addTextDisplayComponents(titleText, contentText)
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription(`${page.title} - Help System`)
              .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          );

        const backButton = new ButtonBuilder()
          .setCustomId('help_back_to_main')
          .setLabel('← Back to Main Menu')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🏠');

        const separator = new SeparatorBuilder().setDivider(true);
        const buttonActionRow = new ActionRowBuilder().addComponents(backButton);

        // Container principal (comme dans voiceStateUpdate.js)
        const detailContainer = new ContainerBuilder()
          .addSectionComponents(detailSection)
          .addTextDisplayComponents(footerText)
          .addSeparatorComponents(separator)
          .addActionRowComponents(buttonActionRow);

        return message.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [detailContainer]
        });
      }
    }

    // === PANEL PRINCIPAL HELP (DISCORD COMPONENTS V2) ===
    const serverName = message.guild.name;
    
    // Thumbnail pour le message help principal (URL directe)
    
    // --- Main Help Components (comme dans voiceStateUpdate.js) ---
    const titleText = new TextDisplayBuilder().setContent(`# <:cropped_circle_image:1414200758877950054>  ${serverName} Help Commands`);

    const descriptionText = new TextDisplayBuilder().setContent(
      `> **🎤 Welcome to Sorane OneTab Voice Management System!**
> **•  Create instant temporary voice channels with advanced controls**
> **•  Share management with trusted users and block unwanted guests**

**My Prefix:** \`.v\``
    );

    const footerText = new TextDisplayBuilder().setContent(`OneTab - Voice management | Use the menu below to navigate`);

    // Section principale avec thumbnail (comme dans voiceStateUpdate.js)
    const mainSection = new SectionBuilder()
      .addTextDisplayComponents(titleText, descriptionText)
      .setThumbnailAccessory(
        thumbnail => thumbnail
          .setDescription('Help System - Voice Management')
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
      );

    // --- Interactive Components ---
    const selectMenuOptions = [
      {
        label: 'Voice Commands',
        description: 'All voice channel management commands',
        value: 'voice',
        emoji: EMOJIS.VOICE
      },
      {
        label: 'Blacklist System',
        description: 'Block users from your voice channels',
        value: 'blacklist',
        emoji: EMOJIS.BLACKLIST
      },
      {
        label: 'Whitelist System',
        description: 'Allow only trusted users',
        value: 'whitelist',
        emoji: EMOJIS.WHITELIST
      },
      {
        label: 'Manager System',
        description: 'Share channel management with trusted users',
        value: 'manager',
        emoji: EMOJIS.MANAGER
      },
      {
        label: 'Voice Features',
        description: 'Enable activities, camera, soundboard, etc.',
        value: 'features',
        emoji: EMOJIS.FEATURES
      },
      {
        label: 'Setup Commands',
        description: 'Server administrator configuration',
        value: 'setup',
        emoji: EMOJIS.SETUP
      },
      {
        label: 'Admin Commands',
        description: 'Server-wide management tools',
        value: 'admin',
        emoji: EMOJIS.ADMIN
      },
      {
        label: 'Task System',
        description: 'Staff task management system',
        value: 'task',
        emoji: EMOJIS.TASK
      }
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help-category-select')
      .setPlaceholder('🔍 Choose a help category')
      .addOptions(selectMenuOptions.map(option => 
      new StringSelectMenuOptionBuilder()
          .setLabel(option.label)
          .setValue(option.value)
          .setDescription(option.description)
          .setEmoji(option.emoji)
      ));

    const supportButton = new ButtonBuilder()
      .setLabel('Support Server')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/wyWGcKWssQ');

    const inviteButton = new ButtonBuilder()
      .setLabel('Invite Bot')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/wyWGcKWssQ');

    const voteButton = new ButtonBuilder()
      .setLabel('Vote')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/wyWGcKWssQ');

    const separator = new SeparatorBuilder().setDivider(true);
    
    const menuActionRow = new ActionRowBuilder().addComponents(selectMenu);
    const buttonActionRow = new ActionRowBuilder().addComponents(supportButton, inviteButton, voteButton);

    // === MESSAGE HELP PRINCIPAL AVEC DISCORD COMPONENTS V2 ===
    // Test si Discord Components V2 est supporté
    const isComponentsV2Supported = typeof MessageFlags.IsComponentsV2 !== 'undefined';
    
    if (isComponentsV2Supported) {
      try {
        // Container principal (comme dans voiceStateUpdate.js)
        const mainContainer = new ContainerBuilder()
          .addSectionComponents(mainSection)
          .addSeparatorComponents(separator)
          .addTextDisplayComponents(footerText)
          .addSeparatorComponents(separator)
          .addActionRowComponents(menuActionRow, buttonActionRow);

        const sentMessage = await message.channel.send({
          flags: MessageFlags.IsComponentsV2,
          components: [mainContainer]
        });
        
      // Création du collector pour les boutons et menus
        const collector = sentMessage.createMessageComponentCollector({
        time: 300_000 // 5 minutes
      });

      collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: '❌ Only the command author can use these buttons.',
            ephemeral: true
          });
        }

        // Gestion des boutons d'action rapide
        if (interaction.isButton()) {
            // Gestion du bouton "Back to Main Menu"
            if (interaction.customId === 'help_back_to_main') {
              // Revenir au menu principal avec la méthode de voiceStateUpdate.js
              const serverName = message.guild.name;
              
              // Thumbnail pour le menu principal (URL directe)
              
              const titleText = new TextDisplayBuilder().setContent(`# <:HG:1412963551697567856> Sorae Help `);
              const descriptionText = new TextDisplayBuilder().setContent(
                `> **🎤 Welcome to OneTab Voice Management System!**
> **•  Create instant temporary voice channels with advanced controls**
> **•  Lock, hide, mute, and customize your private voice space**
> **•  Share management with trusted users and block unwanted guests**

**My Prefix:** \`.v\``
              );
              const footerText = new TextDisplayBuilder().setContent(`OneTab - Voice management | Use the menu below to navigate`);

              // Section principale avec thumbnail (comme dans voiceStateUpdate.js)
              const mainSection = new SectionBuilder()
                .addTextDisplayComponents(titleText, descriptionText)
                .setThumbnailAccessory(
                  thumbnail => thumbnail
                    .setDescription('Help System - Voice Management')
                    .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
                );

              const selectMenuOptions = [
                { label: 'Voice Commands', description: 'All voice channel management commands', value: 'voice', emoji: EMOJIS.VOICE },
                { label: 'Blacklist System', description: 'Block users from your voice channels', value: 'blacklist', emoji: EMOJIS.BLACKLIST },
                { label: 'Whitelist System', description: 'Allow only trusted users', value: 'whitelist', emoji: EMOJIS.WHITELIST },
                { label: 'Manager System', description: 'Share channel management with trusted users', value: 'manager', emoji: EMOJIS.MANAGER },
                { label: 'Voice Features', description: 'Enable activities, camera, soundboard, etc.', value: 'features', emoji: EMOJIS.FEATURES },
                { label: 'Setup Commands', description: 'Server administrator configuration', value: 'setup', emoji: EMOJIS.SETUP },
                { label: 'Admin Commands', description: 'Server-wide management tools', value: 'admin', emoji: EMOJIS.ADMIN },
                { label: 'Task System', description: 'Staff task management system', value: 'task', emoji: EMOJIS.TASK }
              ];

              const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('help-category-select')
                .setPlaceholder('🔍 Choose a help category')
                .addOptions(selectMenuOptions.map(option => 
                  new StringSelectMenuOptionBuilder()
                    .setLabel(option.label)
                    .setValue(option.value)
                    .setDescription(option.description)
                    .setEmoji(option.emoji)
                ));

              const supportButton = new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/wyWGcKWssQ');

              const inviteButton = new ButtonBuilder()
                .setLabel('Invite Bot')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/wyWGcKWssQ');

              const voteButton = new ButtonBuilder()
                .setLabel('Vote')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/wyWGcKWssQ');

              const separator = new SeparatorBuilder().setDivider(true);
              const menuActionRow = new ActionRowBuilder().addComponents(selectMenu);
              const buttonActionRow = new ActionRowBuilder().addComponents(supportButton, inviteButton, voteButton);

              // Container principal (comme dans voiceStateUpdate.js)
              const mainContainer = new ContainerBuilder()
                .addSectionComponents(mainSection)
                .addSeparatorComponents(separator)
                .addTextDisplayComponents(footerText)
                .addSeparatorComponents(separator)
                .addActionRowComponents(menuActionRow, buttonActionRow);

              try {
                await interaction.reply({
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                  components: [mainContainer]
                });
                return;
              } catch (error) {
                if (error.code === 10062) {
                  return;
                }
                throw error;
              }
            }
            
          const pageKey = interaction.customId.replace('help_', '');
          const page = detailPages[pageKey];
          
        if (page) {
              // Page de détail avec la méthode de voiceStateUpdate.js
              // Thumbnail pour les pages de détail (URL directe)
              
              const titleText = new TextDisplayBuilder().setContent(`# ${page.title}`);
              const contentText = new TextDisplayBuilder().setContent(page.content);
              const footerText = new TextDisplayBuilder().setContent(page.footer);

              // Section principale avec thumbnail (comme dans voiceStateUpdate.js)
              const detailSection = new SectionBuilder()
                .addTextDisplayComponents(titleText, contentText)
                .setThumbnailAccessory(
                  thumbnail => thumbnail
                    .setDescription(`${page.title} - Help System`)
                    .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
                );

              const backButton = new ButtonBuilder()
                .setCustomId('help_back_to_main')
                .setLabel('← Back to Main Menu')
          .setStyle(ButtonStyle.Secondary)
                .setEmoji('🏠');

              const separator = new SeparatorBuilder().setDivider(true);
              const buttonActionRow = new ActionRowBuilder().addComponents(backButton);

              // Container principal (comme dans voiceStateUpdate.js)
              const detailContainer = new ContainerBuilder()
                .addSectionComponents(detailSection)
                .addTextDisplayComponents(footerText)
                .addSeparatorComponents(separator)
                .addActionRowComponents(buttonActionRow);

          try {
                await interaction.reply({
                  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                  components: [detailContainer]
                });
                return;
          } catch (error) {
            if (error.code === 10062) {
              return;
            }
            throw error;
          }
          }
        }
        
        // Gestion du menu de sélection (géré dans interactionCreate.js)
        if (interaction.isStringSelectMenu()) {
          return;
        }
      });

      collector.on('end', async () => {
        try {
          // Ne rien faire à la fin du collector pour garder les boutons visibles
        } catch (_) {}
      });
      } catch (error) {
        console.error('[HELP] Discord Components V2 Error:', error);
        // Fallback vers un message simple
        return message.reply({
          content: `# <:cropped_circle_image:1414200758877950054> Help Commands | ${serverName}

> **🎤 Welcome to OneTab Voice Management System!**
> **•  Create instant temporary voice channels with advanced controls**
> **•  Lock, hide, mute, and customize your private voice space**
> **•  Share management with trusted users and block unwanted guests**

**My Prefix:** \`.v\`

### 🔊 Voice Commands
• \`.v help commands\` — All voice channel commands

### ⛔ Blacklist System  
• \`.v help bl\` — Blacklist management commands

### ✅ Whitelist System
• \`.v help wl\` — Whitelist management commands

### 🤝 Manager System
• \`.v help manager\` — Co-owner management commands

### ✨ Voice Features
• \`.v help features\` — Activities, camera, streaming, soundboard

### 🛠️ Setup & Admin
• \`.v help setup\` — Setup commands
• \`.v help admin\` — Admin commands

### 🔗 Support & Links
• [Support Server](https://discord.gg/wyWGcKWssQ) — Get help
• [Invite Bot](https://discord.gg/wyWGcKWssQ) — Add to your server  
• [Vote](https://discord.gg/wyWGcKWssQ) — Support us

**OneTab - Voice management | Use .v help [category]**`
        });
      }
    } else {
      // Fallback si Discord Components V2 n'est pas supporté
      return message.reply({
        content: `# <:cropped_circle_image:1414200758877950054> Help Commands | ${serverName}

> **🎤 Welcome to OneTab Voice Management System!**
> **•  Create instant temporary voice channels with advanced controls**
> **•  Lock, hide, mute, and customize your private voice space**
> **•  Share management with trusted users and block unwanted guests**

**My Prefix:** \`.v\`

### 🔊 Voice Commands
• \`.v help commands\` — All voice channel commands

### ⛔ Blacklist System  
• \`.v help bl\` — Blacklist management commands

### ✅ Whitelist System
• \`.v help wl\` — Whitelist management commands

### 🤝 Manager System
• \`.v help manager\` — Co-owner management commands

### ✨ Voice Features
• \`.v help features\` — Activities, camera, streaming, soundboard

### 🛠️ Setup & Admin
• \`.v help setup\` — Setup commands
• \`.v help admin\` — Admin commands

### 🔗 Support & Links
• [Support Server](https://discord.gg/wyWGcKWssQ) — Get help
• [Invite Bot](https://discord.com/oauth2/authorize?client_id=1409259003481165876&permissions=8&integration_type=0&scope=bot+applications.commands) — Add to your server  
• [Vote](https://discord.gg/wyWGcKWssQ) — Support us

**OneTab - Voice management | Use .v help [category]**`
      });
    }
  }
};

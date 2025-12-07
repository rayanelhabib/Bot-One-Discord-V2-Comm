const {
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags,
  } = require("discord.js");

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
const EMOJI_RESET = '♻';
const EMOJI_INFO = 'ℹ';
const EMOJI_OWNER = '👑';
const EMOJI_LOCK = '🔒';
const EMOJI_UNLOCK = '🔓';
const EMOJI_RENAME = '📝';
const EMOJI_SETTINGS = '⚙';
const EMOJI_MUTE = '🔇';
const EMOJI_UNMUTE = '🔊';
const EMOJI_HIDE = '🙈';
const EMOJI_UNHIDE = '👁';
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
const EMOJI_SETUP = '🛠';
const EMOJI_ADMIN = '🛡';
const EMOJI_LISTLINK = '🔗';
const EMOJI_STATUS = '📝';
const EMOJI_TASK = '📋';
const EMOJI_CAM = '📷';
const EMOJI_STREAM = '😤';
const EMOJI_SB = '🔊';
const EMOJI_ARROW = '➡';

module.exports = {
  name: 'helpnadi',
  description: 'Show help menu with Discord Components V2',
  usage: '.v helpnadi',
  async execute(message, args, client) {
    try {
      // Container principal avec accent color rouge
      const mainContainer = new ContainerBuilder()
        .setAccentColor(0xff0000); // Rouge
  
        // Titre principal
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("# 🎮 Help Commands | skz_rayan23")
        );
  
        // Description
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(`
> **We are pleased to present our latest update to server, skz_rayan23**

**My Prefix:** \`.v\`

${EMOJI_VOICE} **・Voice Commands**
<:badge:1410413998335328318> \`.v help commands\`

${EMOJI_BLACKLIST} **・BlackList Commands**
<:badge:1410413998335328318> \`.v help bl\`

${EMOJI_WHITELIST} **・Whitelist Commands**
<:badge:1410413998335328318> \`.v help wl\`

${EMOJI_COOWNERS} **・Manager (Co-Owner) Commands**
<:badge:1410413998335328318> \`.v help manager\`

${EMOJI_TASK} **・Task System (Special Prefix)**
<:badge:1410413998335328318> \`+task\`
            `)
        );
  
        // Galerie d'images
        mainContainer.addMediaGalleryComponents(
          new MediaGalleryBuilder()
            .addItems(
              new MediaGalleryItemBuilder()
                .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132682074427503/Picsart_25-08-22_21-53-20-589.jpg")
                .setAlt("skz_rayan23 Bot Avatar")
            )
        );
  
        // Informations supplémentaires
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(`
## 📊 Bot Statistics
💬 **Messages:** 4,028
🪙 **Coins:** 546
🏆 **Achievements:** 13
🛒 **Purchases:** 8

## 🎯 All commands available in the selector below:
            `)
        );
  
        // Menu de sélection
        const helpMenu = new StringSelectMenuBuilder()
          .setCustomId("help-category-select")
          .setPlaceholder("🔍 Choose a help category")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Voice Commands")
              .setValue("voice")
              .setDescription("All voice channel management commands")
              .setEmoji(EMOJI_VOICE),
            new StringSelectMenuOptionBuilder()
              .setLabel("Blacklist System")
              .setValue("blacklist")
              .setDescription("Block users from your voice channels")
              .setEmoji(EMOJI_BLACKLIST),
            new StringSelectMenuOptionBuilder()
              .setLabel("Whitelist System")
              .setValue("whitelist")
              .setDescription("Allow only trusted users")
              .setEmoji(EMOJI_WHITELIST),
            new StringSelectMenuOptionBuilder()
              .setLabel("Manager System")
              .setValue("manager")
              .setDescription("Share channel management with trusted users")
              .setEmoji(EMOJI_COOWNERS),
            new StringSelectMenuOptionBuilder()
              .setLabel("Voice Features")
              .setValue("features")
              .setDescription("Enable activities, camera, soundboard, etc.")
              .setEmoji(EMOJI_FEATURES)
          );

        const menuRow = new ActionRowBuilder().addComponents(helpMenu);
        mainContainer.addActionRowComponents(menuRow);
  
        // Footer
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("Help Command Bot -- Server Support [Support Server](https://discord.gg/wyWGcKWssQ)")
        );
  
        // Boutons d'action rapide
        const quickActionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("help_commands")
            .setLabel("Commands")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🔄"),
          new ButtonBuilder()
            .setCustomId("help_blacklist")
            .setLabel("Blacklist")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⚠️"),
          new ButtonBuilder()
            .setCustomId("help_whitelist")
            .setLabel("Whitelist")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("✅"),
          new ButtonBuilder()
            .setCustomId("help_manager")
            .setLabel("Manager")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("🤝"),
          new ButtonBuilder()
            .setCustomId("help_features")
            .setLabel("Features")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("✨")
        );

        mainContainer.addActionRowComponents(quickActionRow);

        // Envoi du message
        await message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [mainContainer]
        });
  
      } catch (err) {
        console.error("⚠️ Erro no Components V2:", err);
        await message.reply("❌ Erro ao mostrar o perfil");
      }
    }
  };
 // hda code 
/* dcpoaoad
dmalal .an
dapdadmapda*/
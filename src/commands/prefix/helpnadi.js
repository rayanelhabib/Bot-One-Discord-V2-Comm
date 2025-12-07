const {
    Client,
    GatewayIntentBits,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags,
  } = require("discord.js");
  
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

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

  // Enhanced Color Sch
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
  
    if (message.content === ".v help") {
      try {
        // Container principal avec accent color rouge
        const mainContainer = new ContainerBuilder()
          .setAccentColor(0xff0000) // Rouge;
  
        // Titre principal
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("#  Help Commands | Paul Dev ")
        );
  
        // Séparateur
        mainContainer.addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Large)
            .setDivider(true)
        );
  
  
        // Cargos
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("We are pleased to present our latest update to server, Paul Dev")
        );
  
        // Séparateur
        mainContainer.addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Large)
            .setDivider(false)
        );
  
        // Galerie d'images
        mainContainer.addMediaGalleryComponents(
          new MediaGalleryBuilder()
            .addItems(
              new MediaGalleryItemBuilder()
                .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132682074427503/Picsart_25-08-22_21-53-20-589.jpg")
            )
        );
  
        // Séparateur
        mainContainer.addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Large)
            .setDivider(true)
        );
  
        // Statistiques
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("## Estatísticas Detalhadas\n💬 *Mensagens:* 4,028\n🪙 *Moedas:* 546\n🏆 *Conquistas:* 13\n🛒 *Compras:* 8")
        );
  
        // Séparateur
        mainContainer.addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        );
  
        // Atividades
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("## All commade available in the selector : \n ")
        );
  
        // Menu de seleção
        mainContainer.addActionRowComponents(
          new ActionRowBuilder()
            .setComponents(
              new StringSelectMenuBuilder()
                .setCustomId("profile_options")
                .setPlaceholder("Escolha uma opção")
                .addOptions(
                  new StringSelectMenuOptionBuilder()
                    .setLabel("Ver Mensagens")
                    .setDescription("Histórico de mensagens")
                    .setValue("messages")
                    .setEmoji("💬"),
                  new StringSelectMenuOptionBuilder()
                    .setLabel("Ver Conquistas")
                    .setDescription("Todas as conquistas")
                    .setValue("achievements")
                    .setEmoji("🏆"),
                  new StringSelectMenuOptionBuilder()
                    .setLabel("Configurações")
                    .setDescription("Configurar perfil")
                    .setValue("settings")
                    .setEmoji("⚙")
                )
            )
        );
  
        // Séparateur final
        mainContainer.addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Large)
            .setDivider(true)
        );
  
        // Footer
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("🤖 Painel de controle do perfil\n*⚡ Powered by Components v2*")
        );
  
        // Boutons d'action
        mainContainer.addActionRowComponents(
          new ActionRowBuilder()
            .setComponents(
              new ButtonBuilder()
                .setCustomId("refresh")
                .setLabel("Atualizar")
                .setStyle(ButtonStyle.Success)
                .setEmoji("🔄"),
              new ButtonBuilder()
                .setCustomId("punish")
                .setLabel("Castigo")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("⚠"),
              new ButtonBuilder()
                .setCustomId("kick")
                .setLabel("Expulsar")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("👢"),
              new ButtonBuilder()
                .setCustomId("ban")
                .setLabel("Banir")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("🔨")
            )
        );
  
        // Envoi du message
        await message.reply({
          components: [mainContainer],
          flags: MessageFlags.IsComponentsV2,
        });
  
      } catch (err) {
        console.error("⚠ Erro no Components V2:", err);
        await message.reply("❌ Erro ao mostrar o perfil");
      }
    }
  });
  
  client.login(process.env.DISCORD_TOKEN);
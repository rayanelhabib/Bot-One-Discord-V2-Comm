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
  
  client.on("clientReady", () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
  });
  
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
  
    if (message.content === ".v profile") {
      try {
        // Container principal avec accent color rouge
        const mainContainer = new ContainerBuilder()
          .setAccentColor(0xff0000);
  
        // Titre principal
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("# 👤 Profil de Rincko\n*Utilisant Discord Components v2*")
        );
  
        // Séparateur
        mainContainer.addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
        );
  
        // Informations de base
        mainContainer.addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent("## 🔴 Status: Ocupado\n📅 **Membro há:** 2 anos\n📅 **Conta criada há:** 8 anos")
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
            .setContent("## 🎭 Cargos do Servidor\n**Cargos ativos:** <@&111111>, <@&222222>\n*Total: 2 cargos atribuídos*")
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
                .setURL("https://cdn.discordapp.com/embed/avatars/1.png")
                .setDescription("Avatar Style 1"),
              new MediaGalleryItemBuilder()
                .setURL("https://cdn.discordapp.com/embed/avatars/2.png")
                .setDescription("Avatar Style 2"),
              new MediaGalleryItemBuilder()
                .setURL("https://cdn.discordapp.com/embed/avatars/3.png")
                .setDescription("Avatar Style 3")
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
            .setContent("## 📊 Estatísticas Detalhadas\n💬 **Mensagens:** 4,028\n🪙 **Moedas:** 546\n🏆 **Conquistas:** 13\n🛒 **Compras:** 8")
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
            .setContent("## 📈 Atividades Recentes\n🕐 **Última mensagem:** há 2 horas\n🎮 **Status:** Desenvolvendo Bots\n🌟 **Conquista:** Mestre Components v2")
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
                    .setEmoji("⚙️")
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
            .setContent("*🤖 Painel de controle do perfil*\n*⚡ Powered by Components v2*")
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
                .setEmoji("⚠️"),
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
        console.error("⚠️ Erro no Components V2:", err);
        await message.reply("❌ Erro ao mostrar o perfil");
      }
    }
  });
  
  client.login(process.env.DISCORD_TOKEN);
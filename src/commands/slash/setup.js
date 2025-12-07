const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { updateGuildConfig, getGuildConfig } = require('../../utils/configManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Set up the temporary voice channel system')
    .addStringOption(option =>
      option.setName('create-channel-name')
        .setDescription('Name of the channel users will join to create temp channels')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('Category to create temporary voice channels in')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)),

  async execute(interaction) {
    try {
      console.log(`[SETUP] Commande setup exécutée par ${interaction.user.tag} dans ${interaction.guild.name}`);
      // Helper to safely reply or edit the deferred reply to avoid InteractionAlreadyReplied
      async function safeReply(interaction, options) {
        try {
          if (interaction.deferred || interaction.replied) {
            return await interaction.editReply(options);
          } else {
            return await interaction.reply(options);
          }
        } catch (err) {
          // Fallback to followUp if editReply/reply fails (best-effort)
          try { return await interaction.followUp(options); } catch (e) { return null; }
        }
      }
      
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        console.log(`[SETUP] Permission refusée pour ${interaction.user.tag}`);
        return safeReply(interaction, {
          content: '❌ You need the **Manage Server** permission to use this command.',
          ephemeral: true
        });
      }

      const guild = interaction.guild;
      const channelName = interaction.options.getString('create-channel-name');
      const category = interaction.options.getChannel('category');
      
      console.log(`[SETUP] Paramètres reçus:`);
      console.log(`[SETUP] - Nom du salon: ${channelName}`);
      console.log(`[SETUP] - Catégorie: ${category.name} (${category.id})`);
      console.log(`[SETUP] - Type de catégorie: ${category.type}`);

      if (!category || category.type !== ChannelType.GuildCategory) {
        console.log(`[SETUP] ❌ Catégorie invalide`);
        return safeReply(interaction, {
          content: '❌ Please select a valid category for temporary voice channels.',
          ephemeral: true
        });
      }

      const prevConfig = await getGuildConfig(guild.id);
      console.log(`[SETUP] Config précédente:`, prevConfig);

      // Crée toujours un nouveau salon vocal dans la catégorie sélectionnée
      let createChannel;
      try {
        console.log(`[SETUP] Création du salon vocal...`);
        createChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [{
            id: guild.roles.everyone,
            allow: [PermissionsBitField.Flags.Connect],
          }]
        });
        console.log(`[SETUP] ✅ Salon créé: ${createChannel.name} (${createChannel.id})`);
      } catch (error) {
        console.error(`[SETUP] ❌ Erreur création salon:`, error);
        return safeReply(interaction, {
          content: '❌ Failed to create voice channel. Please check bot permissions.',
          ephemeral: true
        });
      }

      const newConfig = {
        createChannelName: createChannel.name,
        createChannelId: createChannel.id,
        tempChannelCategory: category.id
      };

      console.log(`[SETUP] Sauvegarde de la config...`);
      const updatedConfig = await updateGuildConfig(guild.id, newConfig);
      console.log(`[SETUP] ✅ Config sauvegardée:`, updatedConfig);

      await safeReply(interaction, {
        content: `✅ **Setup Complete!**\n\n**Configuration:**\n• **Creation Channel:** <#${createChannel.id}>\n• **Category:** <#${category.id}>\n• **Channel Name:** ${createChannel.name}\n\nUsers can now join <#${createChannel.id}> to create temporary voice channels.`,
        ephemeral: true
      });
      
      console.log(`[SETUP] ✅ Setup terminé avec succès pour ${guild.name}`);
      return; // Important: return après la réponse pour éviter les réponses multiples
      
    } catch (error) {
      console.error(`[SETUP] ❌ Erreur critique:`, error);
      await safeReply(interaction, {
        content: '❌ An unexpected error occurred. Please try again.',
        ephemeral: true
      }).catch(() => {});
    }
  }
};

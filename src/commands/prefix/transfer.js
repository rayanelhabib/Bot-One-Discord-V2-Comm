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
  StringSelectMenuOptionBuilder,
  ComponentType,
  SectionBuilder,
  AttachmentBuilder,
  SeparatorBuilder,
  ThumbnailBuilder
} = require('discord.js');

module.exports = {
  name: 'transfer',
  description: 'Transfer voice channel ownership',
  usage: '.v transfer @user ou .v transfer <ID>',
  async execute(message, args, client) {
    console.log('[TRANSFER] Command executed by:', message.author.username, 'with args:', args);
    
    try {
      const { isBotCreatedChannel } = require('../../utils/voiceHelper');
      const { redis } = require('../../redisClient');
      const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **💌 You must join a voice channel first!**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Information');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **⚠️ This command only works in channels created by the bot!**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Access Denied');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **<@${message.author.id}> Only the current owner can transfer ownership!**
> **Current owner: <@${creatorId}>**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Check target user (mention or ID)
    let newOwner = message.mentions.members.first();
    if (!newOwner && args[0]) {
      // Try to fetch user by ID
      try {
        const userId = args[0];
        newOwner = await message.guild.members.fetch(userId);
      } catch (error) {
        
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ User Not Found');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **<@${message.author.id}> User not found!**
> **Usage: \`.v transfer @user\` or \`.v transfer <ID>\`**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      }
    }
    
    if (!newOwner) {
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ℹ️ Usage');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **<@${message.author.id}> Please specify a user to transfer to!**
> **Usage: \`.v transfer @user\` or \`.v transfer <ID>\`**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
    
    if (newOwner.id === message.author.id) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Invalid Target');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **<@${message.author.id}> You cannot transfer ownership to yourself!**
> **You are already the owner of this channel.**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Verify new owner is in voice
    if (!voiceChannel.members.has(newOwner.id)) {
      
      // === DISCORD COMPONENTS V2 PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ User Not in Voice');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`> **<@${message.author.id}> <@${newOwner.id}> must be in the voice channel!**
> **The new owner needs to be connected to transfer ownership.**`);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // === DISCORD COMPONENTS V2 PANEL ===
    const titleText = new TextDisplayBuilder()
      .setContent('# ⚠️ Confirm Transfer');
      
    const contentText = new TextDisplayBuilder()
      .setContent(`> **<@${message.author.id}> Are you sure you want to transfer ownership?**
> **New owner: <@${newOwner.id}>**
> **This action cannot be undone!**

**Choose your action:**`);
      
    const footerText = new TextDisplayBuilder()
      .setContent('OneTab - Voice management');

    // Boutons intégrés dans le container
    const confirmButton = new ButtonBuilder()
      .setCustomId('transfer_yes')
      .setLabel('✅ Yes, Transfer')
      .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
      .setCustomId('transfer_no')
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger);

    // Section avec thumbnail (comme dans voiceStateUpdate.js)
    const transferSection = new SectionBuilder()
      .addTextDisplayComponents(titleText, contentText, footerText)
      .setThumbnailAccessory(
        thumbnail => thumbnail
          .setDescription('Transfer Ownership Confirmation')
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
      );

    // Séparateur pour améliorer la structure visuelle
    const separator = new SeparatorBuilder().setDivider(true);

    // Container avec section, séparateur ET boutons intégrés
    const container = new ContainerBuilder()
      .addSectionComponents(transferSection)
      .addSeparatorComponents(separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(confirmButton, cancelButton)
      );

    const replyMsg = await message.reply({ 
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    });

    // Create a collector to handle the button response
    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000, max: 1, filter });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      if (interaction.customId === 'transfer_yes') {
        // Transfer ownership
        try {
          await redis.pipeline()
            .set(`creator:${voiceChannel.id}`, newOwner.id, 'EX', 86400)
            .sadd(`transferred:${newOwner.id}`, voiceChannel.id)
            .exec();

          await voiceChannel.permissionOverwrites.edit(newOwner, {
            ViewChannel: true,
            Connect: true
          });

          // === DISCORD COMPONENTS V2 PANEL ===
          const successTitleText = new TextDisplayBuilder()
            .setContent('# ✅ Transfer Successful');
            
          const successContentText = new TextDisplayBuilder()
            .setContent(`> **<@${message.author.id}> Ownership transferred successfully!**
> **New owner: <@${newOwner.id}>**
> **The new owner can now manage this channel.**`);
            
          const successFooterText = new TextDisplayBuilder()
            .setContent('OneTab - Voice management');

          // Section avec thumbnail de succès
          const successSection = new SectionBuilder()
            .addTextDisplayComponents(successTitleText, successContentText, successFooterText)
            .setThumbnailAccessory(
              thumbnail => thumbnail
                .setDescription('Success - Transfer Completed')
                .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
            );

          const successSeparator = new SeparatorBuilder().setDivider(true);
          const successContainer = new ContainerBuilder()
            .addSectionComponents(successSection)
            .addSeparatorComponents(successSeparator);

          await replyMsg.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [successContainer]
          });
        } catch (error) {
          console.error(error);
          
          // === DISCORD COMPONENTS V2 PANEL ===
          const errorTitleText = new TextDisplayBuilder()
            .setContent('# ❌ Transfer Failed');
            
          const errorContentText = new TextDisplayBuilder()
            .setContent(`> **<@${message.author.id}> Failed to transfer ownership!**
> **Please try again or contact support if the issue persists.**`);
            
          const errorFooterText = new TextDisplayBuilder()
            .setContent('OneTab - Voice management');

          // Section avec thumbnail d'erreur
          const errorSection = new SectionBuilder()
            .addTextDisplayComponents(errorTitleText, errorContentText, errorFooterText)
            .setThumbnailAccessory(
              thumbnail => thumbnail
                .setDescription('Error - Transfer Failed')
                .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
            );

          const errorSeparator = new SeparatorBuilder().setDivider(true);
          const errorContainer = new ContainerBuilder()
            .addSectionComponents(errorSection)
            .addSeparatorComponents(errorSeparator);

          await replyMsg.edit({
            flags: MessageFlags.IsComponentsV2,
            components: [errorContainer]
          });
        }
      } else {
        // Cancelled
        // === DISCORD COMPONENTS V2 PANEL ===
        const cancelTitleText = new TextDisplayBuilder()
          .setContent('# ⛔ Transfer Cancelled');
          
        const cancelContentText = new TextDisplayBuilder()
          .setContent(`> **<@${message.author.id}> Transfer cancelled.**
> **Ownership remains unchanged.**
> **You can try again anytime.**`);
          
        const cancelFooterText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management');

        // Section avec thumbnail d'annulation
        const cancelSection = new SectionBuilder()
          .addTextDisplayComponents(cancelTitleText, cancelContentText, cancelFooterText)
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription('Cancelled - Transfer Aborted')
              .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          );

        const cancelSeparator = new SeparatorBuilder().setDivider(true);
        const cancelContainer = new ContainerBuilder()
          .addSectionComponents(cancelSection)
          .addSeparatorComponents(cancelSeparator);

        await replyMsg.edit({
          flags: MessageFlags.IsComponentsV2,
          components: [cancelContainer]
        });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        // === DISCORD COMPONENTS V2 PANEL ===
        const timeoutTitleText = new TextDisplayBuilder()
          .setContent('# ⏰ Transfer Timeout');
          
        const timeoutContentText = new TextDisplayBuilder()
          .setContent(`> **<@${message.author.id}> Transfer request timed out.**
> **Please try again if you want to transfer ownership.**`);
          
        const timeoutFooterText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management');

        // Section avec thumbnail de timeout
        const timeoutSection = new SectionBuilder()
          .addTextDisplayComponents(timeoutTitleText, timeoutContentText, timeoutFooterText)
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription('Timeout - Transfer Expired')
              .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          );

        const timeoutSeparator = new SeparatorBuilder().setDivider(true);
        const timeoutContainer = new ContainerBuilder()
          .addSectionComponents(timeoutSection)
          .addSeparatorComponents(timeoutSeparator);

        await replyMsg.edit({ 
          flags: MessageFlags.IsComponentsV2,
          components: [timeoutContainer] 
        });
      }
    });
    } catch (error) {
      console.error('[TRANSFER] Critical error:', error);
      
      // Message d'erreur de secours
      try {
        await message.reply({
          content: `❌ **Erreur dans la commande transfer:** ${error.message}\n\n**Usage:** \`.v transfer @user\` ou \`.v transfer <ID>\``
        });
      } catch (replyError) {
        console.error('[TRANSFER] Failed to send error message:', replyError);
      }
    }
  }
};

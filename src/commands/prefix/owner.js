const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  AttachmentBuilder,
  SeparatorBuilder,
  ThumbnailBuilder
} = require('discord.js');

module.exports = {
  name: 'owner',
  description: 'Show the owner of your voice channel',
  usage: '.v owner',
  async execute(message, args, client) {
    const { redis } = require('../../redisClient');
    
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Voice Channel Required');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **You must be in a voice channel to check its owner!**

**What to do:**
• Join any voice channel in this server
• Make sure you're connected to voice
• Then use the owner command again

**Usage:** \`.v owner\`
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Join a voice channel to continue');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Voice Channel Required')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    try {
      // Check if this is a bot-created channel first
      const { isBotCreatedChannel } = require('../../utils/voiceHelper');
      const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
      
      if (!isBotChannel) {
        // === DISCORD COMPONENTS V2 INFO PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ℹ️ Information');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **This command only works in channels created by the bot!**

**Channel:** <#${voiceChannel.id}>

**This channel is:**
• A default server channel
• Not a temporary voice channel
• Not created by the bot

**Note:** Only bot-created temporary channels have owner information.
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Not a bot-created channel');

        // Section avec thumbnail
        const infoSection = new SectionBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText)
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription('Information Panel')
              .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          );

        // Séparateur
        const separator = new SeparatorBuilder().setDivider(true);

        // Texte supplémentaire après le séparateur
        const additionalText = new TextDisplayBuilder()
          .setContent('---');

        // Container avec section, séparateur et texte
        const container = new ContainerBuilder()
          .addSectionComponents(infoSection)
          .addSeparatorComponents(separator)
          .addTextDisplayComponents(additionalText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      }

      // Get channel owner from Redis (using creator key like other commands)
      const ownerId = await redis.get(`creator:${voiceChannel.id}`);
      
      if (!ownerId) {
        // === DISCORD COMPONENTS V2 INFO PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ℹ️ Information');
          
        const contentText = new TextDisplayBuilder()
          .setContent(`
> **No owner information found for this channel!**

**Channel:** <#${voiceChannel.id}>

**This might mean:**
• The channel was not created by the bot
• The owner data was not saved
• The channel is a default server channel

**Note:** Only bot-created temporary channels have owner information.
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | No owner data available');

        // Section avec thumbnail
        const noDataSection = new SectionBuilder()
          .addTextDisplayComponents(titleText, contentText, footerText)
          .setThumbnailAccessory(
            thumbnail => thumbnail
              .setDescription('No Owner Data Available')
              .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
          );

        // Séparateur
        const separator = new SeparatorBuilder().setDivider(true);

        // Texte supplémentaire après le séparateur
        const additionalText = new TextDisplayBuilder()
          .setContent('---');

        // Container avec section, séparateur et texte
        const container = new ContainerBuilder()
          .addSectionComponents(noDataSection)
          .addSeparatorComponents(separator)
          .addTextDisplayComponents(additionalText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      }

      // Fetch owner user
      const owner = await client.users.fetch(ownerId);
      
      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# 👑 Channel Owner');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Channel Owner Information**

**Channel:** <#${voiceChannel.id}>
**Owner:** <@${ownerId}> (${owner.username})

**Owner Details:**
• **Username:** ${owner.username}
• **Display Name:** ${owner.displayName || owner.username}
• **ID:** \`${ownerId}\`
• **Account Created:** <t:${Math.floor(owner.createdTimestamp / 1000)}:R>

**Note:** The owner has full control over this temporary channel.
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Channel owner information');

      // Section avec thumbnail du propriétaire
      const ownerSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription(`Channel Owner: ${owner.username}`)
            .setURL(owner.displayAvatarURL({ extension: 'png', size: 512 }))
        );

      // Séparateur pour améliorer la structure visuelle
      const separator = new SeparatorBuilder().setDivider(true);

      // Texte supplémentaire après le séparateur
      const additionalText = new TextDisplayBuilder()
        .setContent('---');

      // Container avec section, séparateur et texte
      const container = new ContainerBuilder()
        .addSectionComponents(ownerSection)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(additionalText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
      
    } catch (error) {
      console.error('[OWNER] Error:', error);
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ❌ Error');
        
      const contentText = new TextDisplayBuilder()
        .setContent(`
> **Failed to get channel owner information!**

**Error:** ${error.message}

**What to do:**
• Try again in a few moments
• Contact an administrator if the problem persists
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Error getting owner info');

      // Section avec thumbnail d'erreur
      const errorSection = new SectionBuilder()
        .addTextDisplayComponents(titleText, contentText, footerText)
        .setThumbnailAccessory(
          thumbnail => thumbnail
            .setDescription('Error - Owner Info Failed')
            .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif')
        );

      const separator = new SeparatorBuilder().setDivider(true);
      const container = new ContainerBuilder()
        .addSectionComponents(errorSection)
        .addSeparatorComponents(separator);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }
  }
};
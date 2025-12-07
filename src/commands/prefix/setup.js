const { getGuildConfig, updateGuildConfig, DEFAULT_CONFIG } = require('../../utils/configManager');
const { 
  EmbedBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = {
  name: 'setup',
  description: 'Update the creation channel from its ID (admin only)',
  usage: '.v setup <channel_id>',
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('Administrator')) {
        // === DISCORD COMPONENTS V2 ERROR PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ⛔ Permission Denied');
          
        const errorText = new TextDisplayBuilder()
          .setContent(`
> **Access Restricted**

Only administrators can use this command.

**Required Permissions:**
• Administrator permission
• Manage channels permission
• Manage roles permission

**Contact an administrator to configure the bot.**
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Admin setup required');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, errorText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      }
      
      const channelId = args[0];
      if (!channelId || !/^[0-9]+$/.test(channelId)) {
        // === DISCORD COMPONENTS V2 USAGE PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ❌ Usage Error');
          
        const usageText = new TextDisplayBuilder()
          .setContent(`
> **Incorrect Usage**

**Correct Usage:** \`.v setup <voice_channel_id>\`

**What to do:**
• Provide the ID of an existing voice channel
• The channel must be a voice channel
• The channel will become the creation channel

**Example:**
\`.v setup 123456789012345678\`

**How to get channel ID:**
• Right-click on the voice channel
• Select "Copy ID" (Developer Mode must be enabled)
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Provide a valid voice channel ID');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, usageText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      }
      
      const channel = message.guild.channels.cache.get(channelId);
      if (!channel || channel.type !== 2) { // 2 = GuildVoice
        // === DISCORD COMPONENTS V2 ERROR PANEL ===
        const titleText = new TextDisplayBuilder()
          .setContent('# ❌ Channel Not Found');
          
        const errorText = new TextDisplayBuilder()
          .setContent(`
> **Invalid Channel**

No voice channel found with this ID.

**Possible Issues:**
• Channel ID is incorrect
• Channel is not a voice channel
• Channel has been deleted
• Bot doesn't have access to the channel

**What to do:**
• Verify the channel ID is correct
• Make sure it's a voice channel
• Ensure the bot has access to the channel
          `);
          
        const footerText = new TextDisplayBuilder()
          .setContent('OneTab - Voice management | Provide a valid voice channel ID');

        const container = new ContainerBuilder()
          .addTextDisplayComponents(titleText, errorText, footerText);

        return message.reply({
          flags: MessageFlags.IsComponentsV2,
          components: [container]
        });
      }
      
      const categoryId = channel.parentId;
      let config = await getGuildConfig(message.guild.id);
      if (!config) config = { ...DEFAULT_CONFIG };
      
      const newConfig = {
        ...config,
        createChannelId: channel.id,
        createChannelName: channel.name,
        tempChannelCategory: categoryId,
        tempChannelCategoryId: categoryId
      };
      
      await updateGuildConfig(message.guild.id, newConfig);
      
      // === DISCORD COMPONENTS V2 SUCCESS PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ✅ Setup Fixed!');
        
      const successText = new TextDisplayBuilder()
        .setContent(`
> **Configuration Updated Successfully**

**Creation Channel:** <#${channel.id}>
**Category:** <#${categoryId}>
**Channel Name:** \`${channel.name}\`

**What's Next:**
• Users can now create temporary voice channels
• Join the creation channel to start
• All settings have been configured properly

**Features Available:**
• Automatic voice channel creation
• Channel management commands
• Premium features for channel owners
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management | Setup completed successfully');

      // Boutons d'action
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('setup_test')
          .setLabel('Test Setup')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🧪'),
        new ButtonBuilder()
          .setCustomId('setup_info')
          .setLabel('View Config')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('ℹ️')
      );

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, successText, footerText)
        .addActionRowComponents(actionRow);
      
      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (error) {
      console.error('[SETUP] Error:', error);
      await message.reply('❌ Error updating setup configuration.').catch(() => {});
    }
  }
}; 
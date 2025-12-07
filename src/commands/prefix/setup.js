const { getGuildConfig, updateGuildConfig, DEFAULT_CONFIG } = require('../../utils/configManager');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'setup',
  description: 'Update the creation channel from its ID (admin only)',
  usage: '.v setup <channel_id>',
  async execute(message, args, client) {
    try {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('⛔ Permission Denied')
            .setDescription('Only administrators can use this command.')
            .setColor('#ED4245')
        ] });
      }
      
      const channelId = args[0];
      if (!channelId || !/^[0-9]+$/.test(channelId)) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('❌ Usage')
            .setDescription('Usage: `.v setup <voice_channel_id>`\nProvide the ID of an existing voice channel to fix the setup.')
            .setColor('#FEE75C')
        ] });
      }
      
      const channel = message.guild.channels.cache.get(channelId);
      if (!channel || channel.type !== 2) { // 2 = GuildVoice
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('❌ Not Found or Wrong Type')
            .setDescription('No voice channel found with this ID. Provide the ID of an existing voice channel.')
            .setColor('#ED4245')
        ] });
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
      
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('✅ Setup Fixed!')
          .setDescription(`The creation channel is now: <#${channel.id}>\nCategory: <#${categoryId}>\n\nUsers can now create temporary voice channels again by joining this channel.`)
          .setColor('#57F287')
      ] });
    } catch (error) {
      console.error('[SETUP] Error:', error);
      await message.reply('❌ Error updating setup configuration.').catch(() => {});
    }
  }
}; 
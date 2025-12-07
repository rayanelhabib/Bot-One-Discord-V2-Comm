const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'cam',
  description: 'Enable/disable streaming in your voice channel',
  usage: '.v cam [on/off]',
  async execute(message, args, client) {
    try {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('💌 Join a voice channel first!')
        .setColor('#ED4245')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Check ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('⛔ Permission Denied')
          .setDescription('😒 You can only manage your own voice channel!')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    const state = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(state)) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('ℹ️ Usage')
          .setDescription('Usage: `.v cam <on|off>`')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Update channel permissions
    await voiceChannel.permissionOverwrites.edit(message.guild.id, {
      Stream: state === 'on'
    });

    message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle(state === 'on' ? '✅ Streaming Enabled' : '✅ Streaming Disabled')
        .setDescription(`Streaming ${state === 'on' ? 'enabled' : 'disabled'}`)
        .setColor('#57F287')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });
    } catch (error) {
      console.error('[CAM] Error:', error);
      await message.reply('❌ Error managing camera permissions.').catch(() => {});
    }
  }
};

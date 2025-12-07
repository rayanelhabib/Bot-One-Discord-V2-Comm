const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');


module.exports = {
  name: 'sb',
  description: 'Toggle soundboard usage in your voice channel',
  usage: '.v sb [on/off]',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('💌 Join a voice channel first!')
        .setColor('#ED4245')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('⛔ Permission Denied')
          .setDescription('⚠️ Only the channel owner can control soundboard!')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Determine new state
    const state = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(state)) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('ℹ️ Usage')
          .setDescription('Usage: `.v sb <on|off>`')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Update permissions
    try {
      await voiceChannel.permissionOverwrites.edit(message.guild.roles.everyone, {
        UseSoundboard: state === 'on'
      });
      
      // Store state in Redis
      await redis.set(`soundboard:${voiceChannel.id}`, state === 'on' ? '1' : '0');
      message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle(state === 'on' ? '✅ Soundboard Enabled' : '✅ Soundboard Disabled')
          .setDescription(`Soundboard ${state === 'on' ? 'enabled' : 'disabled'}`)
          .setColor('#57F287')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    } catch (error) {
      console.error(error);
      message.reply('💀 Failed to update soundboard settings!');
    }
  }
};
const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'stream',
  description: 'Enable or disable streaming in your voice channel',
  usage: '.v stream <on|off>',
  async execute(message, args, client) {
    try {
      const voiceChannel = message.member.voice.channel;
      if (!voiceChannel) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'late Night', 
              iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
            })
            .setDescription('💌 Join a voice channel first!')
            .setColor('#FEE75C')
        ] });
      }

      const creatorId = await redis.get(`creator:${voiceChannel.id}`);
      if (creatorId !== message.author.id) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'late Night', 
              iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
            })
            .setDescription('⚠️ You can only manage your own voice channel!')
            .setColor('#FEE75C')
        ] });
      }

      const option = args[0]?.toLowerCase();
      if (!['on', 'off'].includes(option)) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'late Night', 
              iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
            })
            .setDescription('ℹ️ Usage: `.v stream <on|off>`')
            .setColor('#FEE75C')
        ] });
      }

      const everyoneRole = message.guild.roles.everyone;
      const allowStream = option === 'on';

      await voiceChannel.permissionOverwrites.edit(everyoneRole, {
        Stream: allowStream,
      });

      await voiceChannel.permissionOverwrites.edit(message.author.id, {
        Stream: true,
      });

      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'late Night', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
          })
          .setDescription(`🎥 Streaming has been turned **${allowStream ? 'on' : 'off'}**.`)
          .setColor('#57F287')
      ] });
    } catch (error) {
      console.error('[STREAM] Error:', error);
      await message.reply('❌ Error managing streaming permissions.').catch(() => {});
    }
  }
};

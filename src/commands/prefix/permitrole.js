const { redis } = require('../../redisClient');
const { PermissionFlagsBits } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'permitrole',
  description: 'Allow a role to access your voice channel',
  usage: '.v permitrole @role ou .v permitrole <ID>',
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
          .setDescription('⚠️ Only the channel owner can permit roles!')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Check role mention or ID
    let role = message.mentions.roles.first();
    if (!role && args[0]) {
      // Try to fetch role by ID
      try {
        const roleId = args[0];
        role = await message.guild.roles.fetch(roleId);
      } catch (error) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('ℹ️ Usage')
            .setDescription('Usage: `.v permitrole @role` or `.v permitrole <ID>`')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      }
    }
    
    if (!role) return message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle('ℹ️ Usage')
        .setDescription('Usage: `.v permitrole @role` or `.v permitrole <ID>`')
        .setColor('#FEE75C')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Add role permission
    try {
      await voiceChannel.permissionOverwrites.edit(role, {
        Connect: true,
        ViewChannel: true
      });
      
      // Store permitted role in Redis
      await redis.sadd(`permitted_roles:${voiceChannel.id}`, role.id);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('✅ Permitted')
          .setDescription(`Granted access to ${role.name} role`)
          .setColor('#57F287')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    } catch (error) {
      console.error(error);
      message.reply('⚠️ Failed to permit role!');
    }
  }
};
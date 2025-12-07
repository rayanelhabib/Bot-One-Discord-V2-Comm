const { redis } = require('../../redisClient');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'rejectrole',
  description: 'Deny a role access to your voice channel',
  usage: '.v rejectrole @role ou .v rejectrole <ID>',
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
          .setDescription('⚠️ Only the channel owner can reject roles!')
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
            .setDescription('Usage: `.v rejectrole @role` or `.v rejectrole <ID>`')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      }
    }
    
    if (!role) return message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle('ℹ️ Usage')
        .setDescription('Usage: `.v rejectrole @role` or `.v rejectrole <ID>`')
        .setColor('#FEE75C')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Disconnect all role members currently in channel
    const membersInChannel = voiceChannel.members.filter(m => m.roles.cache.has(role.id));
    
    if (membersInChannel.size > 0) {
      try {
        const disconnectPromises = membersInChannel.map(async (m) => {
          try {
            // Vérifier que l'utilisateur est toujours connecté avant de le déconnecter
            if (!m.voice?.channelId || m.voice.channelId !== voiceChannel.id) {
              console.log(`[REJECTROLE] User ${m.id} is no longer in the voice channel`);
              return;
            }
            
            await m.voice.disconnect('Role rejected');
          } catch (error) {
            console.error(`[REJECTROLE] Error disconnecting user ${m.id}:`, error);
            
            // Gérer spécifiquement l'erreur 40032
            if (error.code === 40032 || error.message?.includes('Target user is not connected to voice')) {
              console.log(`[REJECTROLE] User ${m.id} disconnected before reject operation`);
            }
          }
        });
        
        await Promise.allSettled(disconnectPromises);
      } catch (error) {
        console.error('[REJECTROLE] Error during bulk disconnect:', error);
      }
    }

    // Set role permissions
    try {
      await voiceChannel.permissionOverwrites.edit(role, {
        Connect: false,
        ViewChannel: false
      });
      
      // Store rejected role in Redis
      await redis.sadd(`rejected_roles:${voiceChannel.id}`, role.id);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('🚫 Role Rejected')
          .setDescription(`Denied access to ${role.name} role`)
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    } catch (error) {
      console.error(error);
      message.reply('❌ Failed to reject role!');
    }
  }
};
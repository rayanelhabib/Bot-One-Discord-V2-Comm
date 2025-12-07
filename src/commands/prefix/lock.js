const { redis } = require('../../redisClient');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { isBotCreatedChannel, isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'lock',
  description: 'Lock your voice channel',
  usage: '.v lock',
  async execute(message, args, client) {
    console.log(`[LOCK] Command executed by ${message.author.tag} (${message.author.id})`);
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  				name: 'late Night', 
 				  iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			  })
        .setDescription(`⚠️ <@${message.author.id}> You must join a voice channel first!`)
        .setColor('#ED4245')
    ] });

    // Verify that this is a bot-created channel
    console.log(`[LOCK] Checking if channel ${voiceChannel.id} is bot-created`);
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    console.log(`[LOCK] Is bot channel: ${isBotChannel}`);
    if (!isBotChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		  })
          .setDescription('⚠️ This command only works in channels created by the bot!')
          .setColor('#ED4245')
      ] });
    }

    // Verify ownership
     // Verify ownership or manager status
    console.log(`[LOCK] Checking permissions for user ${message.author.id}`);
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    console.log(`[LOCK] Has permission: ${hasPermission}`);
    if (!hasPermission) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		  })
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner can lock the channel!`)
          .setColor('#FEE75C')
  
      ] });
    }

    const everyoneRole = message.guild.roles.everyone;
    console.log(`[LOCK] Checking if channel is already locked`);
    const isLocked = await redis.get(`locked:${voiceChannel.id}`) === '1';
    console.log(`[LOCK] Is already locked: ${isLocked}`);

    if (isLocked) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'late Night', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription(`⚠️ <@${message.author.id}> Channel is already locked.`)
        .setColor('#FEE75C')
    ] });

    try {
      console.log(`[LOCK] Starting lock process for channel ${voiceChannel.id} by user ${message.author.id}`);
      
      // Get current permissions to preserve ViewChannel state
      const currentOverwrites = voiceChannel.permissionOverwrites.cache.get(everyoneRole.id);
      const currentViewChannel = currentOverwrites ? currentOverwrites.deny.has(PermissionFlagsBits.ViewChannel) : false;
      
      console.log(`[LOCK] Setting permissions for @everyone and user ${message.author.id}`);
      
      await Promise.all([
        // Deny @everyone from joining
        voiceChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: false
        }),
        // Give basic permissions to the user who executed the command (no dangerous permissions)
        voiceChannel.permissionOverwrites.edit(message.author.id, {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          UseVAD: true,
          Stream: true,
          UseEmbeddedActivities: true,
          UseExternalEmojis: true,
          UseExternalStickers: true,
          AddReactions: true,
          SendMessages: true,
          UseApplicationCommands: true
        }),
        redis.set(`locked:${voiceChannel.id}`, '1')
      ]);
      
      console.log(`[LOCK] Permissions set successfully, sending confirmation message`);
      const embed = new EmbedBuilder()
        .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
        .setDescription(`✅ <@${message.author.id}> The voice channel has been locked successfully.`)
        .setColor('#5865F2')
      message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[LOCK] Error in lock command:', err);
      console.error('[LOCK] Error details:', {
        channelId: voiceChannel?.id,
        userId: message.author?.id,
        error: err.message,
        stack: err.stack
      });
      
      try {
        await message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
  				name: 'late Night', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
            .setDescription('⚠️ Failed to lock the channel!')
            .setColor('#ED4245')
        ] });
      } catch (replyError) {
        console.error('[LOCK] Failed to send error message:', replyError);
      }
    }
  }
};
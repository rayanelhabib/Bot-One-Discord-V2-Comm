const { redis } = require('../../redisClient');
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
  StringSelectMenuOptionBuilder
} = require('discord.js');
const { isBotCreatedChannel, isOwnerOrManager } = require('../../utils/voiceHelper');

module.exports = {
  name: 'reject',
  aliases: ['deny'],
  description: 'Deny a user access to your voice channel',
  usage: '.v reject @user or .v reject <ID> or .v deny @user or .v deny <ID>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
      .setAuthor({ 
        name: 'skz_rayan23 🍷', 
        iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
        })
        .setDescription(`⚠️ <@${message.author.id}> Join a voice channel first!`)
        .setColor('#ED4245')
        
    ] });

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'skz_rayan23 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription('⚠️ This command only works in channels created by the bot!')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Verify ownership
    // Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'skz_rayan23 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner can reject users!`)
          .setColor('#FEE75C')
      ] });
    }

    // Check user mention or ID
    let user = message.mentions.members.first();
    if (!user && args[0]) {
      // Try to fetch user by ID
      try {
        const userId = args[0];
        user = await message.guild.members.fetch(userId);
      } catch (error) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('ℹ️ Usage')
            .setDescription('Usage: `.v reject @user` or `.v reject <ID>` or `.v deny @user` or `.v deny <ID>`')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      }
    }
    
    if (!user) return message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle('ℹ️ Usage')
        .setDescription('Usage: `.v reject @user` or `.v reject <ID>` or `.v deny @user` or `.v deny <ID>`')
        .setColor('#FEE75C')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Get the rejected channel
    const rejectedChannelId = '1372703350642180096';
    const rejectedChannel = message.guild.channels.cache.get(rejectedChannelId);
    
    if (!rejectedChannel) {
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Error');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **⚠️ Rejected channel not found!**

**What to do:**
• Check your permissions
• Verify the channel exists
• Contact an administrator if needed
        `);
        
      const footerText = new TextDisplayBuilder()
        .setContent('OneTab - Voice management');

      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, errorText, footerText);

      return message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    }

    // Move user to rejected channel if currently in voice channel
    if (user.voice.channelId === voiceChannel.id) {
      try {
        // Vérifier que l'utilisateur est toujours connecté avant de le déplacer
        if (!user.voice?.channelId || user.voice.channelId !== voiceChannel.id) {
          console.log('[REJECT] User is no longer in the voice channel');
          return;
        }
        
        await user.voice.setChannel(rejectedChannel, 'Rejected by owner');
      } catch (error) {
        console.error('Error moving user to rejected channel:', error);
        
        // Gérer spécifiquement l'erreur 40032
        if (error.code === 40032 || error.message?.includes('Target user is not connected to voice')) {
          console.log('[REJECT] User disconnected during move operation');
        } else {
          // Si le déplacement échoue, déconnecter comme solution de secours
          try {
            await user.voice.disconnect('Rejected by owner');
          } catch (disconnectError) {
            console.error('Error disconnecting user:', disconnectError);
          }
        }
      }
    }

    // Set deny permissions
    try {
      await voiceChannel.permissionOverwrites.edit(user, {
        Connect: false,
        ViewChannel: true
      });
      
      // Store rejected user in Redis
      await redis.sadd(`rejected_users:${voiceChannel.id}`, user.id);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'skz_rayan23 🍷', 
 				iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
			})
          .setDescription(`✅ <@${message.author.id}> Successfully rejected ${user} from the voice channel!`)
          .addFields(
            { name: '👤 Rejected User', value: `${user} (${user.user.username})`, inline: true },
            { name: '🔊 Channel', value: `<#${voiceChannel.id}>`, inline: true },
            { name: '⏰ Time', value: new Date().toLocaleString(), inline: true }
          )
          .setColor('#ED4245')
      ] });
    } catch (error) {
      console.error(error);
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'skz_rayan23 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription('⚠️ Failed to reject user! Please try again.')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }
  }
};

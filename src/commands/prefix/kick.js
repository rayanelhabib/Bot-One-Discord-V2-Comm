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
  name: 'kick',
  description: 'Kick a user from your voice channel',
  usage: '.v kick @user or .v kick <ID>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  			name: 'skz_rayan23', 
 			iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
		})
        .setDescription(`⚠️ <@${message.author.id}> You must join a voice channel first!`)
        .setColor('#ED4245')
    ] });

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Error');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **⚠️ This command only works in channels created by the bot!**

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

    // Verify ownership
// Verify ownership or manager status
    const hasPermission = await isOwnerOrManager(voiceChannel.id, message.author.id);
    if (!hasPermission) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'skz_rayan23', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription(`⚠️ <@${message.author.id}> Only the channel owner can kick users!`)
          .setColor('#FEE75C')
          
      ] });
    }

    // Find target user (mention or ID)
    let target = message.mentions.members.first();
    if (!target && args[0]) {
      // Try to fetch user by ID
      try {
        const userId = args[0];
        target = await message.guild.members.fetch(userId);
      } catch (error) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
  				name: 'skz_rayan23', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
            .setDescription('⚠️ Usage: `.v kick @username` or `.v kick <ID>`')
            .setColor('#FEE75C')
            .setFooter({ text: 'OneTab - Voice management' })
        ] });
      }
    }
    
    if (!target) return message.reply({ embeds: [
      new EmbedBuilder()
        .setAuthor({ 
  				name: 'skz_rayan23', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
        .setDescription('⚠️<@${message.author.id}> Usage: `.v kick @username` or `.v kick <ID>`')
        .setColor('#FEE75C')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Can't kick yourself
    if (target.id === message.author.id) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  				name: 'skz_rayan23', 
 				iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
			})
          .setDescription('⚠️ You cannot kick yourself!')
          .setColor('#FEE75C')
          
      ] });
    }

    // Can't kick other owners
    const targetIsOwner = await redis.get(`creator:${voiceChannel.id}`) === target.id;
    if (targetIsOwner) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('👍 Owner Kick')
          .setDescription('You cannot kick another owner!')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Execute kick
    if (target.voice.channelId === voiceChannel.id) {
      try {
        // Vérifier que l'utilisateur est toujours connecté avant de le déconnecter
        if (!target.voice?.channelId || target.voice.channelId !== voiceChannel.id) {
          console.log('[KICK] User is no longer in the voice channel');
          
      // === DISCORD COMPONENTS V2 ERROR PANEL ===
      const titleText = new TextDisplayBuilder()
        .setContent('# ⚠️ Error');
        
      const errorText = new TextDisplayBuilder()
        .setContent(`
> **⚠️ That user is no longer in your voice channel!**

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
        
        await target.voice.disconnect('Kicked by channel owner');
        
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'skz_rayan23', 
              iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
            })
            .setDescription(`✅ <@${message.author.id}> Successfully kicked ${target.displayName} from the voice channel`)
            .setColor('#57F287')
        ] });
      } catch (error) {
        console.error('[KICK] Error disconnecting user:', error);
        
        // Gérer spécifiquement l'erreur 40032
        if (error.code === 40032 || error.message?.includes('Target user is not connected to voice')) {
          console.log('[KICK] User disconnected before kick operation');
          message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'skz_rayan23', 
                iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
              })
              .setDescription('⚠️ That user is no longer connected to voice!')
              .setColor('#ED4245')
          ] });
        } else {
          message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'skz_rayan23', 
                iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
              })
              .setDescription('⚠️ Failed to kick user due to an error!')
              .setColor('#ED4245')
          ] });
        }
      }
    } else {
      message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'skz_rayan23', 
            iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
          })
          .setDescription('⚠️ That user is not in your voice channel!')
          .setColor('#ED4245')
      ] });
    }
  }
};
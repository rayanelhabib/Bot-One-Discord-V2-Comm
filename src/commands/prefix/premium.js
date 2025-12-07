const premiumManager = require('../../utils/premiumManager');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'premium',
  description: 'Manage premium access for hide/unhide commands',
  usage: '.v premium <add/remove/list/check> [@user]',
  async execute(message, args) {
    try {
    // Check if user has admin permissions
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription(`⚠️ <@${message.author.id}> You need Administrator permissions to use this command!`)
          .setColor('#ED4245')
      ] });
    }

    if (!args.length) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setDescription(`⚠️ <@${message.author.id}> Usage: \`.v premium <add/remove/list/check> [@user]\``)
          .setColor('#FEE75C')
      ] });
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'add': {
        const user = message.mentions.users.first();
        if (!user) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'Paul Dev 🍷', 
                iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
              })
              .setDescription(`⚠️ <@${message.author.id}> Please mention a user to give premium access!`)
              .setColor('#FEE75C')
          ] });
        }

        const success = await premiumManager.addPremiumUser(message.guild.id, user.id);
        if (!success) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'Paul Dev 🍷', 
                iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
              })
              .setDescription(`❌ <@${message.author.id}> Failed to add premium access. Please try again.`)
              .setColor('#ED4245')
          ] });
        }
        
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'Paul Dev 🍷', 
              iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
            })
            .setDescription(`✅ <@${message.author.id}> <@${user.id}> now has premium access to hide/unhide commands!`)
            .setColor('#57F287')
        ] });
        break;
      }

      case 'remove': {
        const user = message.mentions.users.first();
        if (!user) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'Paul Dev 🍷', 
                iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
              })
              .setDescription(`⚠️ <@${message.author.id}> Please mention a user to remove premium access!`)
              .setColor('#FEE75C')
          ] });
        }

        const success = await premiumManager.removePremiumUser(message.guild.id, user.id);
        if (!success) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'Paul Dev 🍷', 
                iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
              })
              .setDescription(`❌ <@${message.author.id}> Failed to remove premium access. Please try again.`)
              .setColor('#ED4245')
          ] });
        }
        
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'Paul Dev 🍷', 
              iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
            })
            .setDescription(`✅ <@${message.author.id}> <@${user.id}> premium access has been removed!`)
            .setColor('#57F287')
        ] });
        break;
      }

      case 'list': {
        const premiumUsers = await premiumManager.getPremiumUsers(message.guild.id);
        
        if (premiumUsers.length === 0) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'Paul Dev 🍷', 
                iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
              })
              .setDescription(`📋 <@${message.author.id}> No users have premium access in this server.`)
              .setColor('#5865F2')
          ] });
        }

        const userList = premiumUsers.map(userId => `<@${userId}>`).join('\n');
        
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'Paul Dev 🍷', 
              iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
            })
            .setTitle('🌟 Premium Users')
            .setDescription(userList)
            .setColor('#5865F2')
            .setFooter({ text: `Total: ${premiumUsers.length} user(s)` })
        ] });
        break;
      }

      case 'check': {
        const user = message.mentions.users.first();
        if (!user) {
          return message.reply({ embeds: [
            new EmbedBuilder()
              .setAuthor({ 
                name: 'Paul Dev 🍷', 
                iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
              })
              .setDescription(`⚠️ <@${message.author.id}> Please mention a user to check premium status!`)
              .setColor('#FEE75C')
          ] });
        }

        const hasPremium = await premiumManager.hasPremiumAccess(message.guild.id, user.id);
        
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'Paul Dev 🍷', 
              iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
            })
            .setDescription(`${hasPremium ? '✅' : '❌'} <@${user.id}> ${hasPremium ? 'has' : 'does not have'} premium access.`)
            .setColor(hasPremium ? '#57F287' : '#ED4245')
        ] });
        break;
      }

      case 'stats': {
        const stats = await premiumManager.getStats();
        const embed = new EmbedBuilder()
          .setAuthor({ 
            name: 'Paul Dev 🍷', 
            iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
          })
          .setTitle('📊 Premium Statistics')
          .addFields(
            { name: 'Total Users', value: `${stats.totalUsers}`, inline: true },
            { name: 'Total Guilds', value: `${stats.totalGuilds}`, inline: true },
            { name: 'Last Updated', value: stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : 'Never', inline: true }
          )
          .setColor('#5865F2')
          .setFooter({ text: 'Premium System Statistics' });
        
        message.reply({ embeds: [embed] });
        break;
      }

      case 'save': {
        await premiumManager.forceSave();
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'Paul Dev 🍷', 
              iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
            })
            .setDescription(`✅ <@${message.author.id}> Premium data has been saved to JSON file.`)
            .setColor('#57F287')
        ] });
        break;
      }

      case 'restore': {
        const success = await premiumManager.restoreFromJSON();
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'Paul Dev 🍷', 
              iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
            })
            .setDescription(`${success ? '✅' : '❌'} <@${message.author.id}> ${success ? 'Premium data restored from JSON.' : 'Failed to restore premium data.'}`)
            .setColor(success ? '#57F287' : '#ED4245')
        ] });
        break;
      }

      default: {
        message.reply({ embeds: [
          new EmbedBuilder()
            .setAuthor({ 
              name: 'Paul Dev 🍷', 
              iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
            })
            .setDescription(`⚠️ <@${message.author.id}> Invalid action! Use: \`add\`, \`remove\`, \`list\`, \`check\`, \`stats\`, \`save\`, or \`restore\``)
            .setColor('#FEE75C')
        ] });
      }
    }
    } catch (error) {
      console.error('[PREMIUM] Error:', error);
      await message.reply('❌ Error managing premium access.').catch(() => {});
    }
  }
}; 
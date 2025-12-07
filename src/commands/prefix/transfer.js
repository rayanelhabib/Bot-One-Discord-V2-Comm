const { redis } = require('../../redisClient');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { isBotCreatedChannel } = require('../../utils/voiceHelper');

module.exports = {
  name: 'transfer',
  description: 'Transfer voice channel ownership',
  usage: '.v transfer @user ou .v transfer <ID>',
  async execute(message, args, client) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('💌 You must join a voice channel first!')
        .setColor('#ED4245')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });

    // Verify that this is a bot-created channel
    const isBotChannel = await isBotCreatedChannel(voiceChannel.id);
    if (!isBotChannel) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'Paul Dev 🍷', 
 			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		  })
          .setDescription('⚠️ This command only works in channels created by the bot!')
          .setColor('#ED4245')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Verify ownership
    const creatorId = await redis.get(`creator:${voiceChannel.id}`);
    if (creatorId !== message.author.id) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'Paul Dev 🍷', 
 			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		  })
          .setDescription('⚠️<@${message.author.id}> Only the current owner can transfer ownership!')
          .setColor('#FEE75C')
          
      ] });
    }

    // Check target user (mention or ID)
    let newOwner = message.mentions.members.first();
    if (!newOwner && args[0]) {
      // Try to fetch user by ID
      try {
        const userId = args[0];
        newOwner = await message.guild.members.fetch(userId);
      } catch (error) {
        return message.reply({ embeds: [
          new EmbedBuilder()
            .setTitle('ℹ️ Usage')
            .setDescription('Usage: `.v transfer @user` or `.v transfer <ID>` ')
            .setColor('#FEE75C')
            
        ] });
      }
    }
    
    if (!newOwner) return message.reply({ embeds: [
      new EmbedBuilder()
        .setTitle('ℹ️ Usage')
        .setDescription('Usage: `.v transfer @user` or `.v transfer <ID>`')
        .setColor('#FEE75C')
        .setFooter({ text: 'OneTab - Voice management' })
    ] });
    
    if (newOwner.id === message.author.id) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'Paul Dev 🍷', 
 			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		  })
          .setDescription(`⚠️<@${message.author.id}> You already own this channel!`)
          .setColor('#FEE75C')
          
      ] });
    }

    // Verify new owner is in voice
    if (!voiceChannel.members.has(newOwner.id)) {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setAuthor({ 
  			name: 'Paul Dev 🍷', 
 			iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		  })
          .setDescription('⚠️ New owner must be in the voice channel!')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    // Confirmation with buttons
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('transfer_yes')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('transfer_no')
        .setLabel('No')
        .setStyle(ButtonStyle.Danger)
    );

    const confirmEmbed = new EmbedBuilder()
      .setTitle('Transferring Ownership')
      .setDescription(`Are you sure you want to transfer ownership to **${newOwner.displayName}**?`)
      .setColor('#FEE75C')
      .setFooter({ text: 'OneTab - Voice management' });

    const replyMsg = await message.reply({ embeds: [confirmEmbed], components: [confirmRow] });

    // Create a collector to handle the button response
    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000, max: 1, filter });

    collector.on('collect', async (interaction) => {
      await interaction.deferUpdate();
      if (interaction.customId === 'transfer_yes') {
        // Transfer ownership
        try {
          await redis.pipeline()
            .set(`creator:${voiceChannel.id}`, newOwner.id, 'EX', 86400)
            .sadd(`transferred:${newOwner.id}`, voiceChannel.id)
            .exec();

          await voiceChannel.permissionOverwrites.edit(newOwner, {
            ViewChannel: true,
            Connect: true
          });

          await replyMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setAuthor({ 
  					name: 'Paul Dev 🍷', 
 					iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		 	  	})
                .setDescription(`✅ Transferred ownership to <@${newOwner.id}>`)
                .setColor('#57F287')
                .setFooter({ text: 'OneTab - Voice management' })
            ],
            components: []
          });
        } catch (error) {
          console.error(error);
          await replyMsg.edit({
            embeds: [
              new EmbedBuilder()
                .setAuthor({ 
  					name: 'Paul Dev 🍷', 
 					iconURL: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
		 	 	})
                .setDescription('⚠️ Failed to transfer ownership!')
                .setColor('#ED4245')
                .setFooter({ text: 'OneTab - Voice management' })
            ],
            components: []
          });
        }
      } else {
        // Cancelled
        await replyMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle('Transfer Command Cancelled')
              .setDescription('⛔ Member owner transfer cancelled.')
              .setColor('#ED4245')
              .setFooter({ text: 'OneTab - Voice management' })
          ],
          components: []
        });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await replyMsg.edit({ components: [] });
      }
    });
  }
};

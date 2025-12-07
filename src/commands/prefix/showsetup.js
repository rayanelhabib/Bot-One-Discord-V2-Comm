const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { redis } = require('../../redisClient');

module.exports = {
  name: 'showsetup',
  description: 'Display the voice control interface as when creating a channel.',
  usage: '.v showsetup',
  async execute(message, args, client) {
    try {
    // Vérification que seul l'utilisateur autorisé peut utiliser cette commande
    if (message.author.id !== '1366651120373600296') {
      return message.reply({ embeds: [
        new EmbedBuilder()
          .setTitle('⛔ Permission Denied')
          .setDescription('⚠️ Only the bot owner can use this command.')
          .setColor('#FEE75C')
          .setFooter({ text: 'OneTab - Voice management' })
      ] });
    }

    const guild = message.guild;
    const iconURL = guild.iconURL({ dynamic: true, size: 256, extension: 'png' });
    const member = message.member;
    const userId = member.id;

    // Find the voice channel where the user is present
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return message.reply('❌ You must be in a temporary voice channel to use this command.');
    }

    // Verification removed: authorized user can use the command even if they are not the owner
    // const ownerId = await redis.get(`creator:${voiceChannel.id}`);
    // if (!ownerId || ownerId !== userId) {
    //   return message.reply('❌ You must be the owner of your temporary voice channel to use this command.');
    // }

    // Custom emojis (identical to voiceStateUpdate.js)
    const BUTTON_ICONS = {
      lock: '<:verrouilleralt:1393654042647072828>',
      unlock: '<:unlock:1393654040193400832>',
      rename: '<:notes:1393698906499715264>',
      transfer: '<:crown1:1393695768048570548>',
      settings: '<:setting:1393654031519322303>',
      mute: '<:mute:1393654029153730650>',
      unmute: '<:volume:1393654026780016720>',
      hide: '<:invisible:1393654038087598152>',
      unhide: '<:show:1393654035935920128>',
      status: '<:web:1393693400800165939>',
    };

    const embed = new EmbedBuilder()
      .setTitle('Late Night Community')
      .setThumbnail(iconURL)
      .setDescription('late night interface\nClick the buttons below to control your voice channel')
      .setColor('#5865F2')
      .setFooter({ text: guild.name });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_lock_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.lock).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unlock_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.unlock).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_hide_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.hide).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unhide_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.unhide).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_transfer_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.transfer).setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_rename_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.rename).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_mute_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.mute).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unmute_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.unmute).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_settings_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.settings).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_status_${voiceChannel.id}`).setEmoji(BUTTON_ICONS.status).setStyle(ButtonStyle.Secondary)
    );

    await message.reply({
      embeds: [embed],
      components: [row1, row2]
    });
    } catch (error) {
      console.error('[SHOWSETUP] Error:', error);
      await message.reply('❌ Error displaying setup interface.').catch(() => {});
    }
  }
}; 
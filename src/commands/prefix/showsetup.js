const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits
} = require('discord.js');
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

    // === DISCORD COMPONENTS V2 PANEL ===
    const titleText = new TextDisplayBuilder().setContent(`# Voice Channel Control Panel`);
    const descriptionText = new TextDisplayBuilder().setContent(`> As a voice channel owner, you can manage your room using the buttons below.`);
    const footerText = new TextDisplayBuilder().setContent(`[Developed by skz_rayan23](https://discord.gg/wyWGcKWssQ)`);

    // Première rangée de boutons
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_lock_${voiceChannel.id}`).setEmoji('<:verrouilleralt:1393654042647072828>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unlock_${voiceChannel.id}`).setEmoji('<:unlock:1393654040193400832>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_hide_${voiceChannel.id}`).setEmoji('<:invisible:1393654038087598152>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unhide_${voiceChannel.id}`).setEmoji('<:show:1393654035935920128>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_transfer_${voiceChannel.id}`).setEmoji('<:crown1:1393695768048570548>').setStyle(ButtonStyle.Secondary)
    );
    
    // Deuxième rangée de boutons
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_rename_${voiceChannel.id}`).setEmoji('<:notes:1393698906499715264>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_mute_${voiceChannel.id}`).setEmoji('<:mute:1393654029153730650>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unmute_${voiceChannel.id}`).setEmoji('<:volume:1393654026780016720>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_settings_${voiceChannel.id}`).setEmoji('<:setting:1393654031519322303>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_status_${voiceChannel.id}`).setEmoji('<:web:1393693400800165939>').setStyle(ButtonStyle.Secondary)
    );

    // Troisième rangée de boutons (nouveaux)
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_claim_${voiceChannel.id}`).setEmoji('<:couronne1Copy:1400312921698861076>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_limit_${voiceChannel.id}`).setEmoji('<:arcadialimit:1381416262483050589>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_permit_${voiceChannel.id}`).setEmoji('<:ajoutdutilisateur:1400312916263178283>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_deny_${voiceChannel.id}`).setEmoji('<:supprimerlutilisateur:1400312929156464660>').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_trash_${voiceChannel.id}`).setEmoji('<:poubelle:1400312926975295598>').setStyle(ButtonStyle.Secondary)
    );

    // Quatrième rangée de boutons
    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_name_${voiceChannel.id}`).setEmoji('<:acadiarename:1381416711001079809>').setStyle(ButtonStyle.Secondary)
    );
    
    // Menu de sélection pour les fonctionnalités
    const row5 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`vc_features_${voiceChannel.id}`)
        .setPlaceholder('🔧 Channel Features')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('Soundboard - ON')
            .setValue('soundboard_on')
            .setEmoji('<:arcadiasbon:1384183874405273681>'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Soundboard - OFF')
            .setValue('soundboard_off')
            .setEmoji('<:arcadiasboff:1384185071304445963>'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Camera - ON')
            .setValue('camera_on')
            .setEmoji('<:arcadiacamon:1384185720293560451>'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Camera - OFF')
            .setValue('camera_off')
            .setEmoji('<:arcadiacamoff:1384186030592102461>'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Activities - ON')
            .setValue('activities_on')
            .setEmoji('<:acradiaacton:1384186660731883570>'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Activities - OFF')
            .setValue('activities_off')
            .setEmoji('<:arcadiaactoff:1384186982443384842>')
        )
    );

    // Container principal avec tous les composants
    const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, descriptionText, footerText)
        .addActionRowComponents(row5, row1, row2, row3, row4);

    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container]
    });
    } catch (error) {
      console.error('[SHOWSETUP] Error:', error);
      await message.reply('❌ Error displaying setup interface.').catch(() => {});
    }
  }
}; 
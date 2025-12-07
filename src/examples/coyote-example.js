const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  MessageFlags
} = require('discord.js');

// Discord Components v2 from @discordjs/builders
const {
  SectionBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder
} = require('@discordjs/builders');

/**
 * EXEMPLE COYOTE - Discord Components v2
 * Basé sur la structure JSON fournie
 */

// Configuration des couleurs et emojis
const COLORS = {
  WILD: 0xAB7B3A,  // Couleur coyote
  DANGER: 0xED4245,
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C
};

const EMOJIS = {
  COYOTE: '🐺',
  PET: '🤗',
  FEED: '🍖',
  RUN: '🏃‍♂️',
  WILD: '🌿',
  DANGER: '⚠️'
};

/**
 * Créer l'exemple coyote avec ContainerBuilder
 */
function createCoyoteExample() {
  // Container principal avec couleur d'accent
  const coyoteContainer = new ContainerBuilder()
    .setAccentColor(COLORS.WILD)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.WILD} You have encountered a wild coyote! ${EMOJIS.COYOTE}`)
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/voice_thumb.png")
        .setDescription("Wild Coyote")
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`**What would you like to do?**\n\n${EMOJIS.DANGER} Choose your action carefully!`)
    );

  // Boutons d'action
  const actionButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('pet_coyote')
        .setLabel('Pet it!')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(EMOJIS.PET),
      new ButtonBuilder()
        .setCustomId('feed_coyote')
        .setLabel('Attempt to feed it')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(EMOJIS.FEED),
      new ButtonBuilder()
        .setCustomId('run_away')
        .setLabel('Run away!')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(EMOJIS.RUN)
    );

  return [coyoteContainer, actionButtons];
}

/**
 * Créer l'exemple coyote avec SectionBuilder (alternative)
 */
function createCoyoteExampleWithSections() {
  // Section principale
  const mainSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.WILD} You have encountered a wild coyote! ${EMOJIS.COYOTE}`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/voice_thumb.png")
        .setDescription("Wild Coyote")
    );

  // Section d'action
  const actionSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`**What would you like to do?**\n\n${EMOJIS.DANGER} Choose your action carefully!`)
    );

  // Boutons d'action
  const actionButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('pet_coyote')
        .setLabel('Pet it!')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(EMOJIS.PET),
      new ButtonBuilder()
        .setCustomId('feed_coyote')
        .setLabel('Attempt to feed it')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(EMOJIS.FEED),
      new ButtonBuilder()
        .setCustomId('run_away')
        .setLabel('Run away!')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(EMOJIS.RUN)
    );

  return [mainSection, actionSection, actionButtons];
}

/**
 * Exemple avec plusieurs coyotes (galerie)
 */
function createCoyoteGalleryExample() {
  const galleryContainer = new ContainerBuilder()
    .setAccentColor(COLORS.WILD)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.WILD} Coyote Pack Encounter! ${EMOJIS.COYOTE}`)
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/voice_thumb.png")
        .setDescription("Alpha Coyote"),
      new ThumbnailBuilder()
        .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/access_thumb.png")
        .setDescription("Beta Coyote"),
      new ThumbnailBuilder()
        .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/team_thumb.png")
        .setDescription("Gamma Coyote")
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`**A pack of wild coyotes has appeared!**\n\n${EMOJIS.DANGER} This is more dangerous than a single coyote!`)
    );

  // Boutons pour la meute
  const packButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('pet_alpha')
        .setLabel('Pet the Alpha')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(EMOJIS.PET),
      new ButtonBuilder()
        .setCustomId('feed_pack')
        .setLabel('Feed the Pack')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(EMOJIS.FEED),
      new ButtonBuilder()
        .setCustomId('run_fast')
        .setLabel('Run for your life!')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(EMOJIS.RUN)
    );

  return [galleryContainer, packButtons];
}

/**
 * Exemple avec sélection de stratégie
 */
function createCoyoteStrategyExample() {
  const strategyContainer = new ContainerBuilder()
    .setAccentColor(COLORS.WILD)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.WILD} Strategic Coyote Encounter ${EMOJIS.COYOTE}`)
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/admin_thumb.png")
        .setDescription("Strategic Coyote")
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`**Choose your strategy carefully!**\n\nThis coyote seems intelligent and strategic.`)
    );

  // Boutons de stratégie
  const strategyButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('diplomatic_approach')
        .setLabel('Diplomatic Approach')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🤝'),
      new ButtonBuilder()
        .setCustomId('stealth_mode')
        .setLabel('Stealth Mode')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🥷'),
      new ButtonBuilder()
        .setCustomId('aggressive_tactics')
        .setLabel('Aggressive Tactics')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId('retreat_strategically')
        .setLabel('Strategic Retreat')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🏃‍♂️')
    );

  return [strategyContainer, strategyButtons];
}

/**
 * Fonction principale pour envoyer l'exemple
 */
async function sendCoyoteExample(message, type = 'basic') {
  let components;
  
  switch(type) {
    case 'basic':
      components = createCoyoteExample();
      break;
    case 'sections':
      components = createCoyoteExampleWithSections();
      break;
    case 'gallery':
      components = createCoyoteGalleryExample();
      break;
    case 'strategy':
      components = createCoyoteStrategyExample();
      break;
    default:
      components = createCoyoteExample();
  }

  try {
    await message.reply({
      components: components,
      flags: MessageFlags.IsComponentsV2
    });
    
    await message.reply({
      content: `✅ **Exemple Coyote envoyé !** (Type: ${type})\n\n` +
              `**Types disponibles :**\n` +
              `• \`basic\` - Exemple simple avec ContainerBuilder\n` +
              `• \`sections\` - Exemple avec SectionBuilder\n` +
              `• \`gallery\` - Exemple avec galerie de coyotes\n` +
              `• \`strategy\` - Exemple avec stratégies avancées\n\n` +
              `**Utilisation :** \`.v coyote-example [type]\``,
      flags: MessageFlags.SuppressEmbeds
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'exemple coyote:', error);
    
    await message.reply({
      content: '❌ **Erreur lors de l\'envoi de l\'exemple coyote**\n\n' +
              'Vérifiez les logs pour plus de détails.',
      flags: MessageFlags.SuppressEmbeds
    });
  }
}

// Export des fonctions
module.exports = {
  createCoyoteExample,
  createCoyoteExampleWithSections,
  createCoyoteGalleryExample,
  createCoyoteStrategyExample,
  sendCoyoteExample
};

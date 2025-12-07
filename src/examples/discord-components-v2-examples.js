const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ChannelType,
  MessageFlags
} = require('discord.js');

// Discord Components v2 from @discordjs/builders
const {
  SectionBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  FileBuilder
} = require('@discordjs/builders');

/**
 * EXEMPLES DISCORD COMPONENTS V2
 * ==============================
 * 
 * Ce fichier contient des exemples complets d'utilisation de Discord Components v2
 * avec des conteneurs, des sélections et plusieurs thumbnails.
 */

// Configuration des couleurs et emojis
const COLORS = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  DANGER: 0xED4245,
  WARNING: 0xFEE75C,
  INFO: 0x5BC0DE,
  PREMIUM: 0xFF73FA
};

const EMOJIS = {
  VOICE: '🔊',
  LOCK: '🔒',
  TEAM: '👥',
  ADMIN: '👨‍💼',
  CHANNEL: '📢',
  ADD: '➕',
  SUCCESS: '✅',
  INFO: 'ℹ️',
  SPARKLES: '✨'
};

// URLs d'exemple pour les thumbnails
const THUMBNAIL_URLS = {
  VOICE: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/voice_thumb.png',
  ACCESS: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/access_thumb.png',
  TEAM: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/team_thumb.png',
  ADMIN: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/admin_thumb.png',
  LOGO: 'https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/Picsart_25-08-22_01-59-42-726.jpg'
};

/**
 * EXEMPLE 1: Section simple avec thumbnail
 */
function createSimpleContainerWithThumbnails() {
  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.SPARKLES} Exemple de Section Simple ${EMOJIS.SPARKLES}

**Cette section montre comment ajouter un thumbnail**

Voici un exemple d'utilisation des Discord Components v2 avec un thumbnail.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.VOICE)
        .setDescription("Gestion Vocale")
    );

  return [section];
}

/**
 * EXEMPLE 2: Section avec sélection de canaux
 */
function createChannelSelectionExample() {
  // Section d'information
  const infoSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.CHANNEL} Sélection de Canaux

**Choisissez les canaux vocaux à configurer**

Utilisez le menu de sélection ci-dessous pour choisir les canaux que vous souhaitez configurer.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.VOICE)
        .setDescription("Canaux Vocaux")
    );

  // Menu de sélection de canaux
  const channelSelectMenu = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_channels')
        .setPlaceholder(`${EMOJIS.CHANNEL} Sélectionnez les canaux...`)
        .setChannelTypes([ChannelType.GuildVoice, ChannelType.GuildCategory])
        .setMinValues(1)
        .setMaxValues(5)
    );

  return [infoSection, channelSelectMenu];
}

/**
 * EXEMPLE 3: Section avec sélection de rôles
 */
function createRoleSelectionExample() {
  const roleSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.TEAM} Sélection de Rôles

**Définissez les rôles avec accès aux fonctionnalités**

Sélectionnez les rôles qui pourront utiliser les commandes avancées.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.TEAM)
        .setDescription("Gestion d'Équipe")
    );

  const roleSelectMenu = new ActionRowBuilder()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('select_roles')
        .setPlaceholder(`${EMOJIS.TEAM} Sélectionnez les rôles...`)
        .setMinValues(1)
        .setMaxValues(10)
    );

  return [roleSection, roleSelectMenu];
}

/**
 * EXEMPLE 4: Section avec sélection d'utilisateurs
 */
function createUserSelectionExample() {
  const userSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.ADD} Sélection d'Utilisateurs

**Ajoutez des utilisateurs comme gestionnaires**

Choisissez les utilisateurs qui pourront gérer les canaux vocaux.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.ADMIN)
        .setDescription("Administration")
    );

  const userSelectMenu = new ActionRowBuilder()
    .addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('select_users')
        .setPlaceholder(`${EMOJIS.ADD} Sélectionnez les utilisateurs...`)
        .setMinValues(1)
        .setMaxValues(5)
    );

  return [userSection, userSelectMenu];
}

/**
 * EXEMPLE 5: Section avec sélection multiple (mentionable)
 */
function createMentionableSelectionExample() {
  const mentionableSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.INFO} Sélection Multiple

**Sélectionnez des utilisateurs ET des rôles**

Ce menu permet de sélectionner à la fois des utilisateurs et des rôles.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.TEAM)
        .setDescription("Utilisateurs et Rôles")
    );

  const mentionableSelectMenu = new ActionRowBuilder()
    .addComponents(
      new MentionableSelectMenuBuilder()
        .setCustomId('select_mentionables')
        .setPlaceholder(`${EMOJIS.INFO} Sélectionnez utilisateurs/rôles...`)
        .setMinValues(1)
        .setMaxValues(10)
    );

  return [mentionableSection, mentionableSelectMenu];
}

/**
 * EXEMPLE 6: Section avec menu de sélection de chaînes
 */
function createStringSelectionExample() {
  const stringSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.SPARKLES} Menu de Sélection de Chaînes

**Choisissez une option dans le menu déroulant**

Ce menu permet de sélectionner des options prédéfinies.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.LOGO)
        .setDescription("Options")
    );

  const stringSelectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_string_options')
        .setPlaceholder(`${EMOJIS.SPARKLES} Choisissez une option...`)
        .setMinValues(1)
        .setMaxValues(3)
        .addOptions([
          {
            label: 'Option 1 - Gestion Vocale',
            description: 'Configurer les canaux vocaux',
            value: 'voice_management',
            emoji: EMOJIS.VOICE
          },
          {
            label: 'Option 2 - Contrôle d\'Accès',
            description: 'Gérer les permissions',
            value: 'access_control',
            emoji: EMOJIS.LOCK
          },
          {
            label: 'Option 3 - Gestion d\'Équipe',
            description: 'Administrer l\'équipe',
            value: 'team_management',
            emoji: EMOJIS.TEAM
          },
          {
            label: 'Option 4 - Administration',
            description: 'Outils d\'administration',
            value: 'administration',
            emoji: EMOJIS.ADMIN
          }
        ])
    );

  return [stringSection, stringSelectMenu];
}

/**
 * EXEMPLE 7: Section avec thumbnail
 */
function createThumbnailGalleryExample() {
  const gallerySection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.SPARKLES} Galerie de Thumbnails

**Collection d'images et d'icônes**

Voici un exemple de thumbnail dans le système.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.VOICE)
        .setDescription("Gestion Vocale")
    );

  return [gallerySection];
}

/**
 * EXEMPLE 8: Mise en page avancée avec sections
 */
function createAdvancedLayoutExample() {
  // Section d'en-tête
  const headerSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`# ${EMOJIS.SPARKLES} Mise en Page Avancée ${EMOJIS.SPARKLES}`),
      new TextDisplayBuilder()
        .setContent(`**Exemple d'utilisation des sections et séparateurs**`)
    );

  // Section principale
  const mainSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`## ${EMOJIS.INFO} Section Principale

Cette section montre comment organiser le contenu avec des thumbnails.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.LOGO)
        .setDescription("Principal")
    );

  // Séparateur
  const separator = new SeparatorBuilder().setDivider(true);

  // Section secondaire
  const secondarySection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(`## ${EMOJIS.SUCCESS} Section Secondaire

Cette section est séparée de la principale par un séparateur.`)
    )
    .setThumbnailAccessory(
      new ThumbnailBuilder()
        .setURL(THUMBNAIL_URLS.VOICE)
        .setDescription("Secondaire")
    );

  return [
    headerSection,
    separator,
    mainSection,
    separator,
    secondarySection
  ];
}

/**
 * EXEMPLE COMPLET: Tous les exemples combinés
 */
function createCompleteExample() {
  const examples = [
    ...createSimpleContainerWithThumbnails(),
    ...createChannelSelectionExample(),
    ...createRoleSelectionExample(),
    ...createUserSelectionExample(),
    ...createMentionableSelectionExample(),
    ...createStringSelectionExample(),
    ...createThumbnailGalleryExample(),
    ...createAdvancedLayoutExample()
  ];

  return examples;
}

/**
 * FONCTION D'EXEMPLE POUR TESTER
 */
async function sendExampleMessage(message) {
  const exampleComponents = createCompleteExample();
  
  return message.reply({
    components: exampleComponents,
    flags: MessageFlags.IsComponentsV2
  });
}

// Export des fonctions pour utilisation
module.exports = {
  createSimpleContainerWithThumbnails,
  createChannelSelectionExample,
  createRoleSelectionExample,
  createUserSelectionExample,
  createMentionableSelectionExample,
  createStringSelectionExample,
  createThumbnailGalleryExample,
  createAdvancedLayoutExample,
  createCompleteExample,
  sendExampleMessage
};

# Discord Components v2 - Guide Complet

## Introduction

Discord Components v2 est une nouvelle version des composants Discord qui permet de créer des interfaces utilisateur plus riches et interactives. Ce guide vous montre comment utiliser les conteneurs, les sélections et les thumbnails multiples.

## Installation

```bash
npm install @discordjs/builders discord.js
```

## Imports Requis

```javascript
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

// Discord Components v2
const {
  SectionBuilder,
  ContainerBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  FileBuilder
} = require('@discordjs/builders');
```

## Concepts de Base

### 1. ContainerBuilder
Le `ContainerBuilder` est l'élément principal pour créer des conteneurs avec du contenu et des thumbnails.

```javascript
const container = new ContainerBuilder()
  .setAccentColor(0x5865F2) // Couleur de la bordure
  .addTextDisplayComponents(
    new TextDisplayBuilder()
      .setContent("# Titre\n**Description**")
  )
  .addThumbnailComponents(
    new ThumbnailBuilder()
      .setURL("https://example.com/image.png")
      .setDescription("Description de l'image")
  );
```

### 2. ThumbnailBuilder
Pour ajouter des images dans vos conteneurs :

```javascript
const thumbnail = new ThumbnailBuilder()
  .setURL("https://example.com/image.png")
  .setDescription("Description de l'image");
```

### 3. TextDisplayBuilder
Pour ajouter du texte formaté :

```javascript
const textDisplay = new TextDisplayBuilder()
  .setContent("# Titre\n**Texte en gras**\n*Texte en italique*");
```

## Exemples d'Utilisation

### Exemple 1: Conteneur Simple avec Thumbnails

```javascript
function createSimpleContainer() {
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Mon Conteneur\n**Description du conteneur**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/image1.png")
        .setDescription("Image 1"),
      new ThumbnailBuilder()
        .setURL("https://example.com/image2.png")
        .setDescription("Image 2")
    );

  return [container];
}
```

### Exemple 2: Conteneur avec Sélection de Canaux

```javascript
function createChannelSelection() {
  // Conteneur d'information
  const container = new ContainerBuilder()
    .setAccentColor(0x5BC0DE)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Sélection de Canaux\n**Choisissez les canaux à configurer**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/voice.png")
        .setDescription("Canaux Vocaux")
    );

  // Menu de sélection
  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_channels')
        .setPlaceholder('Sélectionnez les canaux...')
        .setChannelTypes([ChannelType.GuildVoice])
        .setMinValues(1)
        .setMaxValues(5)
    );

  return [container, selectMenu];
}
```

### Exemple 3: Conteneur avec Sélection de Rôles

```javascript
function createRoleSelection() {
  const container = new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Sélection de Rôles\n**Choisissez les rôles avec permissions**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/team.png")
        .setDescription("Gestion d'Équipe")
    );

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('select_roles')
        .setPlaceholder('Sélectionnez les rôles...')
        .setMinValues(1)
        .setMaxValues(10)
    );

  return [container, selectMenu];
}
```

### Exemple 4: Conteneur avec Sélection d'Utilisateurs

```javascript
function createUserSelection() {
  const container = new ContainerBuilder()
    .setAccentColor(0xFEE75C)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Sélection d'Utilisateurs\n**Ajoutez des gestionnaires**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/admin.png")
        .setDescription("Administration")
    );

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('select_users')
        .setPlaceholder('Sélectionnez les utilisateurs...')
        .setMinValues(1)
        .setMaxValues(5)
    );

  return [container, selectMenu];
}
```

### Exemple 5: Conteneur avec Sélection Multiple (Mentionable)

```javascript
function createMentionableSelection() {
  const container = new ContainerBuilder()
    .setAccentColor(0xFF73FA)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Sélection Multiple\n**Utilisateurs ET rôles**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/mixed.png")
        .setDescription("Mixte")
    );

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new MentionableSelectMenuBuilder()
        .setCustomId('select_mentionables')
        .setPlaceholder('Sélectionnez utilisateurs/rôles...')
        .setMinValues(1)
        .setMaxValues(10)
    );

  return [container, selectMenu];
}
```

### Exemple 6: Conteneur avec Menu de Sélection de Chaînes

```javascript
function createStringSelection() {
  const container = new ContainerBuilder()
    .setAccentColor(0xED4245)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Menu de Sélection\n**Choisissez une option**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/options.png")
        .setDescription("Options")
    );

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_options')
        .setPlaceholder('Choisissez une option...')
        .setMinValues(1)
        .setMaxValues(3)
        .addOptions([
          {
            label: 'Option 1',
            description: 'Description de l\'option 1',
            value: 'option1',
            emoji: '🔊'
          },
          {
            label: 'Option 2',
            description: 'Description de l\'option 2',
            value: 'option2',
            emoji: '🔒'
          }
        ])
    );

  return [container, selectMenu];
}
```

### Exemple 7: Galerie de Thumbnails

```javascript
function createThumbnailGallery() {
  const container = new ContainerBuilder()
    .setAccentColor(0xFF73FA)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Galerie de Thumbnails\n**Collection d'images**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/image1.png")
        .setDescription("Image 1"),
      new ThumbnailBuilder()
        .setURL("https://example.com/image2.png")
        .setDescription("Image 2"),
      new ThumbnailBuilder()
        .setURL("https://example.com/image3.png")
        .setDescription("Image 3"),
      new ThumbnailBuilder()
        .setURL("https://example.com/image4.png")
        .setDescription("Image 4"),
      new ThumbnailBuilder()
        .setURL("https://example.com/image5.png")
        .setDescription("Image 5")
    );

  return [container];
}
```

### Exemple 8: Mise en Page Avancée avec Sections

```javascript
function createAdvancedLayout() {
  // Section d'en-tête
  const headerSection = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Titre Principal"),
      new TextDisplayBuilder()
        .setContent("**Sous-titre**")
    );

  // Conteneur principal
  const mainContainer = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("## Conteneur Principal\nContenu principal")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/main.png")
        .setDescription("Principal")
    );

  // Séparateur
  const separator = new SeparatorBuilder().setDivider(true);

  // Conteneur secondaire
  const secondaryContainer = new ContainerBuilder()
    .setAccentColor(0x57F287)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("## Conteneur Secondaire\nContenu secondaire")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/secondary.png")
        .setDescription("Secondaire")
    );

  return [
    headerSection,
    separator,
    mainContainer,
    separator,
    secondaryContainer
  ];
}
```

## Utilisation dans une Commande

```javascript
module.exports = {
  name: 'example',
  description: 'Exemple de Discord Components v2',
  
  async execute(message, args, client) {
    // Créer les composants
    const components = createCompleteExample();
    
    // Envoyer le message
    return message.reply({
      components: components,
      flags: MessageFlags.IsComponentsV2
    });
  }
};
```

## Gestion des Interactions

```javascript
// Dans votre event handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isAnySelectMenu()) return;
  
  switch(interaction.customId) {
    case 'select_channels':
      const channels = interaction.values;
      await interaction.reply(`Canaux sélectionnés: ${channels.join(', ')}`);
      break;
      
    case 'select_roles':
      const roles = interaction.values;
      await interaction.reply(`Rôles sélectionnés: ${roles.join(', ')}`);
      break;
      
    case 'select_users':
      const users = interaction.values;
      await interaction.reply(`Utilisateurs sélectionnés: ${users.join(', ')}`);
      break;
      
    case 'select_mentionables':
      const mentionables = interaction.values;
      await interaction.reply(`Éléments sélectionnés: ${mentionables.join(', ')}`);
      break;
      
    case 'select_options':
      const options = interaction.values;
      await interaction.reply(`Options sélectionnées: ${options.join(', ')}`);
      break;
  }
});
```

## Bonnes Pratiques

1. **Couleurs**: Utilisez des couleurs cohérentes pour vos conteneurs
2. **Thumbnails**: Limitez le nombre de thumbnails par conteneur (max 5-6)
3. **Descriptions**: Ajoutez des descriptions claires pour les thumbnails
4. **Séparateurs**: Utilisez les séparateurs pour organiser le contenu
5. **Sélections**: Limitez le nombre d'options dans les menus de sélection

## Limitations

- Les Discord Components v2 ne supportent pas les boutons interactifs
- Les menus de sélection fonctionnent normalement
- Les thumbnails doivent être des URLs valides
- Limite de 25 composants par message

## Support

Pour plus d'informations, consultez la documentation officielle de Discord.js et @discordjs/builders.

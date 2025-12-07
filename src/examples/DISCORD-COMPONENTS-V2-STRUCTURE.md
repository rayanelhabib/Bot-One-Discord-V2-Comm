# Structure des Discord Components v2

## Architecture des Composants

```
Discord Components v2
├── ContainerBuilder
│   ├── setAccentColor(color)
│   ├── addTextDisplayComponents(...textDisplays)
│   └── addThumbnailComponents(...thumbnails)
├── SectionBuilder
│   └── addTextDisplayComponents(...textDisplays)
├── SeparatorBuilder
│   └── setDivider(boolean)
├── TextDisplayBuilder
│   └── setContent(markdownContent)
├── ThumbnailBuilder
│   ├── setURL(imageURL)
│   └── setDescription(description)
└── FileBuilder
    ├── setURL(fileURL)
    └── setDescription(description)
```

## Types de Sélections

```
Sélections Discord
├── ChannelSelectMenuBuilder
│   ├── setCustomId(id)
│   ├── setPlaceholder(text)
│   ├── setChannelTypes([...types])
│   ├── setMinValues(number)
│   └── setMaxValues(number)
├── RoleSelectMenuBuilder
│   ├── setCustomId(id)
│   ├── setPlaceholder(text)
│   ├── setMinValues(number)
│   └── setMaxValues(number)
├── UserSelectMenuBuilder
│   ├── setCustomId(id)
│   ├── setPlaceholder(text)
│   ├── setMinValues(number)
│   └── setMaxValues(number)
├── MentionableSelectMenuBuilder
│   ├── setCustomId(id)
│   ├── setPlaceholder(text)
│   ├── setMinValues(number)
│   └── setMaxValues(number)
└── StringSelectMenuBuilder
    ├── setCustomId(id)
    ├── setPlaceholder(text)
    ├── setMinValues(number)
    ├── setMaxValues(number)
    └── addOptions([...options])
```

## Exemple de Structure Complète

```
Message Discord
├── ContainerBuilder (Principal)
│   ├── TextDisplayBuilder (Titre)
│   ├── TextDisplayBuilder (Description)
│   ├── ThumbnailBuilder (Image 1)
│   ├── ThumbnailBuilder (Image 2)
│   └── ThumbnailBuilder (Image 3)
├── ContainerBuilder (Sélection)
│   ├── TextDisplayBuilder (Instructions)
│   └── ThumbnailBuilder (Icône)
├── ActionRowBuilder
│   └── ChannelSelectMenuBuilder
├── ContainerBuilder (Rôles)
│   ├── TextDisplayBuilder (Instructions)
│   └── ThumbnailBuilder (Icône)
├── ActionRowBuilder
│   └── RoleSelectMenuBuilder
├── ContainerBuilder (Utilisateurs)
│   ├── TextDisplayBuilder (Instructions)
│   └── ThumbnailBuilder (Icône)
├── ActionRowBuilder
│   └── UserSelectMenuBuilder
└── ActionRowBuilder
    └── StringSelectMenuBuilder
```

## Flux de Données

```
1. Création des Composants
   ↓
2. ContainerBuilder avec Thumbnails
   ↓
3. ActionRowBuilder avec Sélections
   ↓
4. Envoi du Message avec MessageFlags.IsComponentsV2
   ↓
5. Interaction Utilisateur
   ↓
6. Gestion de l'Interaction dans interactionCreate
```

## Couleurs Recommandées

```javascript
const COLORS = {
  PRIMARY: 0x5865F2,    // Bleu Discord
  SUCCESS: 0x57F287,    // Vert
  DANGER: 0xED4245,     // Rouge
  WARNING: 0xFEE75C,    // Jaune
  INFO: 0x5BC0DE,       // Cyan
  PREMIUM: 0xFF73FA     // Rose/Magenta
};
```

## Types de Canaux Supportés

```javascript
const CHANNEL_TYPES = [
  ChannelType.GuildText,        // Texte
  ChannelType.GuildVoice,       // Vocal
  ChannelType.GuildCategory,    // Catégorie
  ChannelType.GuildNews,        // Annonces
  ChannelType.GuildStageVoice,  // Scène
  ChannelType.GuildForum        // Forum
];
```

## Limites et Contraintes

- **Thumbnails par conteneur** : Maximum 5-6 recommandé
- **Composants par message** : Maximum 25
- **Options par menu** : Maximum 25
- **Valeurs sélectionnées** : Maximum 25
- **Longueur du contenu** : Maximum 2000 caractères par TextDisplay

## Bonnes Pratiques

1. **Organisation** : Utilisez des conteneurs séparés pour différents types de contenu
2. **Couleurs** : Maintenez une cohérence dans les couleurs d'accent
3. **Thumbnails** : Ajoutez des descriptions claires
4. **Sélections** : Limitez le nombre d'options pour éviter la surcharge
5. **Séparateurs** : Utilisez les séparateurs pour organiser le contenu
6. **Gestion d'erreurs** : Implémentez une gestion d'erreurs robuste

## Exemple de Code Complet

```javascript
// Création d'un conteneur avec sélection
function createContainerWithSelection() {
  // Conteneur d'information
  const container = new ContainerBuilder()
    .setAccentColor(0x5865F2)
    .addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent("# Titre\n**Description**")
    )
    .addThumbnailComponents(
      new ThumbnailBuilder()
        .setURL("https://example.com/image.png")
        .setDescription("Description")
    );

  // Menu de sélection
  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('select_channels')
        .setPlaceholder('Sélectionnez...')
        .setChannelTypes([ChannelType.GuildVoice])
        .setMinValues(1)
        .setMaxValues(5)
    );

  return [container, selectMenu];
}

// Utilisation
const components = createContainerWithSelection();
await message.reply({
  components: components,
  flags: MessageFlags.IsComponentsV2
});
```

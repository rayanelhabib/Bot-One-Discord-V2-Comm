const { getGuildConfig } = require('../utils/configManager');
const { safeGet, safeSet, safeDel, redisEnabled } = require('../redisClient');
const { getOrCreateTextChannel } = require('../utils/voiceHelper');
const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ChannelType, 
  PermissionFlagsBits,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  SeparatorBuilder,
  AttachmentBuilder
} = require('discord.js');
const { handleStaffLeave, handleStaffReturn } = require('../commands/prefix/task');

// 🚀 CONFIGURATION ULTRA-PERFORMANCE MAXIMALE (ZÉRO BLOCAGE GARANTI !)
const RATE_LIMIT_WINDOW = 3000; // 3 secondes (ultra-rapide optimisé)
const RATE_LIMIT_MAX = 1000; // 1000 salons par fenêtre (pour dizaines de milliers d'utilisateurs)
const MAX_RETRIES = 2; // 2 tentatives (optimisé pour plus de rapidité)
const OPERATION_TIMEOUT = 0; // 0ms (temps absolument maximal Discord API pour déplacement)
const WELCOME_MESSAGE_TIMEOUT = 2000; // 2.0 secondes (temps optimal pour message complexe)
const WELCOME_MESSAGE_ULTRA_FAST = true; // Mode ultra-rapide activé (1000ms)
const WELCOME_MESSAGE_ENABLED = true; // Activer/désactiver le message de bienvenue (false = désactiver complètement)
const CHANNEL_CREATION_TIMEOUT = 1500; // 1.5 seconde (temps optimal Discord API pour création)
const CHANNEL_DELETE_TIMEOUT = 500; // 0.5 seconde (temps réaliste Discord API pour suppression)
const MOVE_USER_TIMEOUT = 1500; // 1.5 secondes (temps optimal Discord API pour déplacement)
const INSTANT_CREATION = true; // Création instantanée sans vérifications bloquantes
// PARALLEL_CREATION supprimé - logique simplifiée

// 🧠 SYSTÈME DE SUPPRESSION COMPLET ET INTELLIGENT
const SMART_DELETION = false; // Ancien système désactivé
const DELETION_VERIFICATION_INTERVAL = 10000; // 10 secondes (nettoyage périodique)
const EMPTY_CHANNEL_CHECK_INTERVAL = 5000; // 5 secondes (vérification des salons vides)
const IMMEDIATE_DELETION_DELAY = 1000; // 1 seconde (délai avant suppression)
const DELETION_SAFETY_DELAY = 2000; // 2 secondes (délai de sécurité)
const AUTO_DELETE_EMPTY_DELAY = 3000; // 3 secondes (suppression auto si vide)
const PROTECTION_ROLES = ['owner', 'manager', 'dev', 'admin']; // Rôles protégés
const DB_SYNC_ENABLED = true; // Synchronisation DB automatique
const ERROR_RETRY_ATTEMPTS = 3; // Nombre de tentatives en cas d'erreur

// 🚀 NOUVELLES OPTIMISATIONS ULTRA-RAPIDES (basées sur le guide)
const ULTRA_FAST_WELCOME = true; // Mode ultra-rapide pour message de bienvenue
const PARALLEL_COMPONENT_CREATION = true; // Création parallèle des composants
const PREBUILT_COMPONENTS = true; // Composants pré-construits
const INSTANT_SEND = true; // Envoi immédiat sans await
const WELCOME_CACHE = true; // Cache des messages de bienvenue
const PREBUILD_ON_STARTUP = true; // Pré-créer les composants au démarrage
const MAX_CONCURRENT_CREATIONS = 100; // 100 créations simultanées (optimal pour Discord)
const MAX_DELETE_RATE = 2; // 2 suppressions par seconde (respect API Discord 2-3 req/sec)
const BATCH_CREATION_SIZE = 100; // Création par lots de 100 (ultra-rapide)
const ULTRA_FAST_MODE = true; // Mode ultra-rapide activé
const PARALLEL_VALIDATION = true; // Validation parallèle
const PRELOAD_CHANNELS = true; // Préchargement des salons
const SMART_CACHING = true; // Cache intelligent
const ADAPTIVE_TIMEOUT = true; // Timeout adaptatif
const CIRCUIT_BREAKER = true; // Circuit breaker pour éviter les surcharges
const HEALTH_CHECK = true; // Vérification de santé du système
const LOAD_BALANCING = true; // Équilibrage de charge
const AUTO_RECOVERY = false; // Récupération automatique désactivée
const ULTRA_CLEANUP = false; // Nettoyage ultra-avancé désactivé
const CHANNEL_MONITORING = false; // Monitoring avancé désactivé
const PREVENTIVE_MAINTENANCE = true; // Maintenance préventive
const ORPHAN_DETECTION = true; // Détection des salons orphelins
const AUTO_HEALING = true; // Auto-guérison du système
const ULTRA_PERFORMANCE_MODE = true; // Mode ultra-performance pour milliers d'utilisateurs
const INSTANT_RESPONSE = true; // Réponse instantanée
const MASSIVE_SCALE = true; // Support de masse
const ZERO_BLOCKING_MODE = true; // Mode zéro blocage garanti
const INSTANT_FAILOVER = true; // Basculement instantané en cas d'erreur

// Cache ULTRA-INTELLIGENT avec TTL dynamique et préchargement
const configCache = new Map();
const rateLimitCache = new Map();
const channelCreationCache = new Map();
const creationQueue = new Map(); // Queue par guild
const circuitBreaker = new Map(); // Circuit breaker par guild
const healthMetrics = new Map(); // Métriques de santé
const loadBalancer = new Map(); // Équilibrage de charge par guild
const channelMonitor = new Map(); // Monitoring des salons
const orphanChannels = new Map(); // Salons orphelins détectés
const deleteRateLimiter = new Map(); // Rate limiter pour suppressions (2-3 req/sec)
const cleanupQueue = new Map(); // Queue de nettoyage par guild
const maintenanceSchedule = new Map(); // Planning de maintenance

// 🚀 NOUVEAUX CACHES ULTRA-RAPIDES (basés sur le guide)
const welcomeMessageCache = new Map(); // Cache des messages de bienvenue
const prebuiltComponents = new Map(); // Composants pré-construits
const instantSendQueue = new Map(); // Queue d'envoi instantané
const startupPrebuiltComponents = new Map(); // Composants pré-construits au démarrage

// 🧠 CACHES POUR SYSTÈME DE SUPPRESSION SIMPLE
const channelCreationTimestamps = new Map(); // Timestamps de création des salons
const channelLastActivity = new Map(); // Dernière activité des salons
// ✅ Caches inutiles supprimés - système simplifié
// 🚀 Cache TTL ULTRA-PERFORMANCE MAXIMALE pour dizaines de milliers d'utilisateurs
const CONFIG_CACHE_TTL = 1000; // 1 seconde (ultra-rapide optimisé)
const RATE_LIMIT_CACHE_TTL = 500; // 0.5 seconde (ultra-rapide optimisé)
const CHANNEL_CACHE_TTL = 1000; // 1 seconde pour les salons (ultra-rapide optimisé)
const ULTRA_FAST_CACHE_TTL = 250; // 0.25 seconde pour les opérations critiques (ultra-rapide optimisé)
const CHANNEL_MONITOR_TTL = 5000; // 5 secondes pour le monitoring (ultra-rapide optimisé)
const ORPHAN_DETECTION_TTL = 15000; // 15 secondes pour détecter les orphelins (ultra-rapide optimisé)

// Circuit Breaker Configuration
const CIRCUIT_BREAKER_THRESHOLD = 5; // 5 échecs avant d'ouvrir le circuit
const CIRCUIT_BREAKER_TIMEOUT = 15000; // 15 secondes avant de réessayer
const CIRCUIT_BREAKER_RESET_TIMEOUT = 30000; // 30 secondes pour reset complet

// 🚀 Health Check Configuration ULTRA-PERFORMANCE
const HEALTH_CHECK_INTERVAL = 8000; // 8 secondes (plus fréquent)
const HEALTH_THRESHOLD = 0.7; // 70% de succès minimum (plus tolérant)
const RECOVERY_THRESHOLD = 0.9; // 90% de succès pour récupération (plus rapide)

// 🚀 Load Balancing Configuration ULTRA-PERFORMANCE
const LOAD_BALANCE_THRESHOLD = 0.8; // 80% de charge maximum (plus de tolérance)
const LOAD_BALANCE_RECOVERY = 0.4; // 40% de charge pour récupération (plus rapide)

// 🚀 Ultra Cleanup Configuration ULTRA-PERFORMANCE MAXIMALE
const CLEANUP_CHECK_INTERVAL = 1000; // 1 seconde (ultra-fréquent)
const ORPHAN_CLEANUP_DELAY = 4000; // 4 secondes avant nettoyage des orphelins (ultra-rapide)
const CHANNEL_EMPTY_TIMEOUT = 8000; // 8 secondes avant nettoyage des salons vides (ultra-rapide)
const PREVENTIVE_CLEANUP_INTERVAL = 30000; // 30 secondes (ultra-fréquent)

// 🚀 Channel Monitoring Configuration ULTRA-PERFORMANCE MAXIMALE
const CHANNEL_HEALTH_CHECK_INTERVAL = 4000; // 4 secondes (ultra-fréquent)
const CHANNEL_ORPHAN_CHECK_INTERVAL = 8000; // 8 secondes (ultra-fréquent)
const CHANNEL_MAINTENANCE_INTERVAL = 60000; // 1 minute (ultra-fréquent)

// 🚀 FONCTIONS ULTRA-RAPIDES (basées sur le guide d'optimisation)

// Fonction pour ajouter un salon à la queue de suppression
// ✅ Fonction queueChannelForDeletion supprimée - plus utilisée

// ✅ Fonction markChannelAsActive supprimée - plus utilisée

// Fonction de suppression simple et efficace
// Fonction de suppression simple et directe
// Fonction pour nettoyer les messages de bienvenue dans le salon textuel
async function cleanupWelcomeMessages(channelId, guildId) {
  try {
    const guild = await getChannelById(channelId, guildId)?.guild;
    if (!guild) return;
    
    // Trouver le salon textuel correspondant (même nom que le salon vocal)
    const voiceChannel = await getChannelById(channelId, guildId);
    if (!voiceChannel) return;
    
    // Chercher le salon textuel par plusieurs méthodes
    let textChannel = guild.channels.cache.find(ch => 
      ch.type === 0 && // Text channel
      ch.name === voiceChannel.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    );
    
    // Si pas trouvé, chercher par nom exact
    if (!textChannel) {
      textChannel = guild.channels.cache.find(ch => 
        ch.type === 0 && ch.name === voiceChannel.name
      );
    }
    
    // Si toujours pas trouvé, chercher tous les salons textuels et vérifier les messages
    if (!textChannel) {
      const textChannels = guild.channels.cache.filter(ch => ch.type === 0);
      for (const [_, ch] of textChannels) {
        try {
          const messages = await ch.messages.fetch({ limit: 10 });
          const hasWelcomeMessage = messages.some(msg => 
            msg.author.bot && 
            msg.components && 
            msg.components.some(row => 
              row.components.some(component => 
                component.customId && component.customId.includes(channelId)
              )
            )
          );
          
          if (hasWelcomeMessage) {
            textChannel = ch;
            break;
          }
        } catch (error) {
          // Ignorer les erreurs de permissions
          continue;
        }
      }
    }
    
    if (!textChannel) {
      console.log(`[CLEANUP_WELCOME] Aucun salon textuel trouvé pour ${voiceChannel.name}`);
      return;
    }
    
    // Trouver et supprimer les messages de bienvenue avec des boutons vc_
    const messages = await textChannel.messages.fetch({ limit: 50 });
    const welcomeMessages = messages.filter(msg => 
      msg.author.bot && 
      msg.components && 
      msg.components.some(row => 
        row.components.some(component => 
          component.customId && (
            component.customId.startsWith('vc_') || 
            component.customId.includes(channelId)
          )
        )
      )
    );
    
    if (welcomeMessages.size > 0) {
      console.log(`[CLEANUP_WELCOME] Suppression de ${welcomeMessages.size} message(s) de bienvenue dans ${textChannel.name}`);
      await Promise.all(
        welcomeMessages.map(msg => msg.delete().catch(() => null))
      );
    }
    
  } catch (error) {
    console.error(`[CLEANUP_WELCOME] Erreur lors du nettoyage des messages de bienvenue:`, error);
  }
}

async function deleteEmptyChannel(channelId, guildId) {
  try {
    console.log(`[DELETE] 🔍 Tentative de suppression du salon ${channelId}`);
    
    const channel = await getChannelById(channelId, guildId);
    if (!channel) {
      console.log(`[DELETE] ❌ Salon ${channelId} n'existe plus`);
      return true;
    }
    
    if (channel.members.size > 0) {
      console.log(`[DELETE] ⏭️ Salon ${channelId} a encore ${channel.members.size} membres`);
      return false;
    }
    
    // 🧹 NETTOYAGE DES MESSAGES DE BIENVENUE avant suppression
    await cleanupWelcomeMessages(channelId, guildId);
    
    // Suppression avec timeout pour éviter les blocages
    await Promise.race([
      channel.delete(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delete timeout')), CHANNEL_DELETE_TIMEOUT) // Utilise la constante optimisée
      )
    ]);
    
    console.log(`[DELETE] ✅ Salon ${channelId} supprimé avec succès !`);
    
    // Nettoyer Redis
    const keys = [
      `creator:${channelId}`,
      `locked:${channelId}`,
      `hidden:${channelId}`,
      `limit:${channelId}`,
      `soundboard:${channelId}`,
      `status:${channelId}`,
      `mute_state:${channelId}`,
      `permitted_roles:${channelId}`,
      `rejected_roles:${channelId}`,
      `hidden_lock_state:${channelId}`,
      `task_timer:${channelId}`,
      `task_ready:${channelId}`,
      `temp_channel_active:${channelId}`,
      `protected:${channelId}`,
      `denied_users:${channelId}`
    ];
    
    keys.forEach(key => {
      safeDel(key).catch(() => {});
    });
    
    return true;
  } catch (error) {
    console.error(`[DELETE] ❌ Erreur suppression salon ${channelId}:`, error.message);
    return false;
  }
}

// ✅ Fonction cleanupChannelCaches supprimée - caches inutiles

// ✅ Fonction processDeletionQueue supprimée - plus utilisée

// 🚀 PRÉ-CONSTRUCTION AU DÉMARRAGE - Composants statiques créés une seule fois
function prebuildWelcomeComponentsOnStartup() {
  if (!PREBUILD_ON_STARTUP) return;
  
  try {
    // Créer tous les composants statiques qui ne changent jamais
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
      status: '<:web:1393693400800165939>'
    };

    // Boutons statiques (sans ID de salon)
    const staticRow1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('PLACEHOLDER_LOCK').setEmoji(BUTTON_ICONS.lock).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_UNLOCK').setEmoji(BUTTON_ICONS.unlock).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_HIDE').setEmoji(BUTTON_ICONS.hide).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_UNHIDE').setEmoji(BUTTON_ICONS.unhide).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_TRANSFER').setEmoji(BUTTON_ICONS.transfer).setStyle(ButtonStyle.Secondary)
    );
    
    const staticRow2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('PLACEHOLDER_RENAME').setEmoji(BUTTON_ICONS.rename).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_MUTE').setEmoji(BUTTON_ICONS.mute).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_UNMUTE').setEmoji(BUTTON_ICONS.unmute).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_SETTINGS').setEmoji(BUTTON_ICONS.settings).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('PLACEHOLDER_STATUS').setEmoji(BUTTON_ICONS.status).setStyle(ButtonStyle.Secondary)
    );

    // Menu de sélection statique
    const staticRow5 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('PLACEHOLDER_FEATURES')
        .setPlaceholder(`⮕ More Features`)
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

    // Galerie média statique
    const staticMediaGallery = new MediaGalleryBuilder()
      .addItems(
        mediaGalleryItem => mediaGalleryItem
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1413842170431143956/telechargement_1.gif?ex=68bd66a1&is=68bc1521&hm=3d81872c4cf9e61ad2d175615babb04343a8a17e233ee953f67d2d5cfe580cc8')
      );

    // Section de contrôle statique
    const staticControlSection = new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### <:ingenierie:1413960155044778165> **Quick Actions**
> **• Use the buttons below to manage your channel**
> **• All features are available instantly**
> **• No setup required - just click and go!**`)
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
          .setDescription('Channel Management Tools')
          .setURL('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2xodTd3YXJicHc1ZjZrbGZub3piZnBvN2x1MDB0YzF5OXoxYWZxeiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PRJ5uWuZ8tX6KGpJS2/giphy.gif')
      );

    // Texte de support statique
    const staticSupportText = new TextDisplayBuilder().setContent(`### <:soutientechnique:1413960321625755739> **Server Support**
> **Need help? Join our support server: [Support Server](https://discord.gg/wyWGcKWssQ)**
> **Dashboard is open! Modify settings: [bald wird es verfügbar sein](https://discord.gg/wyWGcKWssQ)**`);

    // Séparateur statique
    const staticSeparator = new SeparatorBuilder().setDivider(true);

    // Stocker les composants statiques
    startupPrebuiltComponents.set('staticRow1', staticRow1);
    startupPrebuiltComponents.set('staticRow2', staticRow2);
    startupPrebuiltComponents.set('staticRow5', staticRow5);
    startupPrebuiltComponents.set('staticMediaGallery', staticMediaGallery);
    startupPrebuiltComponents.set('staticControlSection', staticControlSection);
    startupPrebuiltComponents.set('staticSupportText', staticSupportText);
    startupPrebuiltComponents.set('staticSeparator', staticSeparator);
    
    console.log('[PREBUILD] ✅ Composants de bienvenue pré-construits au démarrage');
  } catch (error) {
    console.error('[PREBUILD] Erreur lors de la pré-construction:', error);
  }
}

// ⚡ TECHNIQUE 1: Création parallèle des composants (EXACTEMENT comme le message de bienvenue actuel)
async function createWelcomeComponentsParallel(member, tempChannel) {
  if (PREBUILT_COMPONENTS && prebuiltComponents.has('welcome')) {
    return prebuiltComponents.get('welcome');
  }

  // 🚀 ULTRA-RAPIDE : Utiliser les composants pré-construits au démarrage
  if (PREBUILD_ON_STARTUP && startupPrebuiltComponents.size > 0) {
    // Seulement créer les parties qui changent (très rapide !)
    const panelContent = [
      `# <:cropped_circle_image:1414200758877950054> Welcome <@${member.id}>`,
      `> **•  Willkommen bei skz_rayan23.**
> **•  Get early access to new features.**
> **•  Participate in beta testing.**`
    ].join('\n');

    const textComponent = new TextDisplayBuilder().setContent(panelContent);

    // Récupérer les composants pré-construits
    const staticRow1 = startupPrebuiltComponents.get('staticRow1');
    const staticRow2 = startupPrebuiltComponents.get('staticRow2');
    const staticRow5 = startupPrebuiltComponents.get('staticRow5');
    const staticMediaGallery = startupPrebuiltComponents.get('staticMediaGallery');
    const staticControlSection = startupPrebuiltComponents.get('staticControlSection');
    const staticSupportText = startupPrebuiltComponents.get('staticSupportText');
    const staticSeparator = startupPrebuiltComponents.get('staticSeparator');

    // 🚀 ULTRA-RAPIDE : Cloner et personnaliser les boutons avec l'ID du salon
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();
    const row5 = new ActionRowBuilder();

    // Cloner les boutons avec les vrais IDs
    staticRow1.components.forEach(button => {
      if (button.data && button.data.custom_id) {
        const newButton = new ButtonBuilder()
          .setCustomId(`vc_${button.data.custom_id.toLowerCase().replace('placeholder_', '')}_${tempChannel.id}`)
          .setEmoji(button.data.emoji)
          .setStyle(button.data.style);
        row1.addComponents(newButton);
      }
    });

    staticRow2.components.forEach(button => {
      if (button.data && button.data.custom_id) {
        const newButton = new ButtonBuilder()
          .setCustomId(`vc_${button.data.custom_id.toLowerCase().replace('placeholder_', '')}_${tempChannel.id}`)
          .setEmoji(button.data.emoji)
          .setStyle(button.data.style);
        row2.addComponents(newButton);
      }
    });
    
    // ✅ BOUTONS ROUGES SUPPRIMÉS : Les boutons trash et deny ont été retirés du message de bienvenue

    // Cloner le menu de sélection
    const selectMenu = staticRow5.components[0];
    const newSelectMenu = new StringSelectMenuBuilder()
      .setCustomId(`vc_features_${tempChannel.id}`)
      .setPlaceholder(selectMenu.data?.placeholder || `⮕ More Features`)
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
      );
    row5.addComponents(newSelectMenu);

    // Créer les attachments (seulement ceux qui changent)
    const voiceThumbnailFile = new AttachmentBuilder(member.user.displayAvatarURL({ extension: 'png', size: 512 }))
      .setName('creator_avatar.png');

    const controlThumbnailFile = new AttachmentBuilder('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2xodTd3YXJicHc1ZjZrbGZub3piZnBvN2x1MDB0YzF5OXoxYWZxeiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PRJ5uWuZ8tX6KGpJS2/giphy.gif')
      .setName('admin_thumb.gif');

    // Section principale avec thumbnail du créateur
    const mainSection = new SectionBuilder()
      .addTextDisplayComponents(textComponent)
      .setThumbnailAccessory(
        thumbnail => thumbnail
          .setDescription(`Createur du salon: ${member.displayName} (${member.user.username})`)
          .setURL('attachment://creator_avatar.png')
      );

    // Container principal
    const mainContainer = new ContainerBuilder()
      .addSectionComponents(mainSection)
      .addSeparatorComponents(staticSeparator)
      .addMediaGalleryComponents(staticMediaGallery)
      .addSeparatorComponents(staticSeparator)
      .addSectionComponents(staticControlSection)
      .addTextDisplayComponents(staticSupportText)
      .addSeparatorComponents(staticSeparator)
      .addActionRowComponents(row5, row1, row2);

    const components = { voiceThumbnailFile, controlThumbnailFile, mainContainer };
    
    if (PREBUILT_COMPONENTS) {
      prebuiltComponents.set('welcome', components);
    }
    
    return components;
  }

  // Fallback vers l'ancien système si la pré-construction n'est pas disponible
  // === DISCORD COMPONENTS V2 WELCOME MESSAGE (EXACTEMENT comme l'original) ===
  const panelContent = [
    `# <:cropped_circle_image:1414200758877950054> Welcome <@${member.id}>`,
    `> **•  Willkommen bei skz_rayan23.**
> **•  Get early access to new features.**
> **•  Participate in beta testing.**`
  ].join('\n');

  // Créer les composants TextDisplay pour Discord Components V2
  const textComponent = new TextDisplayBuilder().setContent(panelContent);

  // Thumbnails pour le message de bienvenue avec SectionBuilder
  const welcomeThumbnail = new ThumbnailBuilder()
    .setURL('https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/voice_thumb.png')
    .setDescription('Voice Management System');

  const controlThumbnail = new ThumbnailBuilder()
    .setURL('https://cdn.discordapp.com/attachments/1384655500183998587/1412132681705066526/admin_thumb.png')
    .setDescription('Control Panel');

  // Boutons de contrôle avec les icônes existantes
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
    status: '<:web:1393693400800165939>'
  };

  // Création parallèle de tous les composants
  const [voiceThumbnailFile, controlThumbnailFile, row1, row2, row5, mediaGallery, mainSection, controlSection, supportText, separator, mainContainer] = await Promise.all([
    // Créer les attachments pour les thumbnails - Photo de profil du créateur
    new AttachmentBuilder(member.user.displayAvatarURL({ extension: 'png', size: 512 }))
      .setName('creator_avatar.png'),
    new AttachmentBuilder('https://cdn.discordapp.com/attachments/1406646913201209374/1414178170378125383/telechargement_2.gif?ex=68be9f8d&is=68bd4e0d&hm=f4af72ebce1e2767dae8d0347513ce117d7b9e066dfa897a6cbd1cafe3668025')
      .setName('admin_thumb.gif'),
    
    // Première rangée de boutons
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_lock_${tempChannel.id}`).setEmoji(BUTTON_ICONS.lock).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unlock_${tempChannel.id}`).setEmoji(BUTTON_ICONS.unlock).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_hide_${tempChannel.id}`).setEmoji(BUTTON_ICONS.hide).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unhide_${tempChannel.id}`).setEmoji(BUTTON_ICONS.unhide).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_transfer_${tempChannel.id}`).setEmoji(BUTTON_ICONS.transfer).setStyle(ButtonStyle.Secondary)
    ),
    
    // Deuxième rangée de boutons
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vc_rename_${tempChannel.id}`).setEmoji(BUTTON_ICONS.rename).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_mute_${tempChannel.id}`).setEmoji(BUTTON_ICONS.mute).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_unmute_${tempChannel.id}`).setEmoji(BUTTON_ICONS.unmute).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_settings_${tempChannel.id}`).setEmoji(BUTTON_ICONS.settings).setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`vc_status_${tempChannel.id}`).setEmoji(BUTTON_ICONS.status).setStyle(ButtonStyle.Secondary)
    ),

    // Menu de sélection pour les fonctionnalités
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`vc_features_${tempChannel.id}`)
        .setPlaceholder(`⮕ More Features`)
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
    ),

    // Galerie média avec l'image de bienvenue
    new MediaGalleryBuilder()
      .addItems(
        mediaGalleryItem => mediaGalleryItem
          .setURL('https://cdn.discordapp.com/attachments/1406646913201209374/1413842170431143956/telechargement_1.gif?ex=68bd66a1&is=68bc1521&hm=3d81872c4cf9e61ad2d175615babb04343a8a17e233ee953f67d2d5cfe580cc8')
      ),

    // Section principale avec thumbnail du créateur
    new SectionBuilder()
      .addTextDisplayComponents(textComponent)  // Contenu textuel principal
      .setThumbnailAccessory(
        thumbnail => thumbnail
          .setDescription(`Createur du salon: ${member.displayName} (${member.user.username})`)
          .setURL('attachment://creator_avatar.png')
      ),

    // Section des contrôles avec thumbnail
    new SectionBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### <:ingenierie:1413960155044778165>  **Quick Actions**
> **• Use the buttons below to manage your channel**
> **• All features are available instantly**
> **• No setup required - just click and go!**`)
      )
      .setThumbnailAccessory(
        thumbnail => thumbnail
          .setDescription('Channel Management Tools')
          .setURL('attachment://admin_thumb.gif')
      ),

    // Texte de support serveur avec liens
    new TextDisplayBuilder().setContent(`### <:soutientechnique:1413960321625755739>  **Server Support**
> **Need help? Join our support server : [Support Server](https://discord.gg/wyWGcKWssQ)**
> **Dashboard is open! Modify settings : [bald wird es verfügbar sein](https://discord.gg/wyWGcKWssQ)**`),

    // Séparateur pour organiser le container
    new SeparatorBuilder().setDivider(true),

    // Container principal qui englobe TOUT le contenu
    new ContainerBuilder()
  ]);

  // Assembler le container final
  mainContainer
    .addSectionComponents(mainSection)                         // Section principale avec thumbnail du créateur
    .addSeparatorComponents(separator)                         // Séparateur visuel
    .addMediaGalleryComponents(mediaGallery)                   // Galerie média (GIF d'animation)
    .addSeparatorComponents(separator)                         // Séparateur visuel
    .addSectionComponents(controlSection)                      // Section des contrôles avec thumbnail
    .addTextDisplayComponents(supportText)                     // Texte de support serveur
    .addSeparatorComponents(separator)                         // Séparateur visuel
    .addActionRowComponents(row5, row1, row2);     // Tous les boutons de contrôle

  const components = { voiceThumbnailFile, controlThumbnailFile, mainContainer };
  
  if (PREBUILT_COMPONENTS) {
    prebuiltComponents.set('welcome', components);
  }
  
  return components;
}

// ⚡ TECHNIQUE 2: Envoi instantané sans await
function sendWelcomeMessageInstant(channel, components) {
  if (INSTANT_SEND) {
    // Envoi immédiat sans attendre la réponse
    channel.send({
      flags: MessageFlags.IsComponentsV2,
      components: [components.mainContainer],
      files: [components.voiceThumbnailFile, components.controlThumbnailFile]
    }).catch(err => {
      console.error('[WELCOME] Instant send failed:', err.message);
    });
    
    return Promise.resolve(true); // Retour immédiat
  }

  // Fallback: envoi normal avec await
  return channel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [components.mainContainer],
    files: [components.voiceThumbnailFile, components.controlThumbnailFile]
  });
}

// ⚡ TECHNIQUE 3: Cache intelligent des messages
function getCachedWelcomeMessage(channelId) {
  if (!WELCOME_CACHE) return null;
  
  const cached = welcomeMessageCache.get(channelId);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
    return cached.components;
  }
  
  return null;
}

function cacheWelcomeMessage(channelId, components) {
  if (!WELCOME_CACHE) return;
  
  welcomeMessageCache.set(channelId, {
    components,
    timestamp: Date.now()
  });
}

// ⚡ FONCTION DE FALLBACK (ancien système)
async function createWelcomeComponentsLegacy() {
  // Retourner les composants de l'ancien système si nécessaire
  return {
    voiceThumbnailFile: new AttachmentBuilder()
      .setName('voice_thumb.gif')
      .setFile('./assets/voice_thumb.gif'),
    controlThumbnailFile: new AttachmentBuilder()
      .setName('admin_thumb.gif')
      .setFile('./assets/admin_thumb.gif'),
    mainContainer: new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('# 🎤 Voice Channel Control Panel')
      )
  };
}

// 🚀 Pool de connexions Redis ULTRA-PERFORMANCE MAXIMALE pour dizaines de milliers d'utilisateurs
const redisPool = {
  connections: new Set(),
  maxConnections: 500, // 500 connexions (pour dizaines de milliers d'utilisateurs)
  ultraFastMode: true, // Mode ultra-rapide
  preloadedConnections: new Set(),
  connectionQueue: [],
  maxQueueSize: 1000, // Queue massive pour la masse
  
  async getConnection() {
    try {
      if (!redisEnabled) {
        return null; // Retourner null si Redis n'est pas disponible
      }
      
      // Mode ultra-rapide : utiliser les connexions préchargées
      if (this.preloadedConnections.size > 0) {
        const connection = this.preloadedConnections.values().next().value;
        this.preloadedConnections.delete(connection);
        return connection;
      }
      
      if (this.connections.size < this.maxConnections) {
        const connection = require('../redisClient').redis.duplicate();
        this.connections.add(connection);
        return connection;
      }
      
      // Si pas de connexion disponible, utiliser la connexion principale
      return require('../redisClient').redis;
    } catch (error) {
      console.error('[REDIS_POOL] Error getting connection:', error);
      return null; // Retourner null en cas d'erreur
    }
  },
  
  // 🚀 Préchargement automatique des connexions ULTRA-PERFORMANCE MAXIMALE
  async preloadConnections() {
    if (!redisEnabled || this.preloadedConnections.size >= 200) return; // Encore plus de connexions préchargées
    
    try {
      // Précharger massivement pour la masse
      for (let i = 0; i < 50; i++) {
        const connection = require('../redisClient').redis.duplicate();
        this.preloadedConnections.add(connection);
      }
      // ✅ Connexions Redis préchargées avec succès
    } catch (error) {
      console.error('[REDIS_POOL] Préchargement échoué:', error.message);
    }
  },
  
  // Nettoyage des connexions mortes
  cleanup() {
    this.connections.forEach(conn => {
      try {
        if (conn.status === 'end') {
          this.connections.delete(conn);
        }
      } catch (error) {
        this.connections.delete(conn);
      }
    });
    
    // Nettoyer aussi les connexions préchargées
    this.preloadedConnections.forEach(conn => {
      try {
        if (conn.status === 'end') {
          this.preloadedConnections.delete(conn);
        }
      } catch (error) {
        this.preloadedConnections.delete(conn);
      }
    });
  }
};

// 🚀 Démarrer le préchargement automatique ULTRA-PERFORMANCE MAXIMALE
setTimeout(() => {
  redisPool.preloadConnections();
  setInterval(() => redisPool.preloadConnections(), 500); // Toutes les 0.5 seconde (ultra-fréquent)
}, 500); // Démarrer encore plus tôt

// ✅ Ancien système périodique supprimé - conflit avec le nouveau

// 🚀 Queue de microtasks ULTRA-PERFORMANCE MAXIMALE pour dizaines de milliers d'utilisateurs
const microtaskQueue = [];
const highPriorityQueue = [];
const emergencyQueue = []; // Queue d'urgence pour les opérations critiques
let isProcessingQueue = false;
let isProcessingHighPriority = false;
let isProcessingEmergency = false;
let queueErrorCount = 0;
const MAX_QUEUE_ERRORS = 100; // Tolérance d'erreurs maximale
const ULTRA_FAST_QUEUE_SIZE = 5000; // Queue massive pour la masse
const HIGH_PRIORITY_LIMIT = 500; // Beaucoup plus de tâches haute priorité
const EMERGENCY_LIMIT = 200; // Beaucoup plus de tâches d'urgence

function addToMicrotaskQueue(task, priority = 'normal') {
  try {
    if (priority === 'emergency' && emergencyQueue.length < EMERGENCY_LIMIT) {
      emergencyQueue.push(task);
      if (!isProcessingEmergency) {
        isProcessingEmergency = true;
        queueMicrotask(processEmergencyQueue);
      }
    } else if (priority === 'high' && highPriorityQueue.length < HIGH_PRIORITY_LIMIT) {
      highPriorityQueue.push(task);
      if (!isProcessingHighPriority) {
        isProcessingHighPriority = true;
        queueMicrotask(processHighPriorityQueue);
      }
    } else if (microtaskQueue.length < ULTRA_FAST_QUEUE_SIZE) {
      microtaskQueue.push(task);
      if (!isProcessingQueue) {
        isProcessingQueue = true;
        queueMicrotask(processMicrotaskQueue);
      }
    } else {
      console.warn('[MICROTASK] Queue pleine, tâche ignorée');
    }
  } catch (error) {
    console.error('[MICROTASK] Error adding task to queue:', error);
  }
}

// Fonction pour ajouter des tâches haute priorité
function addHighPriorityTask(task) {
  addToMicrotaskQueue(task, 'high');
}

function addEmergencyTask(task) {
  addToMicrotaskQueue(task, 'emergency');
}

async function processMicrotaskQueue() {
  isProcessingQueue = false;
  const tasks = microtaskQueue.splice(0, BATCH_CREATION_SIZE);
  
  try {
    await Promise.allSettled(tasks.map(task => {
      try {
        return task();
      } catch (error) {
        console.error('[MICROTASK] Error executing task:', error);
        return Promise.resolve();
      }
    }));
    queueErrorCount = 0;
  } catch (error) {
    console.error('[MICROTASK] Critical queue error:', error);
    queueErrorCount++;
    
    if (queueErrorCount > MAX_QUEUE_ERRORS) {
      console.error('[MICROTASK] Too many errors, clearing queue');
      microtaskQueue.length = 0;
      queueErrorCount = 0;
    }
  }
}

async function processHighPriorityQueue() {
  isProcessingHighPriority = false;
  const tasks = highPriorityQueue.splice(0, 25);
  
  try {
    await Promise.allSettled(tasks.map(task => {
      try {
        return task();
      } catch (error) {
        console.error('[MICROTASK_HIGH] Error executing high priority task:', error);
        return Promise.resolve();
      }
    }));
  } catch (error) {
    console.error('[MICROTASK_HIGH] Critical high priority queue error:', error);
  }
}

async function processEmergencyQueue() {
  isProcessingEmergency = false;
  const tasks = emergencyQueue.splice(0, 10);
  
  try {
    await Promise.allSettled(tasks.map(task => {
      try {
        return task();
      } catch (error) {
        console.error('[MICROTASK_EMERGENCY] Error executing emergency task:', error);
        return Promise.resolve();
      }
    }));
  } catch (error) {
    console.error('[MICROTASK_EMERGENCY] Critical emergency queue error:', error);
  }
}

// Circuit Breaker pour éviter les surcharges
function checkCircuitBreaker(guildId) {
  if (!CIRCUIT_BREAKER) return true;
  
  const breaker = circuitBreaker.get(guildId);
  if (!breaker) return true;
  
  const now = Date.now();
  
  if (breaker.state === 'OPEN') {
    if (now - breaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
      breaker.state = 'HALF_OPEN';
      console.log(`[CIRCUIT_BREAKER] ${guildId} - Circuit breaker half-open`);
      return true;
    }
    return false;
  }
  
  return true;
}

function recordCircuitBreakerFailure(guildId) {
  if (!CIRCUIT_BREAKER) return;
  
  let breaker = circuitBreaker.get(guildId);
  if (!breaker) {
    breaker = { failures: 0, state: 'CLOSED', lastFailureTime: 0 };
    circuitBreaker.set(guildId, breaker);
  }
  
  breaker.failures++;
  breaker.lastFailureTime = Date.now();
  
  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.state = 'OPEN';
    console.log(`[CIRCUIT_BREAKER] ${guildId} - Circuit breaker OPEN (${breaker.failures} failures)`);
  }
}

function recordCircuitBreakerSuccess(guildId) {
  if (!CIRCUIT_BREAKER) return;
  
  const breaker = circuitBreaker.get(guildId);
  if (breaker) {
    breaker.failures = 0;
    breaker.state = 'CLOSED';
    console.log(`[CIRCUIT_BREAKER] ${guildId} - Circuit breaker CLOSED (success)`);
  }
}

// Health Check System
function updateHealthMetrics(guildId, success) {
  if (!HEALTH_CHECK) return;
  
  let metrics = healthMetrics.get(guildId);
  if (!metrics) {
    metrics = { total: 0, successful: 0, lastCheck: Date.now() };
    healthMetrics.set(guildId, metrics);
  }
  
  metrics.total++;
  if (success) metrics.successful++;
  
  // Reset metrics every hour
  if (Date.now() - metrics.lastCheck > 3600000) {
    metrics.total = 0;
    metrics.successful = 0;
    metrics.lastCheck = Date.now();
  }
}

function getHealthStatus(guildId) {
  if (!HEALTH_CHECK) return 1.0;
  
  const metrics = healthMetrics.get(guildId);
  if (!metrics || metrics.total === 0) return 1.0;
  
  return metrics.successful / metrics.total;
}

// Load Balancing System
function updateLoadBalancer(guildId, load) {
  if (!LOAD_BALANCING) return;
  
  let balancer = loadBalancer.get(guildId);
  if (!balancer) {
    balancer = { currentLoad: 0, maxLoad: 0, lastUpdate: Date.now() };
    loadBalancer.set(guildId, balancer);
  }
  
  balancer.currentLoad = load;
  balancer.maxLoad = Math.max(balancer.maxLoad, load);
  balancer.lastUpdate = Date.now();
}

function canHandleLoad(guildId) {
  if (!LOAD_BALANCING) return true;
  
  const balancer = loadBalancer.get(guildId);
  if (!balancer) return true;
  
  return balancer.currentLoad < LOAD_BALANCE_THRESHOLD;
}

// Channel Monitoring System
function registerChannelForMonitoring(channelId, guildId, creatorId) {
  if (!CHANNEL_MONITORING) return;
  
  const monitorData = {
    channelId,
    guildId,
    creatorId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    memberCount: 0,
    isActive: true,
    cleanupScheduled: false
  };
  
  channelMonitor.set(channelId, monitorData);
  // ✅ Salon enregistré pour monitoring
}

function updateChannelActivity(channelId, memberCount) {
  if (!CHANNEL_MONITORING) return;
  
  const monitorData = channelMonitor.get(channelId);
  if (monitorData) {
    monitorData.lastActivity = Date.now();
    monitorData.memberCount = memberCount;
    monitorData.isActive = memberCount > 0;
    
    // Si le salon devient vide, programmer le nettoyage
    if (memberCount === 0 && !monitorData.cleanupScheduled) {
      monitorData.cleanupScheduled = true;
      scheduleChannelCleanup(channelId, monitorData.guildId);
    }
  }
}

function scheduleChannelCleanup(channelId, guildId) {
  if (!ULTRA_CLEANUP) return;
  
  setTimeout(async () => {
    try {
      const monitorData = channelMonitor.get(channelId);
      if (!monitorData) return;
      
      // Vérifier si le salon est toujours vide
      if (monitorData.memberCount === 0) {
        // ✅ Nettoyage programmé pour salon vide
        
        // Ajouter à la queue de nettoyage
        if (!cleanupQueue.has(guildId)) {
          cleanupQueue.set(guildId, []);
        }
        
        cleanupQueue.get(guildId).push({
          channelId,
          timestamp: Date.now(),
          reason: 'empty_channel'
        });
        
        // Marquer comme orphelin si nécessaire
        if (ORPHAN_DETECTION) {
          orphanChannels.set(channelId, {
            guildId,
            detectedAt: Date.now(),
            reason: 'empty_timeout'
          });
        }
      }
    } catch (error) {
      console.error(`[ULTRA_CLEANUP] Error scheduling cleanup for channel ${channelId}:`, error);
    }
  }, CHANNEL_EMPTY_TIMEOUT);
}

// Orphan Detection System
function detectOrphanChannels(guild) {
  if (!ORPHAN_DETECTION || !guild) return;
  
  try {
    const voiceChannels = guild.channels.cache.filter(channel => 
      channel.type === 2 && // Voice channel
      channel.name.includes("'s Room") && // Temp channel pattern
      channel.members.size === 0 // Empty channel
    );
    
    voiceChannels.forEach(channel => {
      const channelId = channel.id;
      const existingOrphan = orphanChannels.get(channelId);
      
      if (!existingOrphan) {
        // Vérifier si c'est un salon créé par le bot
        safeGet(`creator:${channelId}`).then(creatorId => {
          if (creatorId) {
            orphanChannels.set(channelId, {
              guildId: guild.id,
              detectedAt: Date.now(),
              reason: 'orphan_detection',
              creatorId
            });
            
            console.log(`[ORPHAN_DETECTION] Detected orphan channel ${channelId} in guild ${guild.id}`);
            
            // Programmer le nettoyage
            setTimeout(() => {
              performOrphanCleanup(channelId, guild.id);
            }, ORPHAN_CLEANUP_DELAY);
          }
        }).catch(error => {
          console.error(`[ORPHAN_DETECTION] Error checking creator for channel ${channelId}:`, error);
        });
      }
    });
  } catch (error) {
    console.error(`[ORPHAN_DETECTION] Error detecting orphan channels in guild ${guild.id}:`, error);
  }
}

async function performOrphanCleanup(channelId, guildId) {
  try {
    const channel = await getChannelById(channelId, guildId);
    if (!channel) {
      console.log(`[ORPHAN_CLEANUP] Channel ${channelId} not found, removing from monitoring`);
      channelMonitor.delete(channelId);
      orphanChannels.delete(channelId);
      return;
    }
    
    // Vérifier une dernière fois si le salon est vide
    if (channel.members.size === 0) {
      // 🚨 PROTECTION SUPPLÉMENTAIRE : Re-vérifier avant suppression
      const freshChannel = await getChannelById(channelId, guildId);
      if (freshChannel && freshChannel.members.size > 0) {
        console.log(`[ORPHAN_CLEANUP] 🚨 PROTECTION : Salon ${channelId} a ${freshChannel.members.size} membres, suppression annulée`);
        orphanChannels.delete(channelId);
        return;
      }
      
      console.log(`[ORPHAN_CLEANUP] Cleaning up orphan channel ${channelId}`);
      // ✅ cleanChannel supprimé - conflit avec le nouveau système
      
      // Nettoyer les données de monitoring
      channelMonitor.delete(channelId);
      orphanChannels.delete(channelId);
    } else {
      console.log(`[ORPHAN_CLEANUP] Channel ${channelId} is no longer empty, skipping cleanup`);
      orphanChannels.delete(channelId);
    }
  } catch (error) {
    console.error(`[ORPHAN_CLEANUP] Error cleaning up orphan channel ${channelId}:`, error);
  }
}

async function getChannelById(channelId, guildId) {
  try {
    // 🔧 CORRECTION : Utiliser le client directement avec fallback
    let client;
    try {
      const botModule = require('../bot');
      client = botModule?.client;
    } catch (requireError) {
      // Si require échoue, essayer d'accéder au client global
      client = global.client || global.botClient;
    }
    
    if (!client || !client.guilds) {
      // Ne pas logger constamment pour les cas normaux
      return null;
    }

    // Essayer de récupérer le guild depuis le cache d'abord
    let guild = client.guilds.cache.get(guildId);
    if (!guild) {
      try {
        // Essayer de fetch le guild s'il n'est pas en cache
        guild = await client.guilds.fetch(guildId);
      } catch (guildError) {
        console.log(`[GET_CHANNEL] Guild not found: ${guildId}`, guildError.message);
        return null;
      }
    }

    if (!guild) {
      console.log(`[GET_CHANNEL] Guild still not available: ${guildId}`);
      return null;
    }

    // Essayer de récupérer le channel depuis le cache d'abord
    let channel = guild.channels.cache.get(channelId);
    if (!channel) {
      try {
        // Essayer de fetch le channel s'il n'est pas en cache
        channel = await guild.channels.fetch(channelId);
      } catch (channelError) {
        // Le channel n'existe probablement plus
        console.log(`[GET_CHANNEL] Channel not found: ${channelId} (probably deleted)`);
        return null;
      }
    }

    return channel;
  } catch (error) {
    console.log(`[GET_CHANNEL] Error getting channel ${channelId}:`, error.message);
    return null;
  }
}

// Preventive Maintenance System
function schedulePreventiveMaintenance(guildId) {
  if (!PREVENTIVE_MAINTENANCE) return;
  
  const lastMaintenance = maintenanceSchedule.get(guildId);
  const now = Date.now();
  
  if (!lastMaintenance || (now - lastMaintenance) > CHANNEL_MAINTENANCE_INTERVAL) {
    console.log(`[PREVENTIVE_MAINTENANCE] Starting maintenance for guild ${guildId}`);
    
    // Détecter les salons orphelins
    const botModule = require('../bot');
    if (botModule && botModule.client && botModule.client.guilds) {
      detectOrphanChannels(botModule.client.guilds.cache.get(guildId));
    }
    
    // Nettoyer les données de monitoring obsolètes
    cleanupMonitoringData(guildId);
    
    // Mettre à jour le planning
    maintenanceSchedule.set(guildId, now);
  }
}

function cleanupMonitoringData(guildId) {
  const now = Date.now();
  
  // Nettoyer les données de monitoring obsolètes
  channelMonitor.forEach((data, channelId) => {
    if (data.guildId === guildId && (now - data.lastActivity) > CHANNEL_MONITOR_TTL) {
      channelMonitor.delete(channelId);
    }
  });
  
  // Nettoyer les orphelins anciens
  orphanChannels.forEach((data, channelId) => {
    if (data.guildId === guildId && (now - data.detectedAt) > ORPHAN_DETECTION_TTL) {
      orphanChannels.delete(channelId);
    }
  });
}

// Auto Healing System
function performAutoHealing(guildId) {
  if (!AUTO_HEALING) return;
  
  try {
    const healthStatus = getHealthStatus(guildId);
    
    if (healthStatus < HEALTH_THRESHOLD) {
      console.log(`[AUTO_HEALING] Guild ${guildId} health: ${(healthStatus * 100).toFixed(1)}% - Performing healing`);
      
      // Réinitialiser le circuit breaker
      const breaker = circuitBreaker.get(guildId);
      if (breaker && breaker.state === 'OPEN') {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
        console.log(`[AUTO_HEALING] Reset circuit breaker for guild ${guildId}`);
      }
      
      // Nettoyer les queues bloquées
      const queue = creationQueue.get(guildId);
      if (queue && queue.length > 0) {
        const now = Date.now();
        const filteredQueue = queue.filter(item => (now - item.timestamp) < 300000); // 5 minutes
        creationQueue.set(guildId, filteredQueue);
        console.log(`[AUTO_HEALING] Cleaned blocked queue for guild ${guildId}`);
      }
      
      // Réinitialiser les métriques de santé
      const metrics = healthMetrics.get(guildId);
      if (metrics) {
        metrics.total = 0;
        metrics.successful = 0;
        metrics.lastCheck = Date.now();
        console.log(`[AUTO_HEALING] Reset health metrics for guild ${guildId}`);
      }
    }
  } catch (error) {
    console.error(`[AUTO_HEALING] Error performing auto healing for guild ${guildId}:`, error);
  }
}

// Rate limiting atomique ultra-robuste
async function atomicRateLimit(userId, action, maxAttempts) {
  if (!userId || !action || !maxAttempts) {
    console.error('[RATE_LIMIT] Invalid parameters:', { userId, action, maxAttempts });
    return true; // Permettre en cas de paramètres invalides
  }
  
  const key = `rate_limit:${userId}:${action}`;
  const window = 60000; // 1 minute
  
  try {
    const connection = await redisPool.getConnection();
    if (!connection) {
      // Fallback vers cache local
      const cacheKey = `${userId}:${action}`;
      const cached = rateLimitCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < RATE_LIMIT_CACHE_TTL) {
        return cached.attempts < maxAttempts;
      }
      return true;
    }
    
    const result = await Promise.race([
      connection.multi()
        .incr(key)
        .expire(key, window)
        .exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Rate limit timeout')), 500)
      )
    ]);
    
    const attempts = result[0];
    
    // ✅ Rate limit check effectué
    
    return attempts <= maxAttempts;
  } catch (error) {
    console.error(`[RATE_LIMIT] Redis error for user ${userId}:`, error);
    
    // Fallback vers cache local
    try {
      const cacheKey = `${userId}:${action}`;
      const cached = rateLimitCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < RATE_LIMIT_CACHE_TTL) {
        return cached.attempts < maxAttempts;
      }
    } catch (cacheError) {
      console.error('[RATE_LIMIT] Cache fallback error:', cacheError);
    }
    
    return true;
  }
}

// Vérification et nettoyage des salons temporaires vides (si utilisateur sort rapidement)
// ✅ Fonction checkAndCleanEmptyTempChannels supprimée - conflit avec le nouveau système

// Rate limiting pour suppressions de salon (2-3 req/sec recommandé par API Discord)
function checkDeleteRateLimit(guildId) {
  const now = Date.now();
  const window = 1000; // 1 seconde
  
  if (!deleteRateLimiter.has(guildId)) {
    deleteRateLimiter.set(guildId, []);
  }
  
  const guildDeletes = deleteRateLimiter.get(guildId);
  
  // Nettoyer les anciennes entrées
  const validDeletes = guildDeletes.filter(timestamp => now - timestamp < window);
  
  // Vérifier si on peut supprimer (max 2 par seconde)
  if (validDeletes.length >= MAX_DELETE_RATE) {
    return false; // Rate limit atteint
  }
  
  // Ajouter la suppression actuelle
  validDeletes.push(now);
  deleteRateLimiter.set(guildId, validDeletes);
  
  return true; // Suppression autorisée
}

// Cleanup ultra-robuste avec retry et validation
async function cleanChannel_DISABLED(channel, guildId) {
  if (!channel || !guildId) {
    console.error('[CLEANUP] Invalid parameters:', { channel: !!channel, guildId });
    return;
  }
  
  // 🚨 PROTECTION CRITIQUE : Ne jamais supprimer un salon avec des utilisateurs
  try {
    // Recharger le salon pour avoir les données les plus récentes
    const freshChannel = await getChannelById(channel.id, guildId);
    if (freshChannel && freshChannel.members.size > 0) {
      console.log(`[CLEANUP] 🚨 PROTECTION : Salon ${channel.name} (${channel.id}) a ${freshChannel.members.size} membres, suppression annulée`);
      return;
    }
  } catch (error) {
    console.error('[CLEANUP] Error checking channel members before deletion:', error);
    // En cas d'erreur, ne pas supprimer par sécurité
    return;
  }
  
  // Vérifier le rate limiting pour les suppressions (2-3 req/sec)
  if (!checkDeleteRateLimit(guildId)) {
    console.log(`[CLEANUP] Rate limit atteint pour guild ${guildId}, suppression reportée`);
    // Ajouter à la queue de nettoyage pour traitement ultérieur
    if (!cleanupQueue.has(guildId)) {
      cleanupQueue.set(guildId, []);
    }
    cleanupQueue.get(guildId).push({
      channelId: channel.id,
      reason: 'rate_limit',
      timestamp: Date.now()
    });
    return;
  }
  
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      // Validation du channel
      if (!channel.id || !channel.guild) {
        console.error('[CLEANUP] Invalid channel:', channel.id);
        return;
      }
      
      // Suppression du channel optimisée pour l'API Discord (2-3 req/sec recommandé)
      const deletePromise = Promise.race([
        channel.delete(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Channel delete timeout')), CHANNEL_DELETE_TIMEOUT)
        )
      ]);
      
      // Pipeline Redis optimisé avec validation - MODIFIÉ pour fonctionner sans Redis
      let redisPromise = Promise.resolve();
      
      if (redisEnabled && require('../redisClient').redis) {
        try {
          const pipeline = require('../redisClient').redis.pipeline();
          const keys = [
            `creator:${channel.id}`,
            `locked:${channel.id}`,
            `hidden:${channel.id}`,
            `limit:${channel.id}`,
            `soundboard:${channel.id}`,
            `status:${channel.id}`,
            `mute_state:${channel.id}`,
            `permitted_roles:${channel.id}`,
            `rejected_roles:${channel.id}`,
            `hidden_lock_state:${channel.id}`,
            `task_timer:${channel.id}`,
            `task_ready:${channel.id}`
          ];
          
          keys.forEach(key => {
            if (key && typeof key === 'string') {
              pipeline.del(key);
            }
          });
          
          redisPromise = Promise.race([
            pipeline.exec(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Redis cleanup timeout')), 500)
            )
          ]);
        } catch (error) {
          console.log('[CLEANUP] Redis pipeline error, continuing without Redis cleanup:', error.message);
          redisPromise = Promise.resolve();
        }
      }
      
      await Promise.allSettled([deletePromise, redisPromise]);
      
      const channelName = channel?.name || channel?.id || 'unknown';
      // ✅ Salon nettoyé avec succès
      return;
      
    } catch (error) {
      retries++;
      console.error(`[CLEANUP] Attempt ${retries} failed for channel ${channel?.id}:`, error);
      
      if (retries >= MAX_RETRIES) {
        const channelName = channel?.name || channel?.id || 'unknown';
        console.error(`[CLEANUP] Failed to clean channel ${channelName} after ${MAX_RETRIES} attempts`);
        return;
      }
      
      // Attendre avec backoff plus long pour éviter les conflits (2-3 req/sec)
      await new Promise(resolve => setTimeout(resolve, 500 * retries));
    }
  }
}

// Création de salon ULTRA-ROBUSTE avec gestion d'erreurs complète
async function createTempChannel(state, guildId) {
  const { guild, member, channel } = state;
  
  // 🚀 CRÉATION INSTANTANÉE - Vérifications minimales pour éviter le retard
  if (!INSTANT_CREATION) {
    // Vérification du circuit breaker (seulement si pas en mode instantané)
  if (!checkCircuitBreaker(guildId)) {
    return;
  }
  
    // Vérification de la charge (seulement si pas en mode instantané)
  if (!canHandleLoad(guildId)) {
    return;
    }
  }
  
  // Validation complète des paramètres
  if (!guild || !member || !channel || !guildId) {
    console.error('[CREATE] Invalid state parameters:', { 
      hasGuild: !!guild, 
      hasMember: !!member, 
      hasChannel: !!channel, 
      guildId 
    });
    return;
  }
  
  if (!member?.voice?.channelId || member.voice.channelId !== channel?.id) {
    // ✅ Utilisateur pas dans le bon salon
    return;
  }

  // Vérification supplémentaire pour s'assurer que l'utilisateur est toujours connecté
  if (!member.voice.channel) {
    // ✅ Utilisateur déconnecté
    return;
  }
  
  if (!member?.displayName || !member?.id) {
    console.error('[CREATE] Invalid member data:', { 
      hasDisplayName: !!member?.displayName, 
      hasId: !!member?.id 
    });
    return;
  }
  
  // Vérifier la queue de création pour ce guild
  if (!creationQueue.has(guildId)) {
    creationQueue.set(guildId, []);
  }
  
  const guildQueue = creationQueue.get(guildId);
  if (guildQueue.length >= MAX_CONCURRENT_CREATIONS) {
    // ✅ Trop de créations simultanées - mise en queue
    guildQueue.push({ state, guildId, timestamp: Date.now() });
    return;
  }
  
  guildQueue.push({ state, guildId, timestamp: Date.now() });
  
  let tempChannel = null;
  let retries = 0;
  
  try {
    // Récupérer les permissions du salon setup pour les appliquer au nouveau salon
    // Filtrer pour ne garder que les rôles (pas les utilisateurs individuels)
    const setupChannelPermissions = channel.permissionOverwrites.cache
      .filter(perm => {
        // Vérifier si c'est un rôle (pas un utilisateur)
        const role = guild.roles.cache.get(perm.id);
        return role !== undefined;
      })
      .map(perm => ({
        id: perm.id,
        allow: perm.allow.toArray(),
        deny: perm.deny.toArray()
      }));

    // 🚀 Création atomique du salon ULTRA-RAPIDE avec retry optimisé
    while (retries < MAX_RETRIES) {
      try {
            // 🚀 Timeout optimal Discord API pour la création de salon
        const adaptiveTimeout = ADAPTIVE_TIMEOUT ? 
              Math.min(CHANNEL_CREATION_TIMEOUT * (1 + retries * 0.05), 800) : // Timeout minimum Discord API
          CHANNEL_CREATION_TIMEOUT;
        
        const permissionOverwrites = [
          {
            id: member.id,
            allow: [
              'ViewChannel', 
              'Connect', 
              'Speak', 
              'UseVAD',
              'Stream',
              'UseEmbeddedActivities',
              'UseExternalEmojis',
              'UseExternalStickers',
              'AddReactions',
              'SendMessages',
              'UseApplicationCommands'
            ]
          },
          ...setupChannelPermissions
        ];

        const channelCreatePromise = Promise.race([
          guild.channels.create({
            name: `${member.displayName}'s Room`,
            type: 2,
            parent: channel.parentId || null,
            permissionOverwrites: permissionOverwrites,
            reason: `Temp channel for ${member.displayName}`,
            bitrate: 96000,
            userLimit: 0
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Channel creation timeout')), CHANNEL_CREATION_TIMEOUT) // Utilise la constante optimisée
          )
        ]);
        
        tempChannel = await channelCreatePromise;
        recordCircuitBreakerSuccess(guildId);
        updateHealthMetrics(guildId, true);
        
        // Marquer immédiatement le salon comme actif pour éviter toute suppression prématurée
        await safeSet(`temp_channel_active:${tempChannel.id}`, 'true', 120); // 2 minutes de protection
        
        // Enregistrer le timestamp de création
        channelCreationTimestamps.set(tempChannel.id, Date.now());
        
        // 🚀 DÉPLACEMENT OPTIMISÉ après création du salon
        try {
          // Vérifier que l'utilisateur est toujours dans le salon de création
          if (member.voice && member.voice.channelId === channel.id) {
            // Attendre un petit délai pour s'assurer que le salon est prêt
            await new Promise(resolve => setTimeout(resolve, 100)); // Optimisé: 200ms → 100ms
            
            // Tentative de déplacement avec retry
            let moveRetries = 0;
            const maxMoveRetries = MAX_RETRIES; // Utilise la constante optimisée
            
            while (moveRetries < maxMoveRetries) {
              try {
                await Promise.race([
                  member.voice.setChannel(tempChannel),
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Move user timeout')), MOVE_USER_TIMEOUT)
                  )
                ]);
                console.log(`[MOVE] ✅ Utilisateur déplacé vers ${tempChannel.name}`);
                
                // Marquer que le déplacement a été fait
                tempChannel._immediateMoveDone = true;
                
                // Marquer le salon comme actif
                await safeSet(`temp_channel_active:${tempChannel.id}`, 'true', 120);
                break; // Succès, sortir de la boucle
                
              } catch (moveError) {
                moveRetries++;
                console.log(`[MOVE] ⚠️ Tentative ${moveRetries}/${maxMoveRetries} échouée: ${moveError.message}`);
                
                if (moveRetries >= maxMoveRetries) {
                  console.log(`[MOVE] ❌ Échec définitif du déplacement après ${maxMoveRetries} tentatives`);
                  // 🛡️ PROTECTION ANTI-SPAM : Supprimer le salon temporaire en cas d'échec de déplacement
                  try {
                    await tempChannel.delete();
                    console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} supprimé (échec de déplacement)`);
                    
                    // Nettoyer Redis pour éviter les orphelins
                    const keys = [
                      `creator:${tempChannel.id}`,
                      `locked:${tempChannel.id}`,
                      `hidden:${tempChannel.id}`,
                      `limit:${tempChannel.id}`,
                      `soundboard:${tempChannel.id}`,
                      `status:${tempChannel.id}`,
                      `mute_state:${tempChannel.id}`,
                      `permitted_roles:${tempChannel.id}`,
                      `rejected_roles:${tempChannel.id}`,
                      `hidden_lock_state:${tempChannel.id}`,
                      `task_timer:${tempChannel.id}`,
                      `task_ready:${tempChannel.id}`,
                      `temp_channel_active:${tempChannel.id}`,
                      `protected:${tempChannel.id}`,
                      `denied_users:${tempChannel.id}`
                    ];
                    
                    keys.forEach(key => {
                      safeDel(key).catch(() => {});
                    });
                    
                    console.log(`[CLEANUP] 🧹 Redis nettoyé pour le salon temporaire ${tempChannel.id}`);
                  } catch (deleteError) {
                    console.error(`[CLEANUP] ❌ Erreur lors de la suppression du salon temporaire ${tempChannel.id}:`, deleteError.message);
                  }
                  return;
                }
                
                // Attendre avant de réessayer
                await new Promise(resolve => setTimeout(resolve, 200)); // Optimisé: 300ms → 200ms
              }
            }
          } else {
            // Vérifier si l'utilisateur s'est déconnecté complètement ou a changé de salon
            if (!member.voice) {
              console.log(`[MOVE] ⚠️ Utilisateur s'est déconnecté, suppression du salon temporaire`);
            } else {
              console.log(`[MOVE] ⚠️ Utilisateur a changé de salon (${member.voice.channelId}), suppression du salon temporaire`);
            }
            // 🛡️ PROTECTION ANTI-SPAM : Supprimer le salon temporaire si l'utilisateur n'est plus dans le salon de création
            try {
              await tempChannel.delete();
              console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} supprimé (utilisateur parti avant déplacement)`);
              
              // Nettoyer Redis pour éviter les orphelins
              const keys = [
                `creator:${tempChannel.id}`,
                `locked:${tempChannel.id}`,
                `hidden:${tempChannel.id}`,
                `limit:${tempChannel.id}`,
                `soundboard:${tempChannel.id}`,
                `status:${tempChannel.id}`,
                `mute_state:${tempChannel.id}`,
                `permitted_roles:${tempChannel.id}`,
                `rejected_roles:${tempChannel.id}`,
                `hidden_lock_state:${tempChannel.id}`,
                `task_timer:${tempChannel.id}`,
                `task_ready:${tempChannel.id}`,
                `temp_channel_active:${tempChannel.id}`,
                `protected:${tempChannel.id}`,
                `denied_users:${tempChannel.id}`
              ];
              
              keys.forEach(key => {
                safeDel(key).catch(() => {});
              });
              
              console.log(`[CLEANUP] 🧹 Redis nettoyé pour le salon temporaire ${tempChannel.id}`);
            } catch (deleteError) {
              console.error(`[CLEANUP] ❌ Erreur lors de la suppression du salon temporaire ${tempChannel.id}:`, deleteError.message);
            }
            return;
          }
        } catch (moveError) {
          console.log(`[MOVE] ❌ Erreur déplacement: ${moveError.message}`);
          // 🛡️ PROTECTION ANTI-SPAM : Supprimer le salon temporaire en cas d'erreur de déplacement
          try {
            await tempChannel.delete();
            console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} supprimé (erreur de déplacement)`);
            
            // Nettoyer Redis pour éviter les orphelins
            const keys = [
              `creator:${tempChannel.id}`,
              `locked:${tempChannel.id}`,
              `hidden:${tempChannel.id}`,
              `limit:${tempChannel.id}`,
              `soundboard:${tempChannel.id}`,
              `status:${tempChannel.id}`,
              `mute_state:${tempChannel.id}`,
              `permitted_roles:${tempChannel.id}`,
              `rejected_roles:${tempChannel.id}`,
              `hidden_lock_state:${tempChannel.id}`,
              `task_timer:${tempChannel.id}`,
              `task_ready:${tempChannel.id}`,
              `temp_channel_active:${tempChannel.id}`,
              `protected:${tempChannel.id}`,
              `denied_users:${tempChannel.id}`
            ];
            
            keys.forEach(key => {
              safeDel(key).catch(() => {});
            });
            
            console.log(`[CLEANUP] 🧹 Redis nettoyé pour le salon temporaire ${tempChannel.id}`);
          } catch (deleteError) {
            console.error(`[CLEANUP] ❌ Erreur lors de la suppression du salon temporaire ${tempChannel.id}:`, deleteError.message);
          }
          return;
        }
        
        // Enregistrer le salon pour le monitoring
        registerChannelForMonitoring(tempChannel.id, guildId, member.id);
        
        // 🛡️ VÉRIFICATION SUPPLÉMENTAIRE : Vérifier après 1 seconde si le salon est vide
        setTimeout(async () => {
          try {
            const checkChannel = await getChannelById(tempChannel.id, guildId);
            if (checkChannel && checkChannel.members.size === 0) {
              console.log(`[CLEANUP] 🧹 Salon temporaire ${tempChannel.id} détecté vide après 1s, suppression...`);
              await checkChannel.delete();
              console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} supprimé (vérification supplémentaire)`);
              
              // Nettoyer Redis
              const keys = [
                `creator:${tempChannel.id}`,
                `locked:${tempChannel.id}`,
                `hidden:${tempChannel.id}`,
                `limit:${tempChannel.id}`,
                `soundboard:${tempChannel.id}`,
                `status:${tempChannel.id}`,
                `mute_state:${tempChannel.id}`,
                `permitted_roles:${tempChannel.id}`,
                `rejected_roles:${tempChannel.id}`,
                `hidden_lock_state:${tempChannel.id}`,
                `task_timer:${tempChannel.id}`,
                `task_ready:${tempChannel.id}`,
                `temp_channel_active:${tempChannel.id}`,
                `protected:${tempChannel.id}`,
                `denied_users:${tempChannel.id}`
              ];
              
              keys.forEach(key => {
                safeDel(key).catch(() => {});
              });
              
              console.log(`[CLEANUP] 🧹 Redis nettoyé pour le salon temporaire ${tempChannel.id}`);
            }
          } catch (error) {
            console.error(`[CLEANUP] ❌ Erreur lors de la vérification supplémentaire du salon ${tempChannel.id}:`, error.message);
          }
        }, 1000); // Vérification après 1 seconde
        
        // 🛡️ VÉRIFICATION PROLONGÉE : Vérifier après 5 secondes si le salon est toujours vide
        setTimeout(async () => {
          try {
            const checkChannel = await getChannelById(tempChannel.id, guildId);
            if (checkChannel && checkChannel.members.size === 0) {
              console.log(`[CLEANUP] 🧹 Salon temporaire ${tempChannel.id} détecté vide après 5s, suppression prolongée...`);
              await checkChannel.delete();
              console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} supprimé (vérification prolongée)`);
              
              // Nettoyer Redis
              const keys = [
                `creator:${tempChannel.id}`,
                `locked:${tempChannel.id}`,
                `hidden:${tempChannel.id}`,
                `limit:${tempChannel.id}`,
                `soundboard:${tempChannel.id}`,
                `status:${tempChannel.id}`,
                `mute_state:${tempChannel.id}`,
                `permitted_roles:${tempChannel.id}`,
                `rejected_roles:${tempChannel.id}`,
                `hidden_lock_state:${tempChannel.id}`,
                `task_timer:${tempChannel.id}`,
                `task_ready:${tempChannel.id}`,
                `temp_channel_active:${tempChannel.id}`,
                `protected:${tempChannel.id}`,
                `denied_users:${tempChannel.id}`
              ];
              
              keys.forEach(key => {
                safeDel(key).catch(() => {});
              });
              
              console.log(`[CLEANUP] 🧹 Redis nettoyé pour le salon temporaire ${tempChannel.id}`);
            } else if (checkChannel && checkChannel.members.size > 0) {
              console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} a ${checkChannel.members.size} membres, pas de suppression`);
            }
          } catch (error) {
            console.error(`[CLEANUP] ❌ Erreur lors de la vérification prolongée du salon ${tempChannel.id}:`, error.message);
          }
        }, 5000); // Vérification après 5 secondes (réduit de 10s à 5s)
        
        // 🛡️ VÉRIFICATION FINALE : Vérifier après 15 secondes pour les cas extrêmes
        setTimeout(async () => {
          try {
            const checkChannel = await getChannelById(tempChannel.id, guildId);
            if (checkChannel && checkChannel.members.size === 0) {
              console.log(`[CLEANUP] 🧹 Salon temporaire ${tempChannel.id} détecté vide après 15s, suppression finale...`);
              await checkChannel.delete();
              console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} supprimé (vérification finale)`);
              
              // Nettoyer Redis
              const keys = [
                `creator:${tempChannel.id}`,
                `locked:${tempChannel.id}`,
                `hidden:${tempChannel.id}`,
                `limit:${tempChannel.id}`,
                `soundboard:${tempChannel.id}`,
                `status:${tempChannel.id}`,
                `mute_state:${tempChannel.id}`,
                `permitted_roles:${tempChannel.id}`,
                `rejected_roles:${tempChannel.id}`,
                `hidden_lock_state:${tempChannel.id}`,
                `task_timer:${tempChannel.id}`,
                `task_ready:${tempChannel.id}`,
                `temp_channel_active:${tempChannel.id}`,
                `protected:${tempChannel.id}`,
                `denied_users:${tempChannel.id}`
              ];
              
              keys.forEach(key => {
                safeDel(key).catch(() => {});
              });
              
              console.log(`[CLEANUP] 🧹 Redis nettoyé pour le salon temporaire ${tempChannel.id}`);
            } else if (checkChannel && checkChannel.members.size > 0) {
              console.log(`[CLEANUP] ✅ Salon temporaire ${tempChannel.id} a ${checkChannel.members.size} membres, pas de suppression finale`);
            }
          } catch (error) {
            console.error(`[CLEANUP] ❌ Erreur lors de la vérification finale du salon ${tempChannel.id}:`, error.message);
          }
        }, 15000); // Vérification après 15 secondes (vérification finale)
        
        break;
        
      } catch (error) {
        retries++;
        console.error(`[CREATE] Channel creation attempt ${retries} failed:`, error.message);
        
        // Vérifier si c'est un timeout ou une erreur Discord
        if (error.message.includes('timeout') || error.code === 50013 || error.code === 50001) {
          // Erreur temporaire, continuer les tentatives
        if (retries >= MAX_RETRIES) {
          console.error('[CREATE] Failed to create channel after all retries');
          recordCircuitBreakerFailure(guildId);
          updateHealthMetrics(guildId, false);
          return;
        }
        
              // 🚀 Attendre avec backoff optimal Discord API pour éviter les surcharges
              await new Promise(resolve => setTimeout(resolve, 500 * retries)); // Backoff réaliste
        } else {
          // Erreur permanente, arrêter immédiatement
          console.error('[CREATE] Permanent error, stopping retries:', error.message);
          recordCircuitBreakerFailure(guildId);
          updateHealthMetrics(guildId, false);
          return;
        }
      }
    }
    
    if (!tempChannel) {
      console.error('[CREATE] No channel created after retries');
      recordCircuitBreakerFailure(guildId);
      updateHealthMetrics(guildId, false);
      return;
    }

    // Rate limit en arrière-plan (DÉSACTIVÉ pour éviter les suppressions de salons)
    // const rateLimitPromise = atomicRateLimit(member.id, 'create_temp_channel', RATE_LIMIT_MAX);

    // Le déplacement a déjà été fait dans la section précédente, pas besoin de vérification supplémentaire

    // Sauvegarder le créateur du salon dans Redis (non-bloquant)
            if (redisEnabled) {
      safeSet(`creator:${tempChannel.id}`, member.id, { ex: 86400 }).catch(error => 
        console.log('[REDIS] Error saving creator, continuing without Redis:', error.message)
      );
    }

    // ✅ Rate limiting optimisé et désactivé pour éviter les suppressions

    // 🚀 Message de bienvenue ULTRA-PERFORMANCE (envoi immédiat sans queue)
    // Envoi immédiat sans attendre la microtask queue
    (async () => {
      try {
        // Vérifier si le message de bienvenue est activé
        if (!WELCOME_MESSAGE_ENABLED) {
          console.log('[WELCOME] Message de bienvenue désactivé, skipping');
          return;
        }
        if (!tempChannel) {
          console.error('[WELCOME] No temp channel available for welcome message');
          return;
        }

        // 🚀 ENVOI INSTANTANÉ - Pas de vérification Redis pour éviter le retard

        // Le statut sera défini après l'envoi du message pour ne pas bloquer
        
        // 🚀 ENVOI INSTANTANÉ - Pas de vérification de permissions pour éviter le retard
        
        // 🚀 ENVOI INSTANTANÉ - Création directe des composants avec bouton trash
        let components;
        if (PARALLEL_COMPONENT_CREATION) {
          components = await createWelcomeComponentsParallel(member, tempChannel);
        } else {
          components = await createWelcomeComponentsLegacy();
        }

        // 🚀 Les composants sont maintenant créés par la fonction parallèle optimisée





        // 🚀 NOUVELLE TECHNIQUE: Envoi instantané
        if (ULTRA_FAST_WELCOME) {
          // Envoi immédiat sans attendre
          sendWelcomeMessageInstant(tempChannel, components);
          console.log('[WELCOME] ✅ Message de bienvenue envoyé instantanément');
          
          // 🚀 ENVOI INSTANTANÉ - Pas de marquage Redis pour éviter le retard
        } else {
          // Fallback vers l'ancien système avec retry
        let welcomeSent = false;
          for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            if (!tempChannel || !tempChannel.id) {
              console.log('[WELCOME] Channel no longer exists, skipping welcome message');
              break;
            }
            
              const timeout = WELCOME_MESSAGE_ULTRA_FAST ? 1000 : WELCOME_MESSAGE_TIMEOUT; // Optimisé: 1500ms → 1000ms
            await Promise.race([
              tempChannel.send({
                flags: MessageFlags.IsComponentsV2,
                  components: [components.mainContainer],
                  files: [components.voiceThumbnailFile, components.controlThumbnailFile]
              }),
              new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Welcome message timeout')), timeout)
              )
            ]);
            welcomeSent = true;
              console.log('[WELCOME] ✅ Message de bienvenue envoyé avec succès');
              
              // 🚀 ENVOI INSTANTANÉ - Pas de marquage Redis pour éviter le retard
            break;
          } catch (error) {
            console.error(`[WELCOME] ❌ Tentative ${attempt} échouée:`, error.message);
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 200 * attempt));
            }
          }
        }
        
        if (!welcomeSent) {
            console.warn('[WELCOME] ⚠️ Impossible d\'envoyer le message de bienvenue après 2 tentatives');
        }
        }
        
        // ✅ Message de bienvenue traité (succès ou échec)
        
        // Définir le statut du salon après l'envoi du message (non-bloquant)
        setTimeout(async () => {
          try {
            const axios = require('axios');
            const url = `https://discord.com/api/v10/channels/${tempChannel.id}/voice-status`;
            const payload = { status: '<:discotoolsxyzicon20:1388586698308321392> **skz_rayan23** <:discotoolsxyzicon20:1388586698308321392>' };
            
            await axios.put(url, payload, {
              headers: {
                Authorization: `Bot ${guild.client.token}`,
                'Content-Type': 'application/json'
              }
            });
            console.log(`[STATUS] Default status set for channel ${tempChannel.id}`);
          } catch (statusError) {
            console.error('[STATUS] Failed to set default status:', statusError.message);
          }
        }, 100); // 100ms après l'envoi du message
      } catch (error) {
        console.error('[WELCOME] Error sending welcome message:', error);
      }
    })();
    
  } catch (error) {
    console.error('[CREATE] Critical error creating temp channel:', error);
    
    // Cleanup en cas d'erreur critique
    if (tempChannel) {
      addEmergencyTask(() => {
        tempChannel.delete().catch(cleanupError => 
          console.error('[CLEANUP] Failed to delete temp channel after critical error:', cleanupError)
        );
      });
    }
  } finally {
    // Retirer de la queue
    const guildQueue = creationQueue.get(guildId);
    if (guildQueue) {
      const index = guildQueue.findIndex(item => item.state === state);
      if (index !== -1) {
        guildQueue.splice(index, 1);
      }
    }
  }
}

// Fonction de cache ultra-robuste
async function getCachedConfig(guildId) {
  if (!guildId) {
    console.error('[CONFIG] No guildId provided');
    return null;
  }
  
  // Vérification cache ultra-rapide avec early return
  const cached = configCache.get(guildId);
  if (cached && Date.now() - cached.timestamp < CONFIG_CACHE_TTL) {
    return cached.config;
  }

  try {
    console.log(`[CONFIG] 🔍 Récupération de la config pour guild ${guildId}...`);
    const configPromise = getGuildConfig(guildId);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Config timeout')), 2000) // Augmenté à 2 secondes
    );
    
    const config = await Promise.race([configPromise, timeoutPromise]);
    
    if (!config) {
      throw new Error('Config is null or undefined');
    }
    
    console.log(`[CONFIG] ✅ Config récupérée avec succès:`, config);
    
    configCache.set(guildId, {
      config,
      timestamp: Date.now()
    });
    
    return config;
  } catch (error) {
    console.error(`[CONFIG] ❌ Error getting config for ${guildId}:`, error.message);
    
    const defaultConfig = {
      createChannelName: '➕ Create Temp Channel',
      createChannelId: null,
      tempChannelCategory: null,
      autoDeleteEmpty: true,
      allowRenaming: true,
      defaultUserLimit: 0
    };
    
    configCache.set(guildId, {
      config: defaultConfig,
      timestamp: Date.now()
    });
    
    return defaultConfig;
  }
}

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    // Validation des paramètres d'entrée
    if (!oldState || !newState) {
      console.error('[VOICE] Invalid state parameters');
      return;
    }
    
    // Early return si pas de changement de channel
    if (oldState.channelId === newState.channelId) return;

    try {
      const guildId = newState.guild?.id || oldState.guild?.id;
      const userId = newState.member?.id || oldState.member?.id;
      
      if (!guildId) {
        console.error('[VOICE] No guildId found in states');
        return;
      }
      
      // Récupération de config avec cache
      const config = await getCachedConfig(guildId);
      
      // 🔍 DEBUG : Vérifier la configuration
      console.log(`[CONFIG DEBUG] GuildId: ${guildId}, Config:`, config);
      
      // Vérification rapide de la config
      if (!config?.createChannelId) {
        console.log(`[CONFIG] ❌ Pas de createChannelId configuré pour le guild ${guildId}`);
        return;
      }
      
      console.log(`[CONFIG] ✅ createChannelId trouvé: ${config.createChannelId}`);
      
      // 🚀 Création de salon temporaire ULTRA-PERFORMANCE (zéro blocage garanti)
      if (newState.channel?.id === config.createChannelId) {
        // ✅ Création de salon temporaire en cours
        console.log(`[CREATE] 🚀 Utilisateur ${newState.member.displayName} a rejoint le salon de création ${config.createChannelId}`);
        
        // 🚀 PROTECTION MAXIMALE - Ne jamais bloquer avec timeout optimal Discord API
        Promise.race([
          createTempChannel(newState, guildId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Channel creation timeout')), CHANNEL_CREATION_TIMEOUT * 2) // Utilise la constante optimisée x2
          )
        ]).catch(error => {
          console.error(`[VOICE] ❌ Error creating temp channel:`, error.message);
          // Ne pas bloquer - continuer même en cas d'erreur
        });
      }
      
      // ✅ Ancien système de suppression supprimé pour éviter les conflits
      
      // Mettre à jour l'activité des salons
      if (newState.channel && newState.channel.type === 2) {
        updateChannelActivity(newState.channel.id, newState.channel.members.size);
        
        // ✅ Ancien système de marquage supprimé
        
        // Vérifier si c'est un salon temporaire et marquer qu'il est actif
        const userId = newState.member?.id;
        if (userId) {
          const creatorId = await Promise.race([
            safeGet(`creator:${newState.channel.id}`),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Redis check timeout')), 200)
            )
          ]).catch(() => null);
          
          if (creatorId === userId) {
            // Marquer le salon comme actif pour éviter le nettoyage
            await safeSet(`temp_channel_active:${newState.channel.id}`, 'true', 60); // 60 secondes
          }
        }
      }
      
      
      if (oldState.channel && oldState.channel.type === 2) {
        updateChannelActivity(oldState.channel.id, oldState.channel.members.size);
      }
      
      // ✅ Système de vérification des salons verrouillés optimisé
      
      // 🧠 SYSTÈME DE SUPPRESSION IMMÉDIATE QUAND LE DERNIER MEMBRE QUITTE
      if (oldState.channel && oldState.channel.id && oldState.channel.name !== config.createChannelName) {
        console.log(`[DELETE] 🔍 Utilisateur a quitté le salon ${oldState.channel.id} (${oldState.channel.name})`);
        
        // Vérifier si c'est un salon créé par le bot
        const creatorId = await safeGet(`creator:${oldState.channel.id}`).catch(() => null);
        
        if (creatorId) {
          console.log(`[DELETE] ✅ Salon ${oldState.channel.id} créé par le bot (créateur: ${creatorId})`);
          
          // Vérifier immédiatement si le salon est vide après le départ
          if (oldState.channel.members.size === 0) {
            const channelId = oldState.channel.id;
            const channelName = oldState.channel.name;
            
            console.log(`[DELETE] 🗑️ Salon ${channelId} est vide, suppression immédiate...`);
            
            try {
              // 🧹 NETTOYAGE DES MESSAGES DE BIENVENUE avant suppression
              await cleanupWelcomeMessages(channelId, guildId);
              
              // Supprimer le salon directement
              await oldState.channel.delete();
              console.log(`[DELETE] ✅ Salon ${channelId} supprimé avec succès !`);
              
              // Nettoyer Redis
              const keys = [
                `creator:${channelId}`,
                `locked:${channelId}`,
                `hidden:${channelId}`,
                `limit:${channelId}`,
                `soundboard:${channelId}`,
                `status:${channelId}`,
                `mute_state:${channelId}`,
                `permitted_roles:${channelId}`,
                `rejected_roles:${channelId}`,
                `hidden_lock_state:${channelId}`,
                `task_timer:${channelId}`,
                `task_ready:${channelId}`,
                `temp_channel_active:${channelId}`,
                `protected:${channelId}`,
                `denied_users:${channelId}`
              ];
              
              keys.forEach(key => {
                safeDel(key).catch(() => {});
              });
              
              console.log(`[DELETE] 🧹 Redis nettoyé pour le salon ${channelId}`);
              
            } catch (deleteError) {
              console.error(`[DELETE] ❌ Erreur lors de la suppression du salon ${channelId}:`, deleteError.message);
            }
          } else {
            console.log(`[DELETE] ⏭️ Salon ${oldState.channel.id} a encore ${oldState.channel.members.size} membres, suppression annulée`);
          }
        } else {
          console.log(`[DELETE] ⏭️ Salon ${oldState.channel.id} n'est pas un salon du bot, ignoré`);
        }
      }
      
      // 🕐 NETTOYAGE PÉRIODIQUE INTELLIGENT ANTI-SPAM - Vérifier tous les salons vides toutes les 5 secondes
      if (!global.cleanupInterval) {
        // 🛡️ PROTECTION ANTI-SPAM : Variables de contrôle
        let lastCleanupTime = 0;
        let cleanupInProgress = false;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const MIN_CLEANUP_INTERVAL = 3000; // Minimum 3 secondes entre les nettoyages
        
        global.cleanupInterval = setInterval(async () => {
          try {
            // 🛡️ PROTECTION ANTI-SPAM : Vérifier si un nettoyage est déjà en cours
            if (cleanupInProgress) {
              return; // Ignorer si un nettoyage est déjà en cours
            }
            
            // 🛡️ PROTECTION ANTI-SPAM : Vérifier l'intervalle minimum
            const now = Date.now();
            if (now - lastCleanupTime < MIN_CLEANUP_INTERVAL) {
              return; // Ignorer si pas assez de temps écoulé
            }
            
            // 🛡️ PROTECTION ANTI-SPAM : Vérifier les erreurs consécutives
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              console.log('[CLEANUP] ⚠️ Trop d\'erreurs consécutives, pause temporaire du nettoyage');
              return;
            }
            
            cleanupInProgress = true;
            lastCleanupTime = now;
            
            // 🔧 CORRECTION : Utiliser le client directement depuis le module
            let client;
            try {
              const botModule = require('../bot');
              client = botModule?.client;
            } catch (requireError) {
              // Si require échoue, essayer d'accéder au client global
              client = global.client || global.botClient;
            }
            
            if (!client || !client.guilds) {
              cleanupInProgress = false;
              return;
            }
            
            let totalScanned = 0;
            let totalDeleted = 0;
            let totalIgnored = 0;
            
            // 🔍 SCAN INTELLIGENT : Limiter le nombre de salons traités par cycle
            const MAX_CHANNELS_PER_CYCLE = 10;
            let channelsProcessed = 0;
            
            for (const [guildId, guild] of client.guilds.cache) {
              if (channelsProcessed >= MAX_CHANNELS_PER_CYCLE) {
                break; // Limiter le nombre de salons traités par cycle
              }
              
              // 🔍 SCAN ULTRA-COMPLET : Tous les salons vocaux
              const voiceChannels = guild.channels.cache.filter(channel => 
                channel.type === 2 && // Salon vocal
                channel.members.size === 0 // Salon vide
              );
              
              totalScanned += voiceChannels.size;
              
              for (const [channelId, channel] of voiceChannels) {
                if (channelsProcessed >= MAX_CHANNELS_PER_CYCLE) {
                  break; // Limiter le nombre de salons traités par cycle
                }
                
                try {
                  channelsProcessed++;
                  
                  // 🔍 VÉRIFICATION CRÉATEUR : Vérifier si c'est un salon du bot (plus rapide)
                  const creatorId = await safeGet(`creator:${channelId}`).catch(() => null);
                  if (!creatorId) {
                    // Salon non créé par le bot, vérifier par le pattern de nom
                    if (!channel.name.includes("'s Room") && !channel.name.includes("'s room")) {
                      totalIgnored++;
                      continue; // Ignorer les salons non-temporaires
                    }
                    // 🛡️ SALON ORPHELIN : Si c'est un salon temporaire sans créateur, le supprimer
                    console.log(`[CLEANUP] 🧹 Salon orphelin détecté: ${channel.name} (${channelId}) - suppression...`);
                  }
                  
                  // 🔍 VÉRIFICATION REDONDANTE : Re-vérifier que le salon est toujours vide
                  const freshChannel = await getChannelById(channelId, guildId);
                  if (!freshChannel) {
                    totalIgnored++;
                    continue;
                  }
                  
                  if (freshChannel.members.size > 0) {
                    totalIgnored++;
                    continue;
                  }
                  
                  // 🗑️ SUPPRESSION INTELLIGENTE avec timeout réduit
                  try {
                    // 🧹 NETTOYAGE DES MESSAGES DE BIENVENUE avant suppression
                    await cleanupWelcomeMessages(channelId, guildId);
                    
                    await Promise.race([
                      channel.delete(),
                      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                    ]);
                    
                    totalDeleted++;
                    
                    // 🧹 NETTOYAGE REDIS ULTRA-COMPLET (en arrière-plan)
                    const keys = [
                      `creator:${channelId}`,
                      `locked:${channelId}`,
                      `hidden:${channelId}`,
                      `limit:${channelId}`,
                      `soundboard:${channelId}`,
                      `status:${channelId}`,
                      `mute_state:${channelId}`,
                      `permitted_roles:${channelId}`,
                      `rejected_roles:${channelId}`,
                      `hidden_lock_state:${channelId}`,
                      `task_timer:${channelId}`,
                      `task_ready:${channelId}`,
                      `temp_channel_active:${channelId}`,
                      `protected:${channelId}`,
                      `denied_users:${channelId}`,
                      `channel_${channelId}`,
                      `temp_${channelId}`,
                      `voice_${channelId}`
                    ];
                    
                    // Nettoyage en arrière-plan pour ne pas bloquer
                    setImmediate(() => {
                      Promise.allSettled(
                        keys.map(key => safeDel(key).catch(() => {}))
                      );
                    });
                    
                  } catch (deleteError) {
                    console.error(`[CLEANUP] ❌ Erreur suppression salon ${channelId}:`, deleteError.message);
                  }
                  
                } catch (channelError) {
                  console.error(`[CLEANUP] ❌ Erreur traitement salon ${channelId}:`, channelError.message);
                }
              }
            }
            
            // 📊 LOGS INTELLIGENTS : Seulement si il y a de l'activité
            if (totalScanned > 0) {
              console.log(`[CLEANUP] 📊 Scan: ${totalScanned} scannés, ${totalDeleted} supprimés, ${totalIgnored} ignorés`);
            }
            
            // ✅ Réinitialiser le compteur d'erreurs en cas de succès
            consecutiveErrors = 0;
            
          } catch (error) {
            consecutiveErrors++;
            console.error('[CLEANUP] ❌ Erreur critique:', error.message);
          } finally {
            cleanupInProgress = false;
          }
        }, 5000); // Toutes les 5 secondes (nettoyage intelligent anti-spam)
        
        console.log('[CLEANUP] ✅ Nettoyage périodique intelligent anti-spam activé (toutes les 5 secondes)');
      }

      // ✅ Système de task timer optimisé et intégré
      
      // ✅ Vérification optimisée des salons vocaux
      if (oldState.channel && oldState.channel.type === 2) {
        
        // === GESTION PAUSE TASK ===
        // Vérifier si c'est le créateur qui quitte un salon temporaire
        try {
          // Vérification simple et efficace
          if (!oldState.channel?.id || !oldState.member?.id) {
            return; // Éviter les erreurs si les objets sont null
          }
          
          const creatorId = await safeGet(`creator:${oldState.channel.id}`);
          if (creatorId === oldState.member.id) {
            // C'est le créateur qui quitte, vérifier s'il y a un timer de task
            const timerKey = `task_timer:${oldState.channel.id}`;
            const timerExists = await safeGet(timerKey);
            
            if (timerExists) {
              console.log(`[TASK_PAUSE] Staff ${oldState.member.user?.username || 'Unknown'} left channel ${oldState.channel.name || 'Unknown'}, starting pause logic`);
              // Démarrer la logique de pause
              await handleStaffLeave(oldState.channel, oldState.member);
            }
          }
        } catch (error) {
          console.error('[TASK_PAUSE] Error checking staff leave:', error);
        }
      }
      if (newState.channel && newState.channel.type === 2) {
        
        // === GESTION REPRISE TASK ===
        // Vérifier si c'est le créateur qui rejoint un salon temporaire
        try {
          // Vérification simple et efficace
          if (!newState.channel?.id || !newState.member?.id) {
            return; // Éviter les erreurs si les objets sont null
          }
          
          const creatorId = await safeGet(`creator:${newState.channel.id}`);
          if (creatorId === newState.member.id) {
            // C'est le créateur qui rejoint, vérifier s'il y a une pause
            const pauseKey = `task_pause:${newState.channel.id}`;
            const pauseExists = await safeGet(pauseKey);
            
            if (pauseExists) {
              console.log(`[TASK_PAUSE] Staff ${newState.member.user?.username || 'Unknown'} returned to channel ${newState.channel.name || 'Unknown'}, starting resume logic`);
              // Démarrer la logique de reprise
              await handleStaffReturn(newState.channel, newState.member);
            }
          }
        } catch (error) {
          console.error('[TASK_PAUSE] Error checking staff return:', error);
        }
        
        // Auto-mute new users if channel is in mute mode (only for bot-created temp channels)
        try {
          if (newState.channel && newState.channel.id && newState.member && newState.member.id) {
            const isBotTempChannel = await Promise.race([
              safeGet(`creator:${newState.channel.id}`),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Mute check timeout')), 200)  
              )
            ]);
            
            if (isBotTempChannel) {
              // 🚫 Vérifier si l'utilisateur est dans la liste des refusés
              const deniedUsers = await safeGet(`denied_users:${newState.channel.id}`).catch(() => '[]');
              let deniedList = [];
              try {
                deniedList = JSON.parse(deniedUsers) || [];
              } catch (error) {
                deniedList = [];
              }
              
              // S'assurer que deniedList est un tableau
              if (!Array.isArray(deniedList)) {
                deniedList = [];
              }
              
              if (deniedList.includes(newState.member.id)) {
                // Expulser immédiatement l'utilisateur refusé
                try {
                  await newState.member.voice.disconnect('Utilisateur refusé par le créateur');
                  console.log(`[DENY] 🚫 Utilisateur refusé ${newState.member.user?.username || 'Unknown'} expulsé du salon ${newState.channel.name}`);
                  
                  // Notifier le créateur
                  const creatorId = await safeGet(`creator:${newState.channel.id}`);
                  if (creatorId) {
                    const creator = newState.guild.members.cache.get(creatorId);
                    if (creator) {
                      try {
                        const notifyEmbed = new EmbedBuilder()
                          .setColor('#ff6b6b')
                          .setTitle('🚫 Utilisateur refusé détecté')
                          .setDescription(`**${newState.member.user.username}** a tenté de rejoindre votre salon mais a été automatiquement expulsé car il est dans votre liste des refusés.`)
                          .addFields(
                            { name: '👤 Utilisateur', value: `${newState.member.user.username} (${newState.member.id})`, inline: true },
                            { name: '📅 Date', value: new Date().toLocaleString(), inline: true }
                          )
                          .setTimestamp();
                        
                        await creator.send({ embeds: [notifyEmbed] });
                      } catch (dmError) {
                        // Ignorer les erreurs de DM
                      }
                    }
                  }
                } catch (disconnectError) {
                  console.error(`[DENY] Erreur expulsion utilisateur refusé:`, disconnectError.message);
                }
                return; // Sortir de la fonction
              }
              
              const muteState = await safeGet(`mute_state:${newState.channel.id}`);
              if (muteState === 'true') {
                try {
                  // Set individual permission for this user to not speak in this channel only
                  await Promise.race([
                    newState.channel.permissionOverwrites.edit(newState.member, {
                      Speak: false
                    }),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Permission edit timeout')), 500)
                    )
                  ]);
                  console.log(`[AUTO-MUTE] Auto-muted ${newState.member.user?.username || 'Unknown'} in temp channel ${newState.channel.name}`);
                } catch (error) {
                  console.error(`[AUTO-MUTE] Failed to auto-mute ${newState.member.user?.username || 'Unknown'}:`, error.message);
                }
              }
            }
          }
        } catch (error) {
          console.error('[AUTO-MUTE] Error checking mute state:', error);
        }
      }
    } catch (error) {
      console.error('[VOICE] ❌ Critical error in voiceStateUpdate:', error);
    }
  }
};

// ✅ Système AUTO_RECOVERY supprimé - trop complexe

// ✅ Système CHANNEL_MONITORING supprimé - trop complexe
if (false) {
  // Monitoring périodique des salons
  setInterval(() => {
    try {
      const botModule = require('../bot');
      if (!botModule || !botModule.client) return;
      
      botModule.client.guilds.cache.forEach(guild => {
        // Maintenance préventive
        schedulePreventiveMaintenance(guild.id);
        
        // Auto-healing
        performAutoHealing(guild.id);
        
        // Détection des orphelins
        detectOrphanChannels(guild);
      });
    } catch (error) {
      console.error('[CHANNEL_MONITORING] Error in periodic monitoring:', error);
    }
  }, CHANNEL_HEALTH_CHECK_INTERVAL);
  
  // Nettoyage périodique des queues
  setInterval(() => {
    try {
      cleanupQueue.forEach((queue, guildId) => {
        if (queue.length > 0) {
          console.log(`[CLEANUP_QUEUE] Processing ${queue.length} cleanup items for guild ${guildId}`);
          
          queue.forEach(async (item) => {
            try {
              const channel = await getChannelById(item.channelId, guildId);
              if (channel && channel.members.size === 0) {
                // 🚨 PROTECTION SUPPLÉMENTAIRE : Re-vérifier avant suppression
                const freshChannel = await getChannelById(item.channelId, guildId);
                if (freshChannel && freshChannel.members.size > 0) {
                  console.log(`[CLEANUP_QUEUE] 🚨 PROTECTION : Salon ${item.channelId} a ${freshChannel.members.size} membres, suppression annulée`);
                  return;
                }
                
                // ✅ cleanChannel supprimé - conflit avec le nouveau système
                console.log(`[CLEANUP_QUEUE] Cleaned channel ${item.channelId} (${item.reason})`);
              }
            } catch (error) {
              console.error(`[CLEANUP_QUEUE] Error cleaning channel ${item.channelId}:`, error);
            }
          });
          
          // Vider la queue après traitement
          cleanupQueue.set(guildId, []);
        }
      });
    } catch (error) {
      console.error('[CLEANUP_QUEUE] Error processing cleanup queue:', error);
    }
  }, CLEANUP_CHECK_INTERVAL);
  
  // Nettoyage préventif périodique
  setInterval(() => {
    try {
      const botModule = require('../bot');
      if (!botModule || !botModule.client) return;
      
      botModule.client.guilds.cache.forEach(guild => {
        const voiceChannels = guild.channels.cache.filter(channel => 
          channel.type === 2 && // Voice channel
          channel.name.includes("'s Room") && // Temp channel pattern
          channel.members.size === 0 // Empty channel
        );
        
        voiceChannels.forEach(async channel => {
          try {
            const creatorId = await safeGet(`creator:${channel.id}`);
            if (creatorId) {
              // Vérifier si le salon est dans le monitoring
              const monitorData = channelMonitor.get(channel.id);
              if (!monitorData) {
                console.log(`[PREVENTIVE_CLEANUP] Found unmonitored empty channel ${channel.id}, scheduling cleanup`);
                scheduleChannelCleanup(channel.id, guild.id);
              }
            }
          } catch (error) {
            console.error(`[PREVENTIVE_CLEANUP] Error checking channel ${channel.id}:`, error);
          }
        });
      });
    } catch (error) {
      console.error('[PREVENTIVE_CLEANUP] Error in preventive cleanup:', error);
    }
  }, PREVENTIVE_CLEANUP_INTERVAL);
  
  console.log('[CHANNEL_MONITORING] ✅ Ultra-advanced channel monitoring system initialized');
}

// ✅ Système ULTRA_CLEANUP supprimé - trop complexe
if (false) {
  // Nettoyage des données obsolètes
  setInterval(() => {
    const now = Date.now();
    
    // Nettoyer les données de monitoring obsolètes
    channelMonitor.forEach((data, channelId) => {
      if ((now - data.lastActivity) > CHANNEL_MONITOR_TTL) {
        channelMonitor.delete(channelId);
        console.log(`[ULTRA_CLEANUP] Removed stale monitoring data for channel ${channelId}`);
      }
    });
    
    // Nettoyer les orphelins anciens
    orphanChannels.forEach((data, channelId) => {
      if ((now - data.detectedAt) > ORPHAN_DETECTION_TTL) {
        orphanChannels.delete(channelId);
        console.log(`[ULTRA_CLEANUP] Removed stale orphan data for channel ${channelId}`);
      }
    });
    
    // Nettoyer les queues de nettoyage anciennes
    cleanupQueue.forEach((queue, guildId) => {
      const filteredQueue = queue.filter(item => (now - item.timestamp) < 300000); // 5 minutes
      if (filteredQueue.length !== queue.length) {
        cleanupQueue.set(guildId, filteredQueue);
        console.log(`[ULTRA_CLEANUP] Cleaned stale cleanup queue items for guild ${guildId}`);
      }
    });
    
    console.log(`[ULTRA_CLEANUP] Cleanup completed - Monitoring: ${channelMonitor.size}, Orphans: ${orphanChannels.size}, Queues: ${cleanupQueue.size}`);
  }, 300000); // Toutes les 5 minutes
  
  console.log('[ULTRA_CLEANUP] ✅ Ultra-robust cleanup system initialized');
}

// 🚀 INITIALISATION AU DÉMARRAGE - Pré-construire les composants
if (PREBUILD_ON_STARTUP) {
  // Attendre un peu que le bot soit prêt, puis pré-construire
  setTimeout(() => {
    prebuildWelcomeComponentsOnStartup();
  }, 2000); // 2 secondes après le démarrage
  
  console.log('[PREBUILD] ✅ Système de pré-construction initialisé');
}

// ✅ Système SMART_DELETION supprimé - plus de conflits
// ✅ Système SMART_DELETION supprimé - plus de conflits
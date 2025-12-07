  const axios = require('axios');
  const { getChannelOwner } = require('../utils/voiceHelper');
  const { 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextDisplayBuilder,
    ContainerBuilder,
    MessageFlags
  } = require('discord.js');
  const { safeGet, safeSet, safeDel, redisEnabled } = require('../redisClient');

  // === FONCTIONS UTILITAIRES DU CODE DE RÉFÉRENCE ===

  // Fonction utilitaire pour répondre rapidement aux interactions
  async function quickReply(interaction, options) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          ...options,
          flags: (options.flags || 0) | MessageFlags.Ephemeral
        });
      } else {
        await interaction.editReply(options);
      }
    } catch (error) {
      if (error.code === 10062) {
        // Interaction expirée, ignorer silencieusement
        return;
      }
      throw error;
    }
  }

  // Fonction pour nettoyer les messages de bienvenue dans le salon textuel
  async function cleanupWelcomeMessages(channelId, guild) {
    try {
      if (!guild) return;
      
      // Trouver le salon textuel correspondant (même nom que le salon vocal)
      const voiceChannel = await guild.channels.fetch(channelId).catch(() => null);
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

  const createEmbed = (desc) =>
    new EmbedBuilder().setDescription(desc).setColor('#f5eee2');

  async function isManagerOf(ownerId, managerId) {
    // Cette fonction devrait utiliser votre système de base de données
    // Pour l'instant, on retourne false
    return false;
  }

  async function getOwnerId(channelId) {
    return await safeGet(`creator:${channelId}`);
  }

  async function isAuthorized(channelId, memberId) {
    const ownerId = await getOwnerId(channelId);
    if (!ownerId) return { authorized: false, ownerId: null };
    const isOwner = ownerId === memberId;
    const isManager = await isManagerOf(ownerId, memberId);
    return { authorized: isOwner || isManager, ownerId, isOwner };
  }

  async function lockChannelSimple(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You must be in a voice channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    const { authorized, ownerId, isOwner } = await isAuthorized(channel.id, interaction.member.id);
    if (!authorized) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You are not authorized to lock this channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    // Vérifier si le salon est déjà verrouillé
    const isLocked = await safeGet(`locked:${channel.id}`) === '1';
    if (isLocked) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> This channel is already locked.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      } catch (error) {
        if (error.code === 10062) {
          return;
        }
        throw error;
      }
    }

    try {
      await Promise.all([
        // Deny @everyone from joining
        voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          Connect: false
        }),
        // Give basic permissions to the user who executed the command (no dangerous permissions)
        voiceChannel.permissionOverwrites.edit(interaction.user.id, {
          ViewChannel: true,
          Connect: true,
          Speak: true,
          UseVAD: true,
          Stream: true,
          UseEmbeddedActivities: true,
          UseExternalEmojis: true,
          UseExternalStickers: true,
          AddReactions: true,
          SendMessages: true,
          UseApplicationCommands: true
        }),
        // Sauvegarder l'état dans Redis
        safeSet(`locked:${channel.id}`, '1')
      ]);

      // Donner les permissions au propriétaire s'il existe et n'est pas l'utilisateur actuel
      if (ownerId && ownerId !== interaction.user.id) {
        const ownerMember = await interaction.guild.members.fetch(ownerId).catch(() => null);
        if (ownerMember) {
          await voiceChannel.permissionOverwrites.edit(ownerMember, {
            ViewChannel: true,
            Connect: true,
            Speak: true,
            UseVAD: true,
            Stream: true,
            UseEmbeddedActivities: true,
            UseExternalEmojis: true,
            UseExternalStickers: true,
            AddReactions: true,
            SendMessages: true,
            UseApplicationCommands: true
          });
        }
      }

      try {
        interaction.reply({
          embeds: [createEmbed('<:controledacces:1400312918695874640> Voice channel locked for everyone except authorized users.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Lock error:', error);
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> Failed to lock the channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }
  }

  async function unlockChannelSimple(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You must be in a voice channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    const { authorized } = await isAuthorized(channel.id, interaction.member.id);
    if (!authorized) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You are not authorized to unlock this channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    // Vérifier si le salon est déjà déverrouillé
    const isLocked = await safeGet(`locked:${channel.id}`) === '1';
    if (!isLocked) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> This channel is not locked.')],
          flags: MessageFlags.Ephemeral,
        });
        return;
      } catch (error) {
        if (error.code === 10062) {
          return;
        }
        throw error;
      }
    }

    try {
      await Promise.all([
        // Allow everyone to connect
        voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          Connect: null
        }),
        // Restore creator's base permissions (without dangerous permissions)
        voiceChannel.permissionOverwrites.edit(interaction.user.id, {
          ViewChannel: true,
        Connect: true,
        Speak: true,
          UseVAD: true,
          Stream: true,
          UseEmbeddedActivities: true,
          UseExternalEmojis: true,
          UseExternalStickers: true,
          AddReactions: true,
          SendMessages: true,
          UseApplicationCommands: true
        }),
        // Remove all permitted users from Redis when unlocking
        safeDel(`locked:${channel.id}`),
        safeDel(`permitted_users:${channel.id}`)
      ]);
      
      try {
        interaction.reply({
          embeds: [createEmbed('<:accesrefuse:1400312914845634653> Voice channel unlocked for everyone.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Unlock error:', error);
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> Failed to unlock the channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }
  }

  async function claimChannelSimple(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You must be in a voice channel to claim it.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    const ownerId = await safeGet(`creator:${channel.id}`);
    if (!ownerId) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> This voice channel is not a temp channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    if (ownerId === interaction.member.id) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You are already the owner of this voice channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    const ownerMember = interaction.guild.members.cache.get(ownerId);
    if (ownerMember && ownerMember.voice.channelId === channel.id) {
      return interaction.reply({
        embeds: [createEmbed(`<:arcadiafalse:1381422467251306496> The current owner <@${ownerId}> is still connected to this channel.`)],
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      await safeSet(`creator:${channel.id}`, interaction.member.id);
      await interaction.reply({
        embeds: [createEmbed(`<:arcadiatrue:1381421969055944707> You have claimed ownership of the voice channel **${voiceChannel.name}**.`)],
        flags: MessageFlags.Ephemeral,
      });
      return; // Important: return après la réponse pour éviter les réponses multiples
    } catch (error) {
      console.error('Claim error:', error);
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> Failed to claim ownership.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }
  }

  async function clearPanelMessages(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You must be in a voice channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    const { authorized } = await isAuthorized(channel.id, interaction.member.id);
    if (!authorized) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You are not authorized to use the trash button.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    try {
      // 🚀 CORRECTION : Utiliser deferReply pour ne pas supprimer le message de bienvenue
      await interaction.deferReply({ ephemeral: true });

      const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
      const messages = fetchedMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const [firstMessage, ...restMessages] = messages.values();
      const deletions = restMessages.map((msg) => msg.delete().catch(() => null));
      await Promise.all(deletions);

      // 🚀 CORRECTION : Utiliser editReply au lieu de reply pour les boutons
      return interaction.editReply({
        embeds: [createEmbed('🗑️ All messages except the control panel were deleted.')],
      });
    } catch (error) {
      console.error('Error clearing messages:', error);
      return interaction.editReply({
        embeds: [createEmbed('<:arcadiafalse:1381422467251306496> Failed to clear messages.')],
      });
    }
  }

  async function openModal(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You must be in a voice channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    const { authorized } = await isAuthorized(channel.id, interaction.member.id);
    if (!authorized) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You are not authorized to use this modal.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    let modal = new ModalBuilder().setCustomId(`${interaction.customId}_modal`);

    if (interaction.customId === 'permit' || interaction.customId === 'deny') {
      modal.setTitle(interaction.customId === 'permit' ? 'Permit a User' : 'Deny a User');

      const userInput = new TextInputBuilder()
        .setCustomId('target_user')
        .setLabel('Enter the user ID or mention')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 123456789012345678 or @username')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(userInput));
    } else if (interaction.customId === 'setVoiceLimit') {
      modal.setTitle('Set Voice Channel User Limit');

      const limitInput = new TextInputBuilder()
        .setCustomId('voice_limit')
        .setLabel('Enter voice channel user limit (0-99)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 10')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
    } else if (interaction.customId === 'name') {
      modal.setTitle('Change Voice Channel Name');

      const nameInput = new TextInputBuilder()
        .setCustomId('voice_name')
        .setLabel('Enter new voice channel name')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. My Voice Channel')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
    }

    return interaction.showModal(modal);
  }

  async function handleFeatureToggle(interaction, permission, enabled, featureName, emoji) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You must be in a voice channel.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    const { authorized } = await isAuthorized(channel.id, interaction.member.id);
    if (!authorized) {
      try {
        interaction.reply({
          embeds: [createEmbed('<:arcadiafalse:1381422467251306496> You are not authorized to use this feature.')],
          flags: MessageFlags.Ephemeral,
        });
        return; // Important: return après la réponse pour éviter les réponses multiples
      } catch (error) {
        if (error.code === 10062) {
          // Interaction expirée, ignorer silencieusement
          return;
        }
        throw error;
      }
    }

    try {
      await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        [permission]: enabled
      });

      const status = enabled ? 'enabled' : 'disabled';
      const statusEmoji = enabled ? '<:arcadiatrue:1381421969055944707>' : '<:arcadiafalse:1381422467251306496>';
      
      await interaction.reply({
        embeds: [createEmbed(`${statusEmoji} ${featureName} has been ${status}.`)],
        flags: MessageFlags.Ephemeral,
      });
      return; // Important: return après la réponse pour éviter les réponses multiples
    } catch (error) {
      console.error(`${featureName} toggle error:`, error);
      await interaction.reply({
        embeds: [createEmbed(`<:arcadiafalse:1381422467251306496> Failed to ${enabled ? 'enable' : 'disable'} ${featureName}.`)],
        flags: MessageFlags.Ephemeral,
      });
      return; // Important: return après la réponse pour éviter les réponses multiples
    }
  }

  module.exports = {
      name: 'interactionCreate',
      async execute(interaction, client) {
          // 🚀 OPTIMISATION ULTRA-RAPIDE - Réponse immédiate pour éviter les timeouts
          const startTime = Date.now();
          
          // Gestion des commandes slash existantes - OPTIMISÉE
          if (interaction.isChatInputCommand()) {
              const command = client.commands.slash.get(interaction.commandName);
              if (!command) return;
              
              // 🚀 CORRECTION : Utiliser deferReply pour ne pas supprimer le message de bienvenue
              if (!interaction.deferred && !interaction.replied) {
                  await interaction.deferReply({ ephemeral: true });
              }
              
              try {
                  await command.execute(interaction);
              } catch (error) {
                  console.error(error);
                  try {
                    if (!interaction.replied) {
                        await quickReply(interaction, { content: 'There was an error executing that command.' });
                    }
                    return;
                  } catch (error) {
                    if (error.code === 10062) {
                      return;
                    }
                    throw error;
                  }
              }
              return;
          }

          // === Gestion des commandes simples (comme dans le code de référence) ===
          if (interaction.isCommand()) {
            switch (interaction.commandName) {
              case 'lock': return lockChannelSimple(interaction);
              case 'unlock': return unlockChannelSimple(interaction);
              case 'claim': return claimChannelSimple(interaction);
              case 'permit':
              case 'deny':
              case 'setVoiceLimit':
              case 'name':
                return openModal(interaction);
              default:
                return;
            }
          }

          // === Gestion des boutons simples (comme dans le code de référence) ===
          if (interaction.isButton()) {
            const { customId } = interaction;

            if ([
              'lock', 'unlock', 'claim', 'permit', 'deny', 'setVoiceLimit', 'name', 'trash',
              'activities_on', 'activities_off',
              'camera_on', 'camera_off',
              'soundboard_on', 'soundboard_off'
            ].includes(customId)) {

              switch (customId) {
                case 'lock': return lockChannelSimple(interaction);
                case 'unlock': return unlockChannelSimple(interaction);
                case 'claim': return claimChannelSimple(interaction);
                case 'permit':
                case 'deny':
                case 'setVoiceLimit':
                case 'name':
                  return openModal(interaction);
                case 'trash': return clearPanelMessages(interaction);

                case 'activities_on':
                  return handleFeatureToggle(
                    interaction,
                    PermissionFlagsBits.UseEmbeddedActivities,
                    true,
                    'Activities',
                    '<:arcadiaactivities:1381390452304545822>'
                  );
                case 'activities_off':
                  return handleFeatureToggle(
                    interaction,
                    PermissionFlagsBits.UseEmbeddedActivities,
                    false,
                    'Activities',
                    '<:arcadiaactivities:1381390452304545822>'
                  );
                case 'camera_on':
                  return handleFeatureToggle(
                    interaction,
                    PermissionFlagsBits.UseVAD,
                    true,
                    'Camera',
                    '<:arcadiacamon:1384185720293560451>'
                  );
                case 'camera_off':
                  return handleFeatureToggle(
                    interaction,
                    PermissionFlagsBits.UseVAD,
                    false,
                    'Camera',
                    '<:arcadiacamoff:1384186030592102461>'
                  );
                case 'soundboard_on':
                  return handleFeatureToggle(
                    interaction,
                    PermissionFlagsBits.UseSoundboard,
                    true,
                    'Soundboard',
                    '<:arcadiasbon:1384183874405273681>'
                  );
                case 'soundboard_off':
                  return handleFeatureToggle(
                    interaction,
                    PermissionFlagsBits.UseSoundboard,
                    false,
                    'Soundboard',
                    '<:arcadiasboff:1384185071304445963>'
                  );
              }
            }
          }

          // ✅ BOUTONS TRASH ET DENY SUPPRIMÉS : Ces boutons ont été retirés du message de bienvenue

          // === Gestion des boutons de gestion de salon vocal - OPTIMISÉE ULTRA-RAPIDE ===
          if (interaction.isButton() && interaction.customId.startsWith('vc_')) {
              // 🚀 CORRECTION : Pas de deferReply pour éviter "le bot réfléchit"
              // On va répondre directement avec reply() pour une réponse instantanée

              // Format: vc_action_channelId
              const parts = interaction.customId.split('_');
              const action = parts[1]; // lock, unlock, etc.
              const channelId = parts[2]; // ID du salon
              
              // 🛡️ VÉRIFICATION ROBUSTE : S'assurer que le salon existe encore
              let channel;
              try {
                channel = await interaction.guild.channels.fetch(channelId);
                if (!channel) {
                  const errorText = new TextDisplayBuilder().setContent(`### ❌ **Channel Not Found**
> **The voice channel no longer exists.**
> **Please try again or contact support if the issue persists.**`);

                  const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(errorText);

                  await quickReply(interaction, { 
                    flags: MessageFlags.IsComponentsV2,
                    components: [errorContainer]
                  });
                  return;
                }
              } catch (fetchError) {
                const errorText = new TextDisplayBuilder().setContent(`### ❌ **Channel Not Found**
> **The voice channel no longer exists.**
> **Please try again or contact support if the issue persists.**`);

                const errorContainer = new ContainerBuilder()
                  .addTextDisplayComponents(errorText);

                await quickReply(interaction, { 
                  flags: MessageFlags.IsComponentsV2,
                  components: [errorContainer]
                });
                return;
              }
              
              console.log(`[BUTTON DEBUG] CustomId: ${interaction.customId}, Parts: ${parts.join(', ')}, Action: ${action}, ChannelId: ${channelId}`);
              
              console.log(`[BUTTON] Action: ${action}, Channel: ${channelId}`);

              // ✅ Channel déjà récupéré avec vérification robuste ci-dessus
              // ✅ Channel déjà vérifié et récupéré avec fetch() ci-dessus

              // Pour tous les boutons SAUF 'transfer', 'lock', 'unlock', on vérifie que l'utilisateur est owner, manager ou premium
              // Note: 'hide' et 'unhide' ont leur propre vérification premium dans leurs cases spécifiques
              if (action !== 'transfer' && action !== 'lock' && action !== 'unlock') {
                const ownerId = await safeGet(`creator:${channelId}`);
                const { isOwnerOrManager } = require('../utils/voiceHelper');
                const premiumManager = require('../utils/premiumManager');
                const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
                const hasPremium = await premiumManager.hasPremiumAccess(interaction.guild.id, interaction.user.id);
                
                if (!hasPermission && !hasPremium) {
                  // Discord Components V2 - Premium feature required
                  const premiumText = new TextDisplayBuilder()
                    .setContent(`### ⚠️ **Premium Feature Required**
> **<@${interaction.user.id}> This is a premium feature!**
> **Only channel owners, managers, or users with premium access can use these buttons.**
> **💎 Ask an administrator to give you premium access**`);

                  const premiumContainer = new ContainerBuilder()
                    .addTextDisplayComponents(premiumText);

                    try {
                      interaction.reply({ 
                        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                        components: [premiumContainer]
                      });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                }
              }

              switch (action) {
                case 'lock': {
                  // === LOGIQUE EXACTE DE LA COMMANDE .v lock ===
                  console.log(`[VC_LOCK] Button executed by ${interaction.user.tag} (${interaction.user.id})`);
                  
                  // Vérifier que l'utilisateur est dans le salon spécifié par le bouton
                  if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== channelId) {
                    const titleText = new TextDisplayBuilder()
                      .setContent('# ⚠️ Wrong Voice Channel');
                        
                    const errorText = new TextDisplayBuilder()
                      .setContent(`
> **You must be in the voice channel to control it!**

**What to do:**
• Join the voice channel <#${channelId}>
• Make sure you're connected to the correct voice channel
• Then use the lock button again

**Available Commands:**
• \`.v lock\` - Lock your voice channel
• \`.v unlock\` - Unlock your voice channel
• \`.v showsetup\` - Show channel control panel
                      `);
                        
                    const footerText = new TextDisplayBuilder()
                      .setContent('OneTab - Voice management | Join the correct voice channel to continue');

                    const container = new ContainerBuilder()
                      .addTextDisplayComponents(titleText, errorText, footerText);

                    try {
                      await quickReply(interaction, {
                        flags: MessageFlags.IsComponentsV2,
                        components: [container]
                      });
                      return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }

                  // Utiliser le salon spécifié dans le bouton, pas le salon de l'utilisateur
                  const voiceChannel = channel; // channel est déjà récupéré avec l'ID du bouton

                  // Vérifier que c'est un salon créé par le bot
                  console.log(`[VC_LOCK] Checking if channel ${channel.id} is bot-created`);
                  const { isBotCreatedChannel } = require('../utils/voiceHelper');
                  const isBotChannel = await isBotCreatedChannel(channel.id);
                  console.log(`[VC_LOCK] Is bot channel: ${isBotChannel}`);
                  if (!isBotChannel) {
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

                    try {
                      await quickReply(interaction, {
                        flags: MessageFlags.IsComponentsV2,
                        components: [container]
                      });
                      return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }

                  // Vérifier les permissions (propriétaire ou manager)
                  console.log(`[VC_LOCK] Checking permissions for user ${interaction.user.id}`);
                  const { isOwnerOrManager } = require('../utils/voiceHelper');
                  const hasPermission = await isOwnerOrManager(channel.id, interaction.user.id);
                  console.log(`[VC_LOCK] Has permission: ${hasPermission}`);
                  if (!hasPermission) {
                    const errorText = new TextDisplayBuilder()
                      .setContent(`### ⚠️ **Permission Denied**
> **<@${interaction.user.id}> Only the channel owner can lock the channel!**
> **You must be the owner of this voice channel to lock it.**`);

                    const errorContainer = new ContainerBuilder()
                      .addTextDisplayComponents(errorText);

                    try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [errorContainer]
                      });
                      return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }

                  const everyoneRole = interaction.guild.roles.everyone;
                  console.log(`[VC_LOCK] Checking if channel is already locked`);
                  const isLocked = await safeGet(`locked:${channel.id}`) === '1';
                  console.log(`[VC_LOCK] Is already locked: ${isLocked}`);

                  if (isLocked) {
                    const alreadyLockedText = new TextDisplayBuilder()
                      .setContent(`### ⚠️ **Channel Already Locked**
> **<@${interaction.user.id}> This channel is already locked.**
> **Use the unlock button to unlock it.**`);

                    const alreadyLockedContainer = new ContainerBuilder()
                      .addTextDisplayComponents(alreadyLockedText);

                    try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [alreadyLockedContainer]
                      });
                        return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }

                  try {
                    console.log(`[VC_LOCK] Starting lock process for channel ${channel.id} by user ${interaction.user.id}`);
                    
                    // Get current permissions to preserve ViewChannel state
                    const currentOverwrites = voiceChannel.permissionOverwrites.cache.get(everyoneRole.id);
                    const currentViewChannel = currentOverwrites ? currentOverwrites.deny.has(PermissionFlagsBits.ViewChannel) : false;
                    
                    console.log(`[VC_LOCK] Setting permissions for @everyone and user ${interaction.user.id}`);

                  await Promise.all([
                    // Deny @everyone from joining
                      voiceChannel.permissionOverwrites.edit(everyoneRole, {
                      Connect: false
                    }),
                      // Give basic permissions to the user who executed the command (no dangerous permissions)
                      voiceChannel.permissionOverwrites.edit(interaction.user.id, {
                      ViewChannel: true,
                      Connect: true,
                      Speak: true,
                      UseVAD: true,
                      Stream: true,
                      UseEmbeddedActivities: true,
                      UseExternalEmojis: true,
                      UseExternalStickers: true,
                      AddReactions: true,
                      SendMessages: true,
                      UseApplicationCommands: true
                    }),
                      safeSet(`locked:${channel.id}`, '1')
                  ]);

                    console.log(`[VC_LOCK] Permissions set successfully, sending confirmation message`);
                  const successText = new TextDisplayBuilder()
                    .setContent(`### ✅ **Channel Locked Successfully**
> **<@${interaction.user.id}> The channel has been locked successfully.**
> **Only authorized users can now join this channel.**`);

                  const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successText);

                  try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                      components: [successContainer]
                    });
                      return;
                  } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  } catch (err) {
                    console.error('[VC_LOCK] Error in lock button:', err);
                    console.error('[VC_LOCK] Error details:', {
                      channelId: voiceChannel?.id,
                      userId: interaction.user?.id,
                      error: err.message,
                      stack: err.stack
                    });
                    
                    const errorText = new TextDisplayBuilder()
                      .setContent(`### ❌ **Failed to Lock Channel**
> **<@${interaction.user.id}> Failed to lock the channel!**
> **Please try again or contact support if the issue persists.**`);

                    const errorContainer = new ContainerBuilder()
                      .addTextDisplayComponents(errorText);

                    try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [errorContainer]
                      });
                      return;
                    } catch (replyError) {
                      console.error('[VC_LOCK] Failed to send error message:', replyError);
                      if (replyError.code === 10062) return;
                      throw replyError;
                    }
                  }
                }

                case 'unlock': {
                  // === LOGIQUE EXACTE DE LA COMMANDE .v unlock ===
                  console.log(`[VC_UNLOCK] Button executed by ${interaction.user.tag} (${interaction.user.id})`);
                  
                  // Vérifier que l'utilisateur est dans le salon spécifié par le bouton
                  if (!interaction.member.voice.channel || interaction.member.voice.channel.id !== channelId) {
                    const titleText = new TextDisplayBuilder()
                      .setContent('# ⚠️ Wrong Voice Channel');
                        
                    const errorText = new TextDisplayBuilder()
                      .setContent(`
> **You must be in the voice channel to control it!**

**What to do:**
• Join the voice channel <#${channelId}>
• Make sure you're connected to the correct voice channel
• Then use the unlock button again

**Available Commands:**
• \`.v lock\` - Lock your voice channel
• \`.v unlock\` - Unlock your voice channel
• \`.v showsetup\` - Show channel control panel
                      `);
                        
                    const footerText = new TextDisplayBuilder()
                      .setContent('OneTab - Voice management | Join a voice channel to continue');

                    const container = new ContainerBuilder()
                      .addTextDisplayComponents(titleText, errorText, footerText);

                    try {
                      await quickReply(interaction, {
                        flags: MessageFlags.IsComponentsV2,
                        components: [container]
                      });
                      return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }

                  // Utiliser le salon spécifié dans le bouton, pas le salon de l'utilisateur
                  const voiceChannel = channel; // channel est déjà récupéré avec l'ID du bouton

                  // Vérifier que c'est un salon créé par le bot
                  console.log(`[VC_UNLOCK] Checking if channel ${channel.id} is bot-created`);
                  const { isBotCreatedChannel } = require('../utils/voiceHelper');
                  const isBotChannel = await isBotCreatedChannel(channel.id);
                  console.log(`[VC_UNLOCK] Is bot channel: ${isBotChannel}`);
                  if (!isBotChannel) {
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

                    try {
                      await quickReply(interaction, {
                        flags: MessageFlags.IsComponentsV2,
                        components: [container]
                      });
                      return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }

                  // Vérifier les permissions (propriétaire ou manager)
                  console.log(`[VC_UNLOCK] Checking permissions for user ${interaction.user.id}`);
                  const { isOwnerOrManager } = require('../utils/voiceHelper');
                  const hasPermission = await isOwnerOrManager(channel.id, interaction.user.id);
                  console.log(`[VC_UNLOCK] Has permission: ${hasPermission}`);
                  if (!hasPermission) {
                    const errorText = new TextDisplayBuilder()
                      .setContent(`### ⚠️ **Permission Denied**
> **<@${interaction.user.id}> Only the channel owner can unlock the channel!**
> **You must be the owner of this voice channel to unlock it.**`);

                    const errorContainer = new ContainerBuilder()
                      .addTextDisplayComponents(errorText);

                    try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [errorContainer]
                      });
                      return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }

                  const everyoneRole = interaction.guild.roles.everyone;
                  const isLocked = await safeGet(`locked:${channel.id}`) === '1';

                  if (!isLocked) {
                    const notLockedText = new TextDisplayBuilder()
                      .setContent(`### ⚠️ **Channel Not Locked**
> **<@${interaction.user.id}> This channel is not locked.**
> **Use the lock button to lock it.**`);

                    const notLockedContainer = new ContainerBuilder()
                      .addTextDisplayComponents(notLockedText);

                    try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [notLockedContainer]
                      });
                        return;
                    } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  }
                  
                  try {
                    console.log(`[VC_UNLOCK] Starting unlock process for channel ${channel.id} by user ${interaction.user.id}`);

                  await Promise.all([
                    // Allow everyone to connect
                      voiceChannel.permissionOverwrites.edit(everyoneRole, {
                      Connect: null
                    }),
                    // Restore creator's base permissions (without dangerous permissions)
                      voiceChannel.permissionOverwrites.edit(interaction.user.id, {
                      ViewChannel: true,
                      Connect: true,
                      Speak: true,
                      UseVAD: true,
                      Stream: true,
                      UseEmbeddedActivities: true,
                      UseExternalEmojis: true,
                      UseExternalStickers: true,
                      AddReactions: true,
                      SendMessages: true,
                      UseApplicationCommands: true
                    }),
                    // Remove all permitted users from Redis when unlocking
                      safeDel(`locked:${channel.id}`),
                      safeDel(`permitted_users:${channel.id}`)
                  ]);

                    console.log(`[VC_UNLOCK] Permissions restored successfully, sending confirmation message`);
                  const successText = new TextDisplayBuilder()
                    .setContent(`### ✅ **Channel Unlocked Successfully**
> **<@${interaction.user.id}> The channel has been unlocked successfully.**
> **Everyone can now join this channel.**`);

                  const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successText);

                  try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                      components: [successContainer]
                    });
                      return;
                  } catch (error) {
                      if (error.code === 10062) return;
                      throw error;
                    }
                  } catch (err) {
                    console.error('[VC_UNLOCK] Error in unlock button:', err);
                    console.error('[VC_UNLOCK] Error details:', {
                      channelId: voiceChannel?.id,
                      userId: interaction.user?.id,
                      error: err.message,
                      stack: err.stack
                    });
                    
                    const errorText = new TextDisplayBuilder()
                      .setContent(`### ❌ **Failed to Unlock Channel**
> **<@${interaction.user.id}> Failed to unlock the channel.**
> **Please try again or contact support if the issue persists.**`);

                    const errorContainer = new ContainerBuilder()
                      .addTextDisplayComponents(errorText);

                    try {
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [errorContainer]
                      });
                      return;
                    } catch (replyError) {
                      console.error('[VC_UNLOCK] Failed to send error message:', replyError);
                      if (replyError.code === 10062) return;
                      throw replyError;
                    }
                  }
                }

                case 'rename': {
                  const modal = new ModalBuilder()
                    .setCustomId(`rename_modal_${channelId}`)
                    .setTitle('Rename Channel');

                  const nameInput = new TextInputBuilder()
                    .setCustomId('new_name')
                    .setLabel('New channel name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100);

                  const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
                  modal.addComponents(firstActionRow);

                  return interaction.showModal(modal);
                }

                case 'transfer': {
                  // Logique similaire à .v claim
                  const currentOwnerId = await safeGet(`creator:${channelId}`);
                  // Si il y a un owner et qu'il est encore dans le salon, refuse
                  if (currentOwnerId && channel.members.has(currentOwnerId)) {
                    const errorText = new TextDisplayBuilder()
                      .setContent(`### ⚠️ **Channel Already Has Owner**
> **<@${interaction.user.id}> This channel already has an active owner!**
> **Current owner: <@${currentOwnerId}>**
> **Only the current owner can manage this channel.**`);

                    const errorContainer = new ContainerBuilder()
                      .addTextDisplayComponents(errorText);

                    await quickReply(interaction, { 
                      flags: MessageFlags.IsComponentsV2,
                      components: [errorContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  }
                  // Sinon, assigne l'ownership à l'utilisateur
                  await safeSet(`creator:${channelId}`, interaction.user.id);
                  await channel.permissionOverwrites.edit(interaction.user.id, {
                    Connect: true,
                    ViewChannel: true
                  });
                  const successText = new TextDisplayBuilder()
                    .setContent(`### ✅ **Channel Ownership Transferred**
> **<@${interaction.user.id}> You are now the owner of this channel!**
> **You can now manage all channel settings and permissions.**`);

                  const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successText);

                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { 
                      flags: MessageFlags.IsComponentsV2,
                      components: [successContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
                }

                case 'kick': {
                  const modal = new ModalBuilder()
                    .setCustomId(`kick_modal_${channelId}`)
                    .setTitle('Kick a User');

                  const userIdInput = new TextInputBuilder()
                    .setCustomId('user_id')
                    .setLabel('User ID to kick')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('123456789012345678');

                  const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
                  modal.addComponents(firstActionRow);

                  return interaction.showModal(modal);
                }

                case 'mute': {
                  // Check ownership or manager status
                  const { isOwnerOrManager } = require('../utils/voiceHelper');
                  const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
                  if (!hasPermission) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner or managers can use this button!`)
                      .setColor('#FEE75C')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }

                  // Mute all users using channel permissions (like .v fm command)
                  const membersToMute = channel.members;
                  if (membersToMute.size === 0) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Aucun membre dans le salon.`)
                      .setColor('#FEE75C')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }

                  try {
                    // Set channel permissions to mute everyone (channel-specific only)
                    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                      Speak: false
                    });

                    // Store mute state in Redis for auto-muting new users
                    const { redis } = require('../redisClient');
                    await redis.set(`mute_state:${channelId}`, 'true', 'EX', 86400); // 24 hours

                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> Muted ${membersToMute.size} user(s) in <#${channelId}>.`)
                      .setColor('#57F287')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  } catch (err) {
                    console.error(err);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Failed to mute users in the voice channel.`)
                      .setColor('#ED4245')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }
                }

                case 'unmute': {
                  // Check ownership or manager status
                  const { isOwnerOrManager } = require('../utils/voiceHelper');
                  const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
                  if (!hasPermission) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner or managers can use this button!`)
                      .setColor('#FEE75C')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }

                  // Unmute all users using channel permissions (like .v funm command)
                  const membersToUnmute = channel.members;
                  if (membersToUnmute.size === 0) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Aucun membre dans le salon.`)
                      .setColor('#FEE75C')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }

                  try {
                    // Reset channel permissions to allow speaking (channel-specific only)
                    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
                      Speak: null
                    });
                    
                    // Remove individual mute permissions for all members
                    for (const [memberId, member] of membersToUnmute) {
                      try {
                        await channel.permissionOverwrites.delete(member);
                      } catch (error) {
                        console.error(`[UNMUTE] Failed to remove permissions for ${member.user.username}:`, error.message);
                      }
                    }
                    
                    // Clear mute state to disable auto-mute
                    const { redis } = require('../redisClient');
                    await redis.del(`mute_state:${channelId}`);
                    
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> ${membersToUnmute.size} utilisateur(s) ont été démuté(s) dans <#${channelId}>.`)
                      .setColor('#5865F2')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  } catch (error) {
                    console.error('[UNMUTE] Error:', error);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Erreur lors du démutage. Vérifiez les permissions du bot.`)
                      .setColor('#ED4245')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }
                }

                case 'limit': {
                  const modal = new ModalBuilder()
                    .setCustomId(`limit_modal_${channelId}`)
                    .setTitle('Set User Limit');

                  const limitInput = new TextInputBuilder()
                    .setCustomId('user_limit')
                    .setLabel('User limit (0-99)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('10');

                  const firstActionRow = new ActionRowBuilder().addComponents(limitInput);
                  modal.addComponents(firstActionRow);

                  return interaction.showModal(modal);
                }

                case 'hide': {
                  // Check premium access for hide/unhide buttons (PREMIUM ONLY - NO EXCEPTIONS)
                  const premiumManager = require('../utils/premiumManager');
                  const hasPremium = await premiumManager.hasPremiumAccess(interaction.guild.id, interaction.user.id);
                  
                  if (!hasPremium) {
                    const premiumText = new TextDisplayBuilder()
                      .setContent(`### ⚠️ **Premium Feature Required**
> **<@${interaction.user.id}> This is a premium feature!**
> **Only users with premium access can use this button.**
> **💎 Ask an administrator to give you premium access**`);

                    const premiumContainer = new ContainerBuilder()
                      .addTextDisplayComponents(premiumText);

                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [premiumContainer]
                      });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }

                  // Get current permissions to preserve Connect state
                  const currentOverwrites = channel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);
                  const currentConnect = currentOverwrites ? currentOverwrites.deny.has(PermissionFlagsBits.Connect) : false;
                  
                  // Save current lock state before hiding
                  const isLocked = await safeGet(`locked:${channelId}`) === '1';
                  if (isLocked) {
                    await safeSet(`hidden_lock_state:${channelId}`, '1', 'EX', 86400); // 24 hours
                  }
                  
                  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    ViewChannel: false,
                    Connect: currentConnect // Preserve current Connect state
                  });
                  await safeSet(`hidden:${channelId}`, '1');

                  const successText = new TextDisplayBuilder()
                    .setContent(`### ✅ **Channel Hidden Successfully**
> **<@${interaction.user.id}> The channel has been hidden successfully.**
> **Only authorized users can now see this channel.**`);

                  const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successText);

                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { 
                      flags: MessageFlags.IsComponentsV2,
                      components: [successContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
                }

                case 'unhide': {
                  // Check premium access for hide/unhide buttons (PREMIUM ONLY - NO EXCEPTIONS)
                  const premiumManager = require('../utils/premiumManager');
                  const hasPremium = await premiumManager.hasPremiumAccess(interaction.guild.id, interaction.user.id);
                  
                  if (!hasPremium) {
                    const premiumText = new TextDisplayBuilder()
                      .setContent(`### ⚠️ **Premium Feature Required**
> **<@${interaction.user.id}> This is a premium feature!**
> **Only users with premium access can use this button.**
> **💎 Ask an administrator to give you premium access**`);

                    const premiumContainer = new ContainerBuilder()
                      .addTextDisplayComponents(premiumText);

                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { 
                        flags: MessageFlags.IsComponentsV2,
                        components: [premiumContainer]
                      });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }

                  // Get current permissions to preserve Connect state
                  const currentOverwrites = channel.permissionOverwrites.cache.get(interaction.guild.roles.everyone.id);
                  const currentConnect = currentOverwrites ? currentOverwrites.deny.has(PermissionFlagsBits.Connect) : false;
                  
                  // Check if we need to restore lock state
                  const wasLocked = await safeGet(`hidden_lock_state:${channelId}`) === '1';
                  
                  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                    ViewChannel: null,
                    Connect: wasLocked ? false : (currentConnect ? false : null) // Restore lock state if it was locked
                  });
                  await safeDel(`hidden:${channelId}`);
                  if (wasLocked) {
                    await safeSet(`locked:${channelId}`, '1');
                  }
                  await safeDel(`hidden_lock_state:${channelId}`);

                  const successText = new TextDisplayBuilder()
                    .setContent(`### ✅ **Channel Unhidden Successfully**
> **<@${interaction.user.id}> The channel has been unhidden successfully.**
> **The channel is now visible to everyone again.**`);

                  const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successText);

                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { 
                      flags: MessageFlags.IsComponentsV2,
                      components: [successContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
                }

                case 'reset': {
                  await channel.permissionOverwrites.set([]);
                  await safeDel(`locked:${channelId}`, `hidden:${channelId}`, `limit:${channelId}`);

                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'skz_rayan23', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> All permissions have been reset.`)
                    .setColor('#5865F2')
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
                }

                case 'sb': {
                  const isEnabled = await safeGet(`soundboard:${channelId}`) === '1';
                  if (isEnabled) {
                    // Disable soundboard
                    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                      UseSoundboard: false
                    });
                    await safeDel(`soundboard:${channelId}`);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> The soundboard has been disabled.`)
                      .setColor('#5865F2')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  } else {
                    // Enable soundboard
                    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                      UseSoundboard: true
                    });
                    await safeSet(`soundboard:${channelId}`, '1');
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> The soundboard has been enabled.`)
                      .setColor('#5865F2')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }
                }

                case 'cam': {
                  const isEnabled = await safeGet(`camera:${channelId}`) === '1';
                  if (isEnabled) {
                    await safeDel(`camera:${channelId}`);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Camera has been disabled.`)
                      .setColor('#5865F2')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  } else {
                    await safeSet(`camera:${channelId}`, '1');
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> Camera has been enabled.`)
                      .setColor('#5865F2')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }
                }

                case 'clear': {
                  const members = channel.members.filter(m => !m.user.bot && m.id !== interaction.user.id);
                  let kickedCount = 0;

                  for (const [_, member] of members) {
                    try {
                      // Vérifier que l'utilisateur est toujours connecté avant de le déconnecter
                      if (!member.voice?.channelId || member.voice.channelId !== channel.id) {
                        console.log(`[INTERACTION_CLEAR] User ${member.user.tag} is no longer in the voice channel`);
                        continue;
                      }
                      
                      await member.voice.disconnect();
                      kickedCount++;
                    } catch (error) {
                      console.error(`[INTERACTION_CLEAR] Failed to kick ${member.user.tag}:`, error);
                      
                      // Gérer spécifiquement l'erreur 40032
                      if (error.code === 40032 || error.message?.includes('Target user is not connected to voice')) {
                        console.log(`[INTERACTION_CLEAR] User ${member.user.tag} disconnected before clear operation`);
                      }
                    }
                  }

                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'skz_rayan23', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> ${kickedCount} user(s) have been kicked from the channel.`)
                    .setColor('#5865F2')
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
                }

                case 'status': {
                  // Ouvrir le modal pour définir un statut
                  const modal = new ModalBuilder()
                    .setCustomId(`status_modal_${channelId}`)
                    .setTitle('Set Channel Status');

                  const statusInput = new TextInputBuilder()
                    .setCustomId('status_text')
                    .setLabel('Channel status')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setPlaceholder('Example: 🎮 Gaming or just Gaming')
                    .setMaxLength(100);

                  const firstActionRow = new ActionRowBuilder().addComponents(statusInput);
                  modal.addComponents(firstActionRow);

                  console.log(`[BUTTON STATUS] Opening modal to set status for channel ${channelId}`);
                  return interaction.showModal(modal);
                }

                case 'settings': {
                  const status = await safeGet(`status:${channelId}`) || 'None';
                  const limit = channel.userLimit || 'Unlimited';
                  const locked = (await safeGet(`locked:${channelId}`)) === '1' ? 'Yes' : 'No';
                  const user = interaction.user;
                  const embed = new EmbedBuilder()
                    .setTitle('⚙️ Channel Settings')
                    .setDescription('Here are the **current** settings of your voice channel...\n\nUse the other buttons to modify these settings in real-time!')
                    .addFields(
                      { name: '📝 Status', value: status.toString(), inline: true },
                      { name: '👥 User Limit', value: limit.toString(), inline: true },
                      { name: '🔒 Locked', value: locked, inline: true },
                    )
                    .addFields([
                      { name: 'ℹ️ Tip', value: '• Use the buttons below to **rename**, **lock**, **hide** or **change the status** of your channel!\n• For more options, click on the other buttons.' }
                    ])
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setColor('#00B2FF')
                    .setFooter({ text: `Owner: ${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
                }

                // === NOUVEAUX BOUTONS DISCORD COMPONENTS V2 ===
                case 'claim': {
                  // Logique similaire à 'transfer' mais pour claim
                  const currentOwnerId = await safeGet(`creator:${channelId}`);
                  if (currentOwnerId && channel.members.has(currentOwnerId)) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> This channel already has an active owner!\nCurrent owner: <@${currentOwnerId}>`)
                      .setColor('#FEE75C')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }
                  
                  await safeSet(`creator:${channelId}`, interaction.user.id);
                  await channel.permissionOverwrites.edit(interaction.user.id, {
                    Connect: true,
                    ViewChannel: true
                  });
                  
                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'skz_rayan23', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> You have claimed ownership of this channel!`)
                    .setColor('#57F287')
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
                }

                case 'permit': {
                  const modal = new ModalBuilder()
                    .setCustomId(`permit_modal_${channelId}`)
                    .setTitle('Permit User Access');

                  const userIdInput = new TextInputBuilder()
                    .setCustomId('user_id')
                    .setLabel('User ID to permit')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('123456789012345678');

                  const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
                  modal.addComponents(firstActionRow);

                  return interaction.showModal(modal);
                }

                case 'deny': {
                  const modal = new ModalBuilder()
                    .setCustomId(`deny_modal_${channelId}`)
                    .setTitle('Deny User Access');

                  const userIdInput = new TextInputBuilder()
                    .setCustomId('user_id')
                    .setLabel('User ID to deny')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setPlaceholder('123456789012345678');

                  const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
                  modal.addComponents(firstActionRow);

                  return interaction.showModal(modal);
                }

                case 'trash': {
                  // Vérifier que l'utilisateur est le propriétaire
                  const ownerId = await safeGet(`creator:${channelId}`);
                  if (ownerId !== interaction.user.id) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner can delete this channel!`)
                      .setColor('#FEE75C')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }

                  try {
                    // 🧹 NETTOYAGE DES MESSAGES DE BIENVENUE avant suppression
                    await cleanupWelcomeMessages(channelId, interaction.guild);
                    
                    await channel.delete('Channel deleted by owner via button');
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> Channel has been deleted successfully.`)
                      .setColor('#57F287')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  } catch (error) {
                    console.error('[TRASH] Error deleting channel:', error);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'skz_rayan23', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`❌ <@${interaction.user.id}> Failed to delete the channel.`)
                      .setColor('#ED4245')
                    try {
                      // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                      await quickReply(interaction, { embeds: [embed] });
                      return; // Important: return après la réponse pour éviter les réponses multiples
                    } catch (error) {
                      if (error.code === 10062) {
                        // Interaction expirée, ignorer silencieusement
                        return;
                      }
                      throw error;
                    }
                  }
                }

                case 'name': {
                  // Utiliser la même logique que 'rename'
                  const modal = new ModalBuilder()
                    .setCustomId(`rename_modal_${channelId}`)
                    .setTitle('Rename Channel');

                  const nameInput = new TextInputBuilder()
                    .setCustomId('new_name')
                    .setLabel('New channel name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100);

                  const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
                  modal.addComponents(firstActionRow);

                  return interaction.showModal(modal);
                }

                default:
                  const embed = new EmbedBuilder()
                    .setTitle('❌ Unknown action')
                    .setDescription('This action is not recognized.')
                    .setColor('#ED4245')
                    .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }


          // === Gestion du menu de sélection Discord Components V2 ===
          if (interaction.isStringSelectMenu() && (interaction.customId.startsWith('vc_features_') || interaction.customId === 'features_menu')) {
            let channelId;
            let channel;
            
            if (interaction.customId === 'features_menu') {
              // Pour le menu simple, utiliser le salon vocal de l'utilisateur
              const voiceChannel = interaction.member.voice.channel;
              if (!voiceChannel) {
                const embed = new EmbedBuilder()
                  .setTitle('❌ Voice channel required')
                  .setDescription('You must be in a voice channel to use this feature.')
                  .setColor('#ED4245')
                  .setFooter({ text: 'OneTab - Voice management' });
                try {
                  // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                  await quickReply(interaction, { embeds: [embed] });
                  return; // Important: return après la réponse pour éviter les réponses multiples
                } catch (error) {
                  if (error.code === 10062) {
                    // Interaction expirée, ignorer silencieusement
                    return;
                  }
                  throw error;
                }
              }
              channelId = channel.id;
              channel = voiceChannel;
            } else {
              // Pour le menu avec préfixe vc_features_
              channelId = interaction.customId.replace('vc_features_', '');
              try {
                channel = await interaction.guild.channels.fetch(channelId);
              } catch (fetchError) {
                channel = null;
              }
            }
            
            if (!channel) {
              const embed = new EmbedBuilder()
                .setTitle('❌ Channel not found')
                .setDescription('The voice channel no longer exists.')
                .setColor('#ED4245')
                .setFooter({ text: 'OneTab - Voice management' });
              try {

                try {
                  // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                  await quickReply(interaction, { embeds: [embed] });
                  return; // Important: return après la réponse pour éviter les réponses multiples
 } catch (error) {
   if (error.code === 10062) {
     // Interaction expirée, ignorer silencieusement
     return;
   }
   throw error;
 }

              } catch (error) {

                if (error.code === 10062) {

                  // Interaction expirée, ignorer silencieusement

                  return;

                }

                throw error;

              }
            }

            // Vérifier les permissions
            const { isOwnerOrManager } = require('../utils/voiceHelper');
            const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
            if (!hasPermission) {
              const embed = new EmbedBuilder()
                .setAuthor({ 
                  name: 'skz_rayan23', 
                  iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                })
                .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner or managers can use this feature!`)
                .setColor('#FEE75C')
              try {

                try {
                  // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                  await quickReply(interaction, { embeds: [embed] });
                  return; // Important: return après la réponse pour éviter les réponses multiples
 } catch (error) {
   if (error.code === 10062) {
     // Interaction expirée, ignorer silencieusement
     return;
   }
   throw error;
 }

              } catch (error) {

                if (error.code === 10062) {

                  // Interaction expirée, ignorer silencieusement

                  return;

                }

                throw error;

              }
            }

            const selectedValue = interaction.values[0];
            let embed;

            switch (selectedValue) {
              case 'soundboard_on':
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                  UseSoundboard: true
                });
                await safeSet(`soundboard:${channelId}`, '1');
                embed = new EmbedBuilder()
                  .setAuthor({ 
                    name: 'skz_rayan23', 
                    iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                  })
                  .setDescription(`✅ <@${interaction.user.id}> Soundboard has been enabled.`)
                  .setColor('#57F287');
                break;

              case 'soundboard_off':
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                  UseSoundboard: false
                });
                await safeDel(`soundboard:${channelId}`);
                embed = new EmbedBuilder()
                  .setAuthor({ 
                    name: 'skz_rayan23', 
                    iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                  })
                  .setDescription(`⚠️ <@${interaction.user.id}> Soundboard has been disabled.`)
                  .setColor('#FEE75C');
                break;

              case 'camera_on':
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                  UseVAD: true
                });
                await safeSet(`camera:${channelId}`, '1');
                embed = new EmbedBuilder()
                  .setAuthor({ 
                    name: 'skz_rayan23', 
                    iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                  })
                  .setDescription(`✅ <@${interaction.user.id}> Camera has been enabled.`)
                  .setColor('#57F287');
                break;

              case 'camera_off':
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                  UseVAD: false
                });
                await safeDel(`camera:${channelId}`);
                embed = new EmbedBuilder()
                  .setAuthor({ 
                    name: 'skz_rayan23', 
                    iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                  })
                  .setDescription(`⚠️ <@${interaction.user.id}> Camera has been disabled.`)
                  .setColor('#FEE75C');
                break;

              case 'activities_on':
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                  UseEmbeddedActivities: true
                });
                await safeSet(`activities:${channelId}`, '1');
                embed = new EmbedBuilder()
                  .setAuthor({ 
                    name: 'skz_rayan23', 
                    iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                  })
                  .setDescription(`✅ <@${interaction.user.id}> Activities have been enabled.`)
                  .setColor('#57F287');
                break;

              case 'activities_off':
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                  UseEmbeddedActivities: false
                });
                await safeDel(`activities:${channelId}`);
                embed = new EmbedBuilder()
                  .setAuthor({ 
                    name: 'skz_rayan23', 
                    iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                  })
                  .setDescription(`⚠️ <@${interaction.user.id}> Activities have been disabled.`)
                  .setColor('#FEE75C');
                break;

              default:
                embed = new EmbedBuilder()
                  .setTitle('❌ Unknown feature')
                  .setDescription('This feature is not recognized.')
                  .setColor('#ED4245');
            }

            try {
                // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                await quickReply(interaction, { embeds: [embed] });
                return; // Important: return après la réponse pour éviter les réponses multiples
            } catch (error) {
              if (error.code === 10062) {
                // Interaction expirée, ignorer silencieusement
                return;
              }
              throw error;

            }
          }

          // === Gestion des modals ===
          
          // Modal de renommage
          if (interaction.isModalSubmit() && interaction.customId.startsWith('rename_modal_')) {
              const channelId = interaction.customId.replace('rename_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  // Discord Components V2 - Channel not found
                  const errorText = new TextDisplayBuilder()
                    .setContent(`### ❌ **Channel Not Found**
> **The voice channel no longer exists.**
> **Please try again or contact support if the issue persists.**`);

                  const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(errorText);

                  try {
                    interaction.reply({ 
                      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                      components: [errorContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  // Discord Components V2 - Access denied
                  const errorText = new TextDisplayBuilder()
                    .setContent(`### ❌ **Access Denied**
> **Only the channel owner can rename it.**
> **You must be the creator of this voice channel.**`);

                  const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(errorText);

                  try {
                    interaction.reply({ 
                      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                      components: [errorContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const newName = interaction.fields.getTextInputValue('new_name').trim();
              if (!newName || newName.length > 100) {
                  // Discord Components V2 - Invalid name
                  const errorText = new TextDisplayBuilder()
                    .setContent(`### ❌ **Invalid Name**
> **Channel name must be between 1 and 100 characters.**
> **Please enter a valid channel name.**`);

                  const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(errorText);

                  try {
                    interaction.reply({ 
                      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                      components: [errorContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  await channel.setName(newName);
                  // Discord Components V2 - Success
                  const successText = new TextDisplayBuilder()
                    .setContent(`### ✅ **Channel Renamed Successfully**
> **The channel has been renamed to: \`${newName}\`**
> **You can continue using other voice commands.**`);

                  const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(successText);

                  try {
                    interaction.reply({ 
                      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                      components: [successContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error(err);
                  // Discord Components V2 - Error
                  const errorText = new TextDisplayBuilder()
                    .setContent(`### ❌ **Rename Failed**
> **Failed to rename the channel.**
> **Please try again or contact support if the issue persists.**`);

                  const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(errorText);

                  try {
                    interaction.reply({ 
                      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                      components: [errorContainer]
                    });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de transfert
          if (interaction.isModalSubmit() && interaction.customId.startsWith('transfer_modal_')) {
              const channelId = interaction.customId.replace('transfer_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Channel not found')
                      .setDescription('The voice channel no longer exists.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can transfer it.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const newOwnerId = interaction.fields.getTextInputValue('new_owner_id').trim();
              if (!newOwnerId || !/^\d+$/.test(newOwnerId)) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid ID')
                      .setDescription('Please enter a valid user ID.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  const newOwner = await interaction.guild.members.fetch(newOwnerId);
                  await safeSet(`creator:${channelId}`, newOwnerId);
                  await channel.permissionOverwrites.edit(newOwnerId, {
                      Connect: true,
                      ViewChannel: true
                  });
                  const embed = new EmbedBuilder()
                      .setTitle('👑 Ownership transferred')
                      .setDescription(`Channel ownership has been transferred to ${newOwner.user.username}`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error(err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('User not found or error during transfer.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal d'expulsion
          if (interaction.isModalSubmit() && interaction.customId.startsWith('kick_modal_')) {
              const channelId = interaction.customId.replace('kick_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Channel not found')
                      .setDescription('The voice channel no longer exists.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can kick users.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const targetId = interaction.fields.getTextInputValue('user_id').trim();
              if (!targetId || !/^\d+$/.test(targetId)) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid ID')
                      .setDescription('Please enter a valid user ID.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  const targetMember = channel.members.get(targetId);
                  if (!targetMember) {
                      const embed = new EmbedBuilder()
                          .setTitle('❌ User Not Found')
                          .setDescription('This user is not in the voice channel.')
                          .setColor('#ED4245')
                          .setFooter({ text: 'Rayina tab - Voice management' });
                      try {

                        try {
                  // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                  await quickReply(interaction, { embeds: [embed] });
                  return; // Important: return après la réponse pour éviter les réponses multiples
 } catch (error) {
   if (error.code === 10062) {
     // Interaction expirée, ignorer silencieusement
     return;
   }
   throw error;
 }

                      } catch (error) {

                        if (error.code === 10062) {

                          // Interaction expirée, ignorer silencieusement

                          return;

                        }

                        throw error;

                      }
                  }

                  // Vérifier que l'utilisateur est toujours connecté avant de le déconnecter
                  if (!targetMember.voice?.channelId || targetMember.voice.channelId !== channel.id) {
                      const embed = new EmbedBuilder()
                          .setTitle('❌ User Not Connected')
                          .setDescription('This user is no longer connected to the voice channel.')
                          .setColor('#ED4245')
                          .setFooter({ text: 'Rayina tab - Voice management' });
                      try {

                        try {
                  // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                  await quickReply(interaction, { embeds: [embed] });
                  return; // Important: return après la réponse pour éviter les réponses multiples
 } catch (error) {
   if (error.code === 10062) {
     // Interaction expirée, ignorer silencieusement
     return;
   }
   throw error;
 }

                      } catch (error) {

                        if (error.code === 10062) {

                          // Interaction expirée, ignorer silencieusement

                          return;

                        }

                        throw error;

                      }
                  }

                  await targetMember.voice.disconnect('Kicked by channel owner');
                  const embed = new EmbedBuilder()
                      .setTitle('👢 User Kicked')
                      .setDescription(`${targetMember.user.username} has been kicked from the channel.`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error('[INTERACTION_KICK] Error kicking user:', err);
                  
                  // Gérer spécifiquement l'erreur 40032
                  if (err.code === 40032 || err.message?.includes('Target user is not connected to voice')) {
                      const embed = new EmbedBuilder()
                          .setTitle('❌ User Not Connected')
                          .setDescription('This user is no longer connected to voice.')
                          .setColor('#ED4245')
                          .setFooter({ text: 'Rayina tab - Voice management' });
                      try {

                        try {
                  // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                  await quickReply(interaction, { embeds: [embed] });
                  return; // Important: return après la réponse pour éviter les réponses multiples
 } catch (error) {
   if (error.code === 10062) {
     // Interaction expirée, ignorer silencieusement
     return;
   }
   throw error;
 }

                      } catch (error) {

                        if (error.code === 10062) {

                          // Interaction expirée, ignorer silencieusement

                          return;

                        }

                        throw error;

                      }
                  }
                  
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('Error while kicking the user.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de limite
          if (interaction.isModalSubmit() && interaction.customId.startsWith('limit_modal_')) {
              const channelId = interaction.customId.replace('limit_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Channel not found')
                      .setDescription('The voice channel no longer exists.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can modify the limit.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const limit = parseInt(interaction.fields.getTextInputValue('user_limit').trim());
              if (isNaN(limit) || limit < 0 || limit > 99) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid limit')
                      .setDescription('The limit must be between 0 and 99.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  await channel.setUserLimit(limit);
                  await safeSet(`limit:${channelId}`, limit);
                  const embed = new EmbedBuilder()
                      .setTitle('👥 Limit Set')
                      .setDescription(`User limit set to ${limit === 0 ? 'unlimited' : limit}`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error(err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('Error while modifying the limit.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de statut
          if (interaction.isModalSubmit() && interaction.customId.startsWith('status_modal_')) {
              const channelId = interaction.customId.replace('status_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  console.log(`[MODAL STATUS] Channel not found for ID ${channelId}`);
                  const embed = new EmbedBuilder()
                      .setAuthor({ 
                          name: 'skz_rayan23', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`❌ <@${interaction.user.id}> The voice channel no longer exists.`)
                      .setColor('#ED4245');
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              // Vérification owner/manager avec le même style que lock.js
              const { isOwnerOrManager } = require('../utils/voiceHelper');
              const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
              if (!hasPermission) {
                  console.log(`[MODAL STATUS] Access denied for user ${interaction.user.id} on channel ${channelId}`);
                  const embed = new EmbedBuilder()
                      .setAuthor({ 
                          name: 'skz_rayan23', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner or managers can set status!`)
                      .setColor('#FEE75C');
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const statusText = interaction.fields.getTextInputValue('status_text').trim();
              if (!statusText || statusText.length > 100) {
                  console.log(`[MODAL STATUS] Invalid or too long status for channel ${channelId}`);
                  const embed = new EmbedBuilder()
                      .setAuthor({ 
                          name: 'skz_rayan23', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Status must be between 1 and 100 characters.`)
                      .setColor('#FEE75C');
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  const axios = require('axios');
                  const url = `https://discord.com/api/v10/channels/${channelId}/voice-status`;
                  const payload = { status: statusText };
                  
                  await axios.put(url, payload, {
                      headers: {
                          Authorization: `Bot ${interaction.client.token}`,
                          'Content-Type': 'application/json'
                      }
                  });
                  
                  console.log(`[MODAL STATUS] Status set for channel ${channelId}: ${statusText}`);
                  const embed = new EmbedBuilder()
                      .setAuthor({ 
                          name: 'skz_rayan23', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> Voice status updated to: \`${statusText}\``)
                      .setColor('#57F287');
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error('[MODAL STATUS] Error setting status:', err);
                  let errorMessage = 'Failed to update voice status.';
                  if (err.code === 50013) {
                      errorMessage = 'I don\'t have permission to manage this channel!';
                  } else if (err.code === 10013) {
                      errorMessage = 'Channel not found!';
                  }
                  const embed = new EmbedBuilder()
                      .setAuthor({ 
                          name: 'skz_rayan23', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`❌ <@${interaction.user.id}> ${errorMessage}`)
                      .setColor('#ED4245');
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de permit
          if (interaction.isModalSubmit() && interaction.customId.startsWith('permit_modal_')) {
              const channelId = interaction.customId.replace('permit_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Channel not found')
                      .setDescription('The voice channel no longer exists.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can permit users.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const targetId = interaction.fields.getTextInputValue('user_id').trim();
              if (!targetId || !/^\d+$/.test(targetId)) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid ID')
                      .setDescription('Please enter a valid user ID.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  const targetMember = await interaction.guild.members.fetch(targetId);
                  await channel.permissionOverwrites.edit(targetId, {
                      Connect: true,
                      ViewChannel: true
                  });
                  
                  const embed = new EmbedBuilder()
                      .setTitle('✅ User Permitted')
                      .setDescription(`${targetMember.user.username} has been granted access to the channel.`)
                      .setColor('#57F287')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error('[PERMIT] Error permitting user:', err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('User not found or error during permission grant.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de permit (pour les boutons simples)
          if (interaction.isModalSubmit() && (interaction.customId === 'permit_modal' || interaction.customId === 'deny_modal')) {
              const voiceChannel = interaction.member.voice.channel;
              if (!voiceChannel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Voice channel required')
                      .setDescription('You must be in a voice channel to use this feature.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const { authorized } = await isAuthorized(channel.id, interaction.member.id);
              if (!authorized) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner or managers can use this feature.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const targetId = interaction.fields.getTextInputValue('target_user').trim();
              if (!targetId || !/^\d+$/.test(targetId)) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid ID')
                      .setDescription('Please enter a valid user ID.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  const targetMember = await interaction.guild.members.fetch(targetId);
                  const isPermit = interaction.customId === 'permit_modal';
                  
                  if (isPermit) {
                      await voiceChannel.permissionOverwrites.edit(targetId, {
                          Connect: true,
                          ViewChannel: true
                      });
                      const embed = new EmbedBuilder()
                          .setTitle('✅ User Permitted')
                          .setDescription(`${targetMember.user.username} has been granted access to the channel.`)
                          .setColor('#57F287')
                          .setFooter({ text: 'OneTab - Voice management' });
                      try {
                        // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                        await quickReply(interaction, { embeds: [embed] });
                      } catch (error) {
                        if (error.code === 10062) {
                          // Interaction expirée, ignorer silencieusement
                          return;
                        }
                        throw error;
                      }
                  } else {
                      // Déconnecter l'utilisateur s'il est dans le salon
                      if (targetMember.voice?.channelId === channel.id) {
                          await targetMember.voice.disconnect('Access denied by channel owner');
                      }
                      
                      await voiceChannel.permissionOverwrites.edit(targetId, {
                          Connect: false,
                          ViewChannel: false
                      });
                      const embed = new EmbedBuilder()
                          .setTitle('🚫 User Denied')
                          .setDescription(`${targetMember.user.username} has been denied access to the channel.`)
                          .setColor('#ED4245')
                          .setFooter({ text: 'OneTab - Voice management' });
                      try {
                        // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                        await quickReply(interaction, { embeds: [embed] });
                      } catch (error) {
                        if (error.code === 10062) {
                          // Interaction expirée, ignorer silencieusement
                          return;
                        }
                        throw error;
                      }
                  }
              } catch (err) {
                  console.error('[PERMIT/DENY] Error:', err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('User not found or error during operation.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de setVoiceLimit (pour les boutons simples)
          if (interaction.isModalSubmit() && interaction.customId === 'setVoiceLimit_modal') {
              const voiceChannel = interaction.member.voice.channel;
              if (!voiceChannel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Voice channel required')
                      .setDescription('You must be in a voice channel to use this feature.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const { authorized } = await isAuthorized(channel.id, interaction.member.id);
              if (!authorized) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner or managers can use this feature.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const limit = parseInt(interaction.fields.getTextInputValue('voice_limit').trim());
              if (isNaN(limit) || limit < 0 || limit > 99) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid limit')
                      .setDescription('The limit must be between 0 and 99.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  await voiceChannel.setUserLimit(limit);
                  await safeSet(`limit:${channel.id}`, limit);
                  const embed = new EmbedBuilder()
                      .setTitle('👥 Limit Set')
                      .setDescription(`User limit set to ${limit === 0 ? 'unlimited' : limit}`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error(err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('Error while modifying the limit.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de name (pour les boutons simples)
          if (interaction.isModalSubmit() && interaction.customId === 'name_modal') {
              const voiceChannel = interaction.member.voice.channel;
              if (!voiceChannel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Voice channel required')
                      .setDescription('You must be in a voice channel to use this feature.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const { authorized } = await isAuthorized(channel.id, interaction.member.id);
              if (!authorized) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner or managers can use this feature.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const newName = interaction.fields.getTextInputValue('voice_name').trim();
              if (!newName || newName.length > 100) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid name')
                      .setDescription('The name must be between 1 and 100 characters.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              try {
                  await voiceChannel.setName(newName);
                  const embed = new EmbedBuilder()
                      .setTitle('✅ Channel renamed')
                      .setDescription(`The channel has been renamed to: **${newName}**`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              } catch (err) {
                  console.error(err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('Error while renaming the channel.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }
          }

          // Modal de deny
          if (interaction.isModalSubmit() && interaction.customId.startsWith('deny_modal_')) {
              const channelId = interaction.customId.replace('deny_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Channel not found')
                      .setDescription('The voice channel no longer exists.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can deny users.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                    await quickReply(interaction, { embeds: [embed] });
                    return; // Important: return après la réponse pour éviter les réponses multiples
                  } catch (error) {
                    if (error.code === 10062) {
                      // Interaction expirée, ignorer silencieusement
                      return;
                    }
                    throw error;
                  }
              }

              const targetUserInput = interaction.fields.getTextInputValue('target_user') || interaction.fields.getTextInputValue('user_id');
              const reason = interaction.fields.getTextInputValue('reason') || 'Aucune raison fournie';
              
              // Extraire l'ID utilisateur de la mention ou utiliser directement l'ID
              let targetId;
              const mentionMatch = targetUserInput.match(/<@!?(\d+)>/);
              if (mentionMatch) {
                  targetId = mentionMatch[1];
              } else if (/^\d+$/.test(targetUserInput)) {
                  targetId = targetUserInput;
              } else {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Format invalide')
                      .setDescription('Utilisez une mention (@utilisateur) ou un ID utilisateur.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                        await quickReply(interaction, { embeds: [embed] });
                      return;
                  } catch (error) {
                    if (error.code === 10062) return;
                    throw error;
                  }
              }

              try {
                  const targetMember = await interaction.guild.members.fetch(targetId);
                  
                  // Vérifier que l'utilisateur ne se bannit pas lui-même
                  if (targetId === interaction.member.id) {
                      const embed = new EmbedBuilder()
                          .setTitle('❌ Erreur')
                          .setDescription('Vous ne pouvez pas vous expulser vous-même.')
                          .setColor('#ED4245')
                          .setFooter({ text: 'OneTab - Voice management' });
                      try {
                        // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                        await quickReply(interaction, { embeds: [embed] });
                        return;
                      } catch (error) {
                        if (error.code === 10062) return;
                        throw error;
                      }
                  }
                  
                  // Déconnecter l'utilisateur s'il est dans le salon
                  if (targetMember.voice?.channelId === channelId) {
                      await targetMember.voice.disconnect(`Expulsé par ${interaction.member.user.username}: ${reason}`);
                  }
                  
                  // Ajouter l'utilisateur à la liste des utilisateurs refusés
                  const deniedUsers = await safeGet(`denied_users:${channelId}`).catch(() => '[]');
                  let deniedList = [];
                  try {
                      deniedList = JSON.parse(deniedUsers);
                  } catch (error) {
                      deniedList = [];
                  }

                  // Ajouter l'utilisateur à la liste s'il n'y est pas déjà
                  if (!deniedList.includes(targetId)) {
                      deniedList.push(targetId);
                      await safeSet(`denied_users:${channelId}`, JSON.stringify(deniedList), { ex: 86400 }); // 24h
                  }
                  
                  // Notifier l'utilisateur expulsé (si possible)
                  try {
                      const dmEmbed = new EmbedBuilder()
                          .setColor('#ff6b6b')
                          .setTitle('🚫 Vous avez été expulsé')
                          .setDescription(`Vous avez été expulsé du salon vocal temporaire \`${channel.name}\``)
                          .addFields(
                              { name: '👤 Expulsé par', value: `${interaction.member.user.username}`, inline: true },
                              { name: '📝 Raison', value: reason, inline: true },
                              { name: '⏰ Date', value: new Date().toLocaleString(), inline: true }
                          )
                          .setTimestamp();
                      
                      await targetMember.send({ embeds: [dmEmbed] });
                  } catch (dmError) {
                      // L'utilisateur a peut-être désactivé les DMs, ignorer l'erreur
                      console.log(`[DENY] Impossible d'envoyer un DM à ${targetMember.user.username}:`, dmError.message);
                  }
                  
                  const embed = new EmbedBuilder()
                      .setTitle('🚫 Utilisateur expulsé')
                      .setDescription(`**${targetMember.user.username}** a été expulsé du salon \`${channel.name}\`\n\n**Raison:** ${reason}\n\n🚫 L'utilisateur a été ajouté à la liste des refusés et sera automatiquement expulsé s'il tente de revenir.`)
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                        await quickReply(interaction, { embeds: [embed] });
                      return;
                  } catch (error) {
                    if (error.code === 10062) return;
                    throw error;
                  }
              } catch (err) {
                  console.error('[DENY] Error denying user:', err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Erreur')
                      .setDescription('Utilisateur introuvable ou erreur lors de l\'expulsion.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'OneTab - Voice management' });
                  try {
                    // 🚀 CORRECTION : Utiliser quickReply pour une réponse instantanée
                        await quickReply(interaction, { embeds: [embed] });
                      return;
                  } catch (error) {
                    if (error.code === 10062) return;
                    throw error;
                  }
              }
          }

          // === Gestion des boutons de ping ===
          if (interaction.isButton() && interaction.customId === 'ping_refresh') {
            const startTime = process.hrtime.bigint();
            const apiLatency = interaction.client.ws.ping;
            const botLatency = Math.round(Number(process.hrtime.bigint() - startTime) / 1000000);
            const status = apiLatency < 50 ? '🚀 Excellent' : apiLatency < 100 ? '✅ Good' : apiLatency < 200 ? '⚠️ Fair' : '❌ Poor';
            
            const titleText = new TextDisplayBuilder()
              .setContent('# 🏓 Pong!');
              
            const latencyText = new TextDisplayBuilder()
              .setContent(`
> **Bot latency information**

🤖 **Bot Latency:** \`${botLatency}ms\`
🌐 **API Latency:** \`${apiLatency}ms\`
📊 **Status:** ${status}

**Performance Analysis:**
${apiLatency < 50 ? '• 🚀 **Excellent** - Optimal performance' : ''}
${apiLatency >= 50 && apiLatency < 100 ? '• ✅ **Good** - Great performance' : ''}
${apiLatency >= 100 && apiLatency < 200 ? '• ⚠️ **Fair** - Acceptable performance' : ''}
${apiLatency >= 200 ? '• ❌ **Poor** - Performance issues detected' : ''}
              `);
              
            const footerText = new TextDisplayBuilder()
              .setContent('OneTab - Voice management | Use the refresh button to check again');

            const refreshButton = new ButtonBuilder()
              .setCustomId('ping_refresh')
              .setLabel('Refresh')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🔄');

            const buttonRow = new ActionRowBuilder().addComponents(refreshButton);
            const container = new ContainerBuilder()
              .addTextDisplayComponents(titleText, latencyText, footerText);
            
            await interaction.update({
              flags: MessageFlags.IsComponentsV2,
              components: [container, buttonRow]
            });
            return;
          }

          // === Gestion des boutons de setup ===
          if (interaction.isButton() && (interaction.customId === 'setup_test' || interaction.customId === 'setup_info')) {
            if (interaction.customId === 'setup_test') {
              const titleText = new TextDisplayBuilder()
                .setContent('# 🧪 Setup Test');
                
              const testText = new TextDisplayBuilder()
                .setContent(`
> **Testing bot configuration...**

**Test Results:**
• ✅ Bot is online and responsive
• ✅ Database connection active
• ✅ Voice channel creation ready
• ✅ All systems operational

**Status:** All tests passed successfully!
                `);
                
              const footerText = new TextDisplayBuilder()
                .setContent('OneTab - Voice management | Setup test completed');

              const container = new ContainerBuilder()
                .addTextDisplayComponents(titleText, testText, footerText);

              try {
   try {

     interaction.reply({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [container]
              });

   } catch (error) {

     if (error.code === 10062) {

       // Interaction expirée, ignorer silencieusement

       return;

     }

     throw error;

   }
 } catch (error) {
   if (error.code === 10062) {
     // Interaction expirée, ignorer silencieusement
     return;
   }
   throw error;
 }
            } else if (interaction.customId === 'setup_info') {
              const titleText = new TextDisplayBuilder()
                .setContent('# ℹ️ Configuration Info');
                
              const infoText = new TextDisplayBuilder()
                .setContent(`
> **Current bot configuration**

**Server ID:** \`${interaction.guild.id}\`
**Bot Version:** Latest
**Features Enabled:** All
**Status:** Active

**Available Commands:**
• Voice channel management
• Premium features
• Admin tools
• User management
                `);
                
              const footerText = new TextDisplayBuilder()
                .setContent('OneTab - Voice management | Configuration details');

              const container = new ContainerBuilder()
                .addTextDisplayComponents(titleText, infoText, footerText);

              try {
   try {

     interaction.reply({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: [container]
              });

   } catch (error) {

     if (error.code === 10062) {

       // Interaction expirée, ignorer silencieusement

       return;

     }

     throw error;

   }
 } catch (error) {
   if (error.code === 10062) {
     // Interaction expirée, ignorer silencieusement
     return;
   }
   throw error;
 }
            }
            return;
          }

          // === Gestion du menu de sélection pour l'aide (Discord Components V2) ===
          if (interaction.isStringSelectMenu() && interaction.customId === 'help-category-select') {
            const selectedKey = interaction.values[0];
            
            // Mapping des valeurs du menu vers les clés des pages
            const pageMapping = {
              'voice': 'commands',
              'blacklist': 'blacklist',
              'whitelist': 'whitelist',
              'manager': 'manager',
              'features': 'features',
              'setup': 'setup',
              'admin': 'admin',
              'task': 'task'
            };
            
            const pageKey = pageMapping[selectedKey];
            
            if (pageKey) {
              // Pages de détail complètes
              const detailPages = {
                commands: {
                  title: '🔊 Voice Channel Commands',
                  content: `
# 🔊 Voice Channel Commands

> **Manage your temporary voice channels with ease!**

## ➡️ Channel Management
🔈 **\`.v name <name>\`** — Rename your channel
👥 **\`.v limit <number>\`** — Limit users
♻️ **\`.v reset\`** — Reset channel settings
ℹ️ **\`.v vcinfo\`** — Channel info
👑 **\`.v owner\`** — View owner
📝 **\`.v status [emoji] [text]\`** — Set channel status
🧹 **\`.v clear\`** — Kick all users

## ➡️ Access Control
🔒 **\`.v lock\`** — Lock channel
🔓 **\`.v unlock\`** — Unlock channel
🙈 **\`.v hide\`** — Hide channel (Premium)
👁️ **\`.v unhide\`** — Unhide channel (Premium)
✅ **\`.v permit @user\`** — Permit user
⛔ **\`.v reject @user\`** — Reject user
🟢 **\`.v permitrole @role\`** — Permit role
🔴 **\`.v rejectrole @role\`** — Reject role
💬 **\`.v tlock\`** — Lock chat
💬 **\`.v tunlock\`** — Unlock chat
📩 **\`.v request\`** — Request access

## ➡️ User Management
👢 **\`.v kick @user\`** — Kick user
🔇 **\`.v fm\`** — Mute all
🔊 **\`.v funm\`** — Unmute all
🏆 **\`.v claim\`** — Claim ownership
👑 **\`.v transfer @user\`** — Transfer ownership
📋 **\`+task\`** — Start task timer (only for staff)

> **💡 Use \`.v help <command>\` for more details on each command.**
                  `,
                  footer: 'OneTab - Voice management | Use .v help commands'
                },
                blacklist: {
                  title: '⛔ Blacklist System',
                  content: `
# ⛔ Blacklist System

> **Block users from joining your voice channels!**

## ➕ Add to Blacklist
**\`.v blacklist add @user\`** or **\`.v bl add @user\`**
> Add a user to your blacklist (they will be blocked from your future VCs).

## ➖ Remove from Blacklist
**\`.v blacklist remove @user\`** or **\`.v bl remove @user\`**
> Remove a user from your blacklist.

## 📋 View Blacklist
**\`.v blacklist list\`** or **\`.v bl list\`**
> View your blacklist.

## 🧹 Clear Blacklist
**\`.v blacklist clear\`** or **\`.v bl clear\`**
> Clear your blacklist.

⚠️ **Blacklist applies to all temporary VCs you create.**

## 💡 Tips
• Use blacklist to keep unwanted users out
• Combine with whitelist for maximum control
• Blacklist is server-wide for your channels
                  `,
                  footer: 'OneTab - Voice management | Use .v blacklist or .v bl'
                },
                whitelist: {
                  title: '✅ Whitelist System',
                  content: `
# ✅ Whitelist System

> **Allow only trusted users to join your voice channels!**

## ➕ Add to Whitelist
**\`.v whitelist add @user\`** or **\`.v wl add @user\`**
> Add a user to your whitelist (they will always be able to join your VCs).

## ➖ Remove from Whitelist
**\`.v whitelist remove @user\`** or **\`.v wl remove @user\`**
> Remove a user from your whitelist.

## 📋 View Whitelist
**\`.v whitelist list\`** or **\`.v wl list\`**
> View your whitelist.

## 🧹 Clear Whitelist
**\`.v whitelist clear\`** or **\`.v wl clear\`**
> Clear your whitelist.

⚠️ **Whitelist applies to all temporary VCs you create.**

## 💡 Tips
• Use whitelist for exclusive channels
• Perfect for private meetings or events
• Whitelist overrides blacklist for specific users
                  `,
                  footer: 'OneTab - Voice management | Use .v whitelist or .v wl'
                },
                manager: {
                  title: '🤝 Manager (Co-Owner) System',
                  content: `
# 🤝 Manager (Co-Owner) System

> **Easily share channel management with trusted users!**

## ➕ Add Manager
**\`.v manager add @user\`** or **\`.v man add @user\`**
> Add a user as manager (co-owner) of your voice channel.

## ➖ Remove Manager
**\`.v manager remove @user\`** or **\`.v man remove @user\`**
> Remove a user from your managers.

## 🧹 Clear Managers
**\`.v manager clear\`** or **\`.v man clear\`**
> Remove all managers from your channel.

## 📋 Show Managers
**\`.v manager show\`** or **\`.v man show\`**
> List all current managers (co-owners) of your channel.

## 🎯 Managers can:
- Manage the channel (rename, limit, kick, mute, etc.)
- Help you moderate your voice room
- Use all voice commands except transfer ownership

⚠️ **Only the channel owner can manage the managers list.**

## 💡 Tips
• Choose trusted friends as managers
• Managers can help moderate when you're away
• Perfect for team leaders and moderators
                  `,
                  footer: 'OneTab - Voice management | Use .v manager or .v man'
                },
                features: {
                  title: '✨ Voice Channel Features',
                  content: `
# ✨ Voice Channel Features

> **Enhance your voice experience with extra features!**

## ✨ Activities
**\`.v activity on\`** — Enable activities
> Watch Together, Poker Night, Chess, and more interactive activities.

## 📷 Camera
**\`.v cam on\`** — Enable camera
> Allow video sharing in your voice channel.

## 😤 Streaming
**\`.v stream on\`** — Enable stream
> Enable screen sharing and streaming capabilities.

## 🔊 Soundboard
**\`.v sb on\`** — Enable soundboard
> Play sound effects and music through the soundboard.

## 🔧 To disable any feature:
**\`.v activity off\`**, **\`.v cam off\`**, **\`.v stream off\`**, **\`.v sb off\`**

✨ **Try these features in your voice channel!**

## 💡 Tips
• Activities require 2+ users to work properly
• Some features may need specific permissions
• Great for gaming sessions and group activities
                  `,
                  footer: 'OneTab - Voice management | Use .v help features'
                },
                setup: {
                  title: '🛠️ Setup Commands',
                  content: `
# 🛠️ Setup Commands

> **Server administrators can configure the bot for your community.**

## 🛠️ Setup Process
**\`.v setup\`** — Start the setup process
> Interactive setup wizard to configure voice channel creation.

## 🎯 Setup includes:
- Voice channel creation settings
- Permission configurations
- Role assignments
- Channel naming patterns

## 📋 Requirements:
- Administrator permissions
- Manage channels permission
- Manage roles permission

⚙️ **More setup options coming soon!**

## 💡 Tips
• Run setup in a dedicated admin channel
• Test the setup with a few users first
• Keep backup of your current settings
                  `,
                  footer: 'OneTab - Voice management | Use .v help setup'
                },
                admin: {
                  title: '🛡️ Admin Commands',
                  content: `
# 🛡️ Admin Commands

> **Reserved for server administrators.**

## 🛡️ Admin Panel
**\`.v admin\`** — Admin panel (coming soon)
> Server-wide voice channel management and analytics.

## 🚀 Future admin features:
- Server-wide voice channel overview
- User permission management
- Bot configuration settings
- Analytics and statistics
- Advanced moderation tools

🔒 **Only users with admin permissions can use these commands.**

## 💡 Tips
• Admin panel will provide detailed server insights
• Monitor voice channel usage and activity
• Manage bot settings across the entire server
                  `,
                  footer: 'OneTab - Voice management | Use .v help admin'
                },
                task: {
                  title: '📋 Task System (Special Prefix)',
                  content: `
# 📋 Task System (Special Prefix)

> **Staff task management system for voice channel activities!**

⚠️ **Note:** This command uses the special prefix **\`+\`** instead of **\`.v\`**

## 📋 Start Task Timer
**\`+task\`** — Start task timer
> Start a 20-minute timer when you have 5+ members in your VC.

## 📋 Automatic Completion
**\`+task\`** — AUTOMATIC completion
> Tasks are automatically counted after 20 minutes! No need to claim.

## 📋 View Statistics
**\`+task list\`** — View task statistics
> View all staff members and their completed tasks (High roles only).

## 🧹 Reset Data
**\`+task clear\`** — Reset task data
> Clear all task data from the server (Owners only).

## 🏆 Leaderboard
**\`+leaderboard\`** — View task leaderboard
> View the top 10 staff members by completed tasks (High roles only).

## 📋 Requirements to start a task:
• Must be in a voice channel
• Must have staff role
• Must be the channel creator
• Must have 5+ members in the channel

## ⏰ Process:
1. Use **\`+task\`** to start the timer
2. Stay 20 minutes with 5+ members
3. ✅ **AUTOMATIC:** Task is automatically counted!

## 💡 Tips
• Perfect for staff activity tracking
• Great for community engagement
• Monitor staff performance and activity
• ✅ **Fully automatic** - no manual claiming needed!
                  `,
                  footer: 'OneTab - Voice management | Use .v help task'
                }
              };
              
              const page = detailPages[pageKey];
              
              if (page) {
                const titleText = new TextDisplayBuilder()
                  .setContent(`# ${page.title}`);
                  
                const contentText = new TextDisplayBuilder()
                  .setContent(page.content);
                  
                const footerText = new TextDisplayBuilder()
                  .setContent(page.footer);

                // Boutons de navigation pour les pages de détail
                const navigationRow = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId('help_back_to_main')
                    .setLabel('← Retour au menu')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏠'),
                  new ButtonBuilder()
                    .setCustomId('help_commands')
                    .setLabel('Commands')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔊'),
                  new ButtonBuilder()
                    .setCustomId('help_features')
                    .setLabel('Features')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✨'),
                  new ButtonBuilder()
                    .setCustomId('help_blacklist')
                    .setLabel('Blacklist')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⛔'),
                  new ButtonBuilder()
                    .setCustomId('help_whitelist')
                    .setLabel('Whitelist')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✅')
                );

                const container = new ContainerBuilder()
                  .addTextDisplayComponents(titleText, contentText, footerText);
                
                await interaction.update({
                  flags: MessageFlags.IsComponentsV2,
                  components: [container, navigationRow]
                });
              }
            }
          }

          // === Gestion du bouton retour au menu help ===
          if (interaction.isButton() && interaction.customId === 'help_back_to_main') {
            const serverName = interaction.guild.name;
            
            // Composants texte du menu principal
            const titleText = new TextDisplayBuilder()
              .setContent(`# 🎮 Help Commands | ${serverName}`);
              
            const descriptionText = new TextDisplayBuilder()
              .setContent(`
> **We are thrilled to introduce our latest addition to the server, Serinas**

**My Prefix:** \`.v\`

---

🔊 **・Voice Commands**
<:badge:1410413998335328318> \`.v help commands\`

---

⛔ **・BlackList Commands**
<:badge:1410413998335328318> \`.v help bl\`

---

✅ **・Whitelist Commands**
<:badge:1410413998335328318> \`.v help wl\`

---

🤝 **・Manager (Co-Owner) Commands**
<:badge:1410413998335328318> \`.v help manager\`

---

📋 **・Task System (Special Prefix)**
<:badge:1410413998335328318> \`+task\`

---

**Use:** \`.v help setup\` To See Setup Commands
**Use:** \`.v help admin\` To See Admin Commands
**Use:** \`.v help features\` To See Voice Features

---

🔗 **Links:** [Support](your_link) | [InviteBot](your_link) | [Vote](your_link)
              `);
              
            const footerText = new TextDisplayBuilder()
              .setContent('OneTab - Voice management | Use the menu below to navigate');

            // Menu de sélection pour la navigation
            const helpMenu = new StringSelectMenuBuilder()
              .setCustomId('help-category-select')
              .setPlaceholder('🔍 Choose a help category')
              .addOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel('Voice Commands')
                  .setValue('voice')
                  .setDescription('All voice channel management commands')
                  .setEmoji('🔊'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Blacklist System')
                  .setValue('blacklist')
                  .setDescription('Block users from your voice channels')
                  .setEmoji('⛔'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Whitelist System')
                  .setValue('whitelist')
                  .setDescription('Allow only trusted users')
                  .setEmoji('✅'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Manager System')
                  .setValue('manager')
                  .setDescription('Share channel management with trusted users')
                  .setEmoji('🤝'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Voice Features')
                  .setValue('features')
                  .setDescription('Enable activities, camera, soundboard, etc.')
                  .setEmoji('✨'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Setup Commands')
                  .setValue('setup')
                  .setDescription('Server administrator configuration')
                  .setEmoji('🛠️'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Admin Commands')
                  .setValue('admin')
                  .setDescription('Server-wide management tools')
                  .setEmoji('🛡️'),
                new StringSelectMenuOptionBuilder()
                  .setLabel('Task System')
                  .setValue('task')
                  .setDescription('Staff task management system')
                  .setEmoji('📋')
              );

            const menuRow = new ActionRowBuilder().addComponents(helpMenu);

            // Boutons d'action rapide
            const quickActionRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('help_commands')
                .setLabel('Commands')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('<:badge:1410413998335328318>'),
              new ButtonBuilder()
                .setCustomId('help_features')
                .setLabel('Features')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:badge:1410413998335328318>'),
              new ButtonBuilder()
                .setCustomId('help_blacklist')
                .setLabel('Blacklist')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:badge:1410413998335328318>'),
              new ButtonBuilder()
                .setCustomId('help_whitelist')
                .setLabel('Whitelist')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:badge:1410413998335328318>'),
              new ButtonBuilder()
                .setCustomId('help_manager')
                .setLabel('Manager')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('<:badge:1410413998335328318>')
            );

            // Container principal
            const container = new ContainerBuilder()
              .addTextDisplayComponents(titleText, descriptionText, footerText);

            await interaction.update({
              flags: MessageFlags.IsComponentsV2,
              components: [container, menuRow, quickActionRow]
            });
          }

          // === Gestion des autres boutons help ===
          if (interaction.isButton() && interaction.customId.startsWith('help_') && interaction.customId !== 'help_back_to_main') {
            const { detailPages } = require('../utils/helpPages');
            const pageKey = interaction.customId.replace('help_', '');
            const page = detailPages[pageKey];
            
            if (page) {
              
              const titleText = new TextDisplayBuilder()
                .setContent(`# ${page.title}`);
                
              const contentText = new TextDisplayBuilder()
                .setContent(page.content);
                
              const footerText = new TextDisplayBuilder()
                .setContent(page.footer);

              // Boutons de navigation - divisés en deux ActionRows
              const navigationRow1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('help_back_to_main')
                  .setLabel('← Back to Main Menu')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('🏠'),
                new ButtonBuilder()
                  .setCustomId('help_commands')
                  .setLabel('Commands')
                  .setStyle(ButtonStyle.Primary)
                  .setEmoji('🔊'),
                new ButtonBuilder()
                  .setCustomId('help_features')
                  .setLabel('Features')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('✨'),
                new ButtonBuilder()
                  .setCustomId('help_blacklist')
                  .setLabel('Blacklist')
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji('⛔'),
                new ButtonBuilder()
                  .setCustomId('help_whitelist')
                  .setLabel('Whitelist')
                  .setStyle(ButtonStyle.Success)
                  .setEmoji('✅')
              );

              const navigationRow2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('help_manager')
                  .setLabel('Manager')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('🤝'),
                new ButtonBuilder()
                  .setCustomId('help_setup')
                  .setLabel('Setup')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('🛠️'),
                new ButtonBuilder()
                  .setCustomId('help_admin')
                  .setLabel('Admin')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('🛡️'),
                new ButtonBuilder()
                  .setCustomId('help_task')
                  .setLabel('Task System')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('📋')
              );

              const container = new ContainerBuilder()
                .addTextDisplayComponents(titleText, contentText, footerText);

              await interaction.update({
                flags: MessageFlags.IsComponentsV2,
                components: [container, navigationRow1, navigationRow2]
              });
            }
          }
      }
  }
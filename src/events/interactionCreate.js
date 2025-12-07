  const axios = require('axios');
  const { getChannelOwner } = require('../utils/voiceHelper');
  const { 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
  } = require('discord.js');
  const { safeGet, safeSet, safeDel, redisEnabled } = require('../redisClient');

  module.exports = {
      name: 'interactionCreate',
      async execute(interaction, client) {
          // Gestion des commandes slash existantes
          if (interaction.isChatInputCommand()) {
              const command = client.commands.slash.get(interaction.commandName);
              if (!command) return;
              try {
                  await command.execute(interaction);
              } catch (error) {
                  console.error(error);
                  await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
              }
              return;
          }

          // === Gestion des boutons de gestion de salon vocal ===
          if (interaction.isButton() && interaction.customId.startsWith('vc_')) {
              // Format: vc_action_channelId
              const parts = interaction.customId.split('_');
              const action = parts[1]; // lock, unlock, etc.
              const channelId = parts[2]; // ID du salon
              
              console.log(`[BUTTON] Action: ${action}, Channel: ${channelId}`);

              const channel = interaction.guild.channels.cache.get(channelId);
              if (!channel) {
                const embed = new EmbedBuilder()
                  .setTitle('❌ Channel not found')
                  .setDescription('The voice channel no longer exists.')
                  .setColor('#ED4245')
                  .setFooter({ text: 'OneTab - Voice management' });
                return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              // Pour tous les boutons SAUF 'transfer', 'hide', 'unhide', on vérifie que l'utilisateur est owner, manager ou premium
              if (action !== 'transfer' && action !== 'hide' && action !== 'unhide') {
                const ownerId = await safeGet(`creator:${channelId}`);
                const { isOwnerOrManager } = require('../utils/voiceHelper');
                const premiumManager = require('../utils/premiumManager');
                const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
                const hasPremium = await premiumManager.hasPremiumAccess(interaction.guild.id, interaction.user.id);
                
                if (!hasPermission && !hasPremium) {
                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`⚠️ <@${interaction.user.id}> This is a **premium feature**! Only channel owners, managers, or users with premium access can use these buttons.\n\n💎 Ask an administrator to give you premium access `)
                    .setColor('#FEE75C');
                  return interaction.reply({ embeds: [embed], ephemeral: true });
                }
              }

              switch (action) {
                case 'lock': {
                  const isLocked = await safeGet(`locked:${channelId}`) === '1';
                  if (isLocked) {
                    const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> This channel is already locked.`)
                      .setColor('#5865F2')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  }

                  await Promise.all([
                    // Deny @everyone from joining
                    channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                      Connect: false
                    }),
                    // Give basic permissions to the user who clicked the button (no dangerous permissions)
                    channel.permissionOverwrites.edit(interaction.user.id, {
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
                    safeSet(`locked:${channelId}`, '1')
                  ]);

                  const embed = new EmbedBuilder()
                  .setAuthor({ 
                    name: 'late Night', 
                    iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> The channel has been locked successfully.`)
                    .setColor('#5865F2')
                  return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                              case 'unlock': {
                  const isLocked = await safeGet(`locked:${channelId}`) === '1';
                  if (!isLocked) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> This channel is not locked.`)
                      .setColor('#5865F2')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  }

                  await Promise.all([
                    // Allow everyone to connect
                    channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                      Connect: null
                    }),
                    // Restore creator's base permissions (without dangerous permissions)
                    channel.permissionOverwrites.edit(interaction.user.id, {
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
                    safeDel(`locked:${channelId}`),
                    safeDel(`permitted_users:${channelId}`)
                  ]);

                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> The channel has been unlocked successfully.`)
                    .setColor('#5865F2')
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> This channel already has an active owner!`)
                      .setColor('#FEE75C')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  }
                  // Sinon, assigne l'ownership à l'utilisateur
                  await safeSet(`creator:${channelId}`, interaction.user.id);
                  await channel.permissionOverwrites.edit(interaction.user.id, {
                    Connect: true,
                    ViewChannel: true
                  });
                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> You are now the owner of this channel!`)
                    .setColor('#57F287')
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner or managers can use this button!`)
                      .setColor('#FEE75C')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  }

                  // Mute all users using channel permissions (like .v fm command)
                  const membersToMute = channel.members;
                  if (membersToMute.size === 0) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Aucun membre dans le salon.`)
                      .setColor('#FEE75C')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
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
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> Muted ${membersToMute.size} user(s) in <#${channelId}>.`)
                      .setColor('#57F287')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  } catch (err) {
                    console.error(err);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Failed to mute users in the voice channel.`)
                      .setColor('#ED4245')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  }
                }

                case 'unmute': {
                  // Check ownership or manager status
                  const { isOwnerOrManager } = require('../utils/voiceHelper');
                  const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
                  if (!hasPermission) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner or managers can use this button!`)
                      .setColor('#FEE75C')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  }

                  // Unmute all users using channel permissions (like .v funm command)
                  const membersToUnmute = channel.members;
                  if (membersToUnmute.size === 0) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Aucun membre dans le salon.`)
                      .setColor('#FEE75C')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
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
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> ${membersToUnmute.size} utilisateur(s) ont été démuté(s) dans <#${channelId}>.`)
                      .setColor('#5865F2')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  } catch (error) {
                    console.error('[UNMUTE] Error:', error);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Erreur lors du démutage. Vérifiez les permissions du bot.`)
                      .setColor('#ED4245')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
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
                  // Check premium access for hide/unhide buttons (PREMIUM ONLY)
                  const premiumManager = require('../utils/premiumManager');
                  const hasPremium = await premiumManager.hasPremiumAccess(interaction.guild.id, interaction.user.id);
                  

                  
                  if (!hasPremium) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> This is a **premium feature**! Only users with premium access can use this button.\n\n💎 Ask an administrator to give you premium access`)
                      .setColor('#FEE75C')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
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

                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> The channel has been hidden successfully.`)
                    .setColor('#5865F2')
                  return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                case 'unhide': {
                  // Check premium access for hide/unhide buttons (PREMIUM ONLY)
                  const premiumManager = require('../utils/premiumManager');
                  const hasPremium = await premiumManager.hasPremiumAccess(interaction.guild.id, interaction.user.id);
                  

                  
                  if (!hasPremium) {
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> This is a **premium feature**! Only users with premium access can use this button.\n\n💎 Ask an administrator to give you premium access with: `)
                      .setColor('#FEE75C')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
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

                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> The channel has been unhidden successfully.`)
                    .setColor('#5865F2')
                  return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                case 'reset': {
                  await channel.permissionOverwrites.set([]);
                  await safeDel(`locked:${channelId}`, `hidden:${channelId}`, `limit:${channelId}`);

                  const embed = new EmbedBuilder()
                    .setAuthor({ 
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> All permissions have been reset.`)
                    .setColor('#5865F2')
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> The soundboard has been disabled.`)
                      .setColor('#5865F2')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  } else {
                    // Enable soundboard
                    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                      UseSoundboard: true
                    });
                    await safeSet(`soundboard:${channelId}`, '1');
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> The soundboard has been enabled.`)
                      .setColor('#5865F2')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  }
                }

                case 'cam': {
                  const isEnabled = await safeGet(`camera:${channelId}`) === '1';
                  if (isEnabled) {
                    await safeDel(`camera:${channelId}`);
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Camera has been disabled.`)
                      .setColor('#5865F2')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                  } else {
                    await safeSet(`camera:${channelId}`, '1');
                    const embed = new EmbedBuilder()
                      .setAuthor({ 
                        name: 'late Night', 
                        iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> Camera has been enabled.`)
                      .setColor('#5865F2')
                    return interaction.reply({ embeds: [embed], ephemeral: true });
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
                      name: 'late Night', 
                      iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                    })
                    .setDescription(`✅ <@${interaction.user.id}> ${kickedCount} user(s) have been kicked from the channel.`)
                    .setColor('#5865F2')
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                  return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                default:
                  const embed = new EmbedBuilder()
                    .setTitle('❌ Unknown action')
                    .setDescription('This action is not recognized.')
                    .setColor('#ED4245')
                    .setFooter({ text: 'OneTab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }
          }

          // === Gestion des modals ===
          
          // Modal de renommage
          if (interaction.isModalSubmit() && interaction.customId.startsWith('rename_modal_')) {
              const channelId = interaction.customId.replace('rename_modal_', '');
              const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
              if (!channel) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Channel not found')
                      .setDescription('The voice channel no longer exists.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can rename it.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const newName = interaction.fields.getTextInputValue('new_name').trim();
              if (!newName || newName.length > 100) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid name')
                      .setDescription('The name must be between 1 and 100 characters.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              try {
                  await channel.setName(newName);
                  const embed = new EmbedBuilder()
                      .setTitle('✅ Channel renamed')
                      .setDescription(`The channel has been renamed to: **${newName}**`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              } catch (err) {
                  console.error(err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('Error while renaming the channel.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can transfer it.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const newOwnerId = interaction.fields.getTextInputValue('new_owner_id').trim();
              if (!newOwnerId || !/^\d+$/.test(newOwnerId)) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid ID')
                      .setDescription('Please enter a valid user ID.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              } catch (err) {
                  console.error(err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('User not found or error during transfer.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can kick users.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const targetId = interaction.fields.getTextInputValue('user_id').trim();
              if (!targetId || !/^\d+$/.test(targetId)) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid ID')
                      .setDescription('Please enter a valid user ID.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              try {
                  const targetMember = channel.members.get(targetId);
                  if (!targetMember) {
                      const embed = new EmbedBuilder()
                          .setTitle('❌ User Not Found')
                          .setDescription('This user is not in the voice channel.')
                          .setColor('#ED4245')
                          .setFooter({ text: 'Rayina tab - Voice management' });
                      return interaction.reply({ embeds: [embed], ephemeral: true });
                  }

                  // Vérifier que l'utilisateur est toujours connecté avant de le déconnecter
                  if (!targetMember.voice?.channelId || targetMember.voice.channelId !== channel.id) {
                      const embed = new EmbedBuilder()
                          .setTitle('❌ User Not Connected')
                          .setDescription('This user is no longer connected to the voice channel.')
                          .setColor('#ED4245')
                          .setFooter({ text: 'Rayina tab - Voice management' });
                      return interaction.reply({ embeds: [embed], ephemeral: true });
                  }

                  await targetMember.voice.disconnect('Kicked by channel owner');
                  const embed = new EmbedBuilder()
                      .setTitle('👢 User Kicked')
                      .setDescription(`${targetMember.user.username} has been kicked from the channel.`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              } catch (err) {
                  console.error('[INTERACTION_KICK] Error kicking user:', err);
                  
                  // Gérer spécifiquement l'erreur 40032
                  if (err.code === 40032 || err.message?.includes('Target user is not connected to voice')) {
                      const embed = new EmbedBuilder()
                          .setTitle('❌ User Not Connected')
                          .setDescription('This user is no longer connected to voice.')
                          .setColor('#ED4245')
                          .setFooter({ text: 'Rayina tab - Voice management' });
                      return interaction.reply({ embeds: [embed], ephemeral: true });
                  }
                  
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('Error while kicking the user.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const ownerId = await safeGet(`creator:${channelId}`);
              if (!ownerId || ownerId !== interaction.user.id) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Access denied')
                      .setDescription('Only the channel owner can modify the limit.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const limit = parseInt(interaction.fields.getTextInputValue('user_limit').trim());
              if (isNaN(limit) || limit < 0 || limit > 99) {
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Invalid limit')
                      .setDescription('The limit must be between 0 and 99.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              try {
                  await channel.setUserLimit(limit);
                  await safeSet(`limit:${channelId}`, limit);
                  const embed = new EmbedBuilder()
                      .setTitle('👥 Limit Set')
                      .setDescription(`User limit set to ${limit === 0 ? 'unlimited' : limit}`)
                      .setColor('#5865F2')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              } catch (err) {
                  console.error(err);
                  const embed = new EmbedBuilder()
                      .setTitle('❌ Error')
                      .setDescription('Error while modifying the limit.')
                      .setColor('#ED4245')
                      .setFooter({ text: 'Rayina tab - Voice management' });
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                          name: 'late Night', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`❌ <@${interaction.user.id}> The voice channel no longer exists.`)
                      .setColor('#ED4245');
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              // Vérification owner/manager avec le même style que lock.js
              const { isOwnerOrManager } = require('../utils/voiceHelper');
              const hasPermission = await isOwnerOrManager(channelId, interaction.user.id);
              if (!hasPermission) {
                  console.log(`[MODAL STATUS] Access denied for user ${interaction.user.id} on channel ${channelId}`);
                  const embed = new EmbedBuilder()
                      .setAuthor({ 
                          name: 'late Night', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Only the channel owner or managers can set status!`)
                      .setColor('#FEE75C');
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }

              const statusText = interaction.fields.getTextInputValue('status_text').trim();
              if (!statusText || statusText.length > 100) {
                  console.log(`[MODAL STATUS] Invalid or too long status for channel ${channelId}`);
                  const embed = new EmbedBuilder()
                      .setAuthor({ 
                          name: 'late Night', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`⚠️ <@${interaction.user.id}> Status must be between 1 and 100 characters.`)
                      .setColor('#FEE75C');
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                          name: 'late Night', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`✅ <@${interaction.user.id}> Voice status updated to: \`${statusText}\``)
                      .setColor('#57F287');
                  return interaction.reply({ embeds: [embed], ephemeral: true });
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
                          name: 'late Night', 
                          iconURL: 'https://cdn.discordapp.com/avatars/1395739396128378920/a_205db0dad201aa0645e8d9bffdac9a99.gif?size=1024'
                      })
                      .setDescription(`❌ <@${interaction.user.id}> ${errorMessage}`)
                      .setColor('#ED4245');
                  return interaction.reply({ embeds: [embed], ephemeral: true });
              }
          }
      }
  }
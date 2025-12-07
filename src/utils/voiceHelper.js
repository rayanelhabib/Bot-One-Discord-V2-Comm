const { redis } = require('../redisClient');

async function isChannelOwner(channelId, userId) {
  const ownerId = await redis.get(`creator:${channelId}`);
  return ownerId === userId;
}

async function isBotCreatedChannel(channelId) {
  const creatorId = await redis.get(`creator:${channelId}`);
  return creatorId !== null;
}

async function transferOwnership(channelId, newOwnerId) {
  const pipeline = redis.pipeline();
  pipeline.set(`creator:${channelId}`, newOwnerId);
  pipeline.expire(`creator:${channelId}`, 86400);
  await pipeline.exec();
  console.log(`[TRANSFER] Ownership transferred for channel ${channelId} to ${newOwnerId}`);
}

async function checkOwnership(channelId, userId) {
  const ownerId = await redis.get(`creator:${channelId}`);
  return ownerId === userId;
}

async function getChannelState(channelId, stateType) {
  return redis.get(`${stateType}_state:${channelId}`);
}

async function getChannelSetting(channelId, setting) {
  return redis.get(`${setting}:${channelId}`);
}

async function getChannelOwner(channelId) {
  return redis.get(`creator:${channelId}`);
}

async function getPermittedRoles(channelId) {
  return redis.smembers(`permitted_roles:${channelId}`);
}

async function getRejectedUsers(channelId) {
  return redis.smembers(`rejected_users:${channelId}`);
}

async function getRejectedRoles(channelId) {
  return redis.smembers(`rejected_roles:${channelId}`);
}

async function getSoundboardState(channelId) {
  return redis.get(`soundboard:${channelId}`);
}

async function getPendingRequests(channelId) {
  return redis.smembers(`access_requests:${channelId}`);
}

async function getChannelStatus(channelId) {
  return redis.get(`status:${channelId}`);
}

async function isTextLocked(channelId) {
  return redis.get(`tlock:${channelId}`) === '1';
}

async function getTransferredChannels(userId) {
  return redis.smembers(`transferred:${userId}`);
}

async function isOwnerOrManager(channelId, userId) {
  const ownerId = await redis.get(`creator:${channelId}`);
  if (ownerId === userId) return true;
  
  const isManager = await redis.sismember(`vc:managers:${channelId}`, userId);
  return isManager;
}

async function hasPremiumAccess(guildId, userId) {
  return await redis.sismember(`premium_users:${guildId}`, userId);
}
/**
 * Trouve ou crée un salon texte associé à un salon vocal temporaire.
 * Le salon texte aura le même nom que le vocal, suffixé par -text.
 * @param {Guild} guild - L'objet Guild Discord.js
 * @param {VoiceChannel} voiceChannel - Le salon vocal temporaire
 * @returns {Promise<TextChannel>} Le salon texte associé
 */
async function getOrCreateTextChannel(guild, voiceChannel) {
  const textChannelName = `${voiceChannel.name}-text`;
  let textChannel = guild.channels.cache.find(
    c => c.type === 0 &&
      c.parentId === voiceChannel.parentId &&
      c.name === textChannelName
  );
  if (!textChannel) {
    const ownerId = voiceChannel.ownerId || (await redis.get(`creator:${voiceChannel.id}`));
    textChannel = await guild.channels.create({
      name: textChannelName,
      type: 0,
      parent: voiceChannel.parentId || null,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          allow: ['ViewChannel'],
        },
        {
          id: guild.members.me.id,
          allow: [
            'ViewChannel',
            'SendMessages',
            'EmbedLinks',
            'UseExternalEmojis',
            'ManageChannels'
          ],
        },
        {
          id: ownerId,
          allow: ['ViewChannel', 'SendMessages', 'ManageChannels'],
        }
      ]
    });
    // Ajout TTL sur la clé creator du salon textuel
    if (ownerId) {
      const pipeline = redis.pipeline();
      pipeline.set(`creator:${textChannel.id}`, ownerId);
      pipeline.expire(`creator:${textChannel.id}`, 86400);
      await pipeline.exec();
      console.log(`[TEXT CHANNEL] Created and set owner for ${textChannel.id}`);
    }
  }
  return textChannel;
}

module.exports = {
  isChannelOwner,
  isBotCreatedChannel,
  transferOwnership,
  checkOwnership,
  getChannelState,
  getChannelSetting,
  getChannelOwner,
  getPermittedRoles,
  getRejectedRoles,
  getRejectedUsers,
  getSoundboardState,
  getPendingRequests,
  getChannelStatus,
  isTextLocked,
  getTransferredChannels,
  getOrCreateTextChannel,
  isOwnerOrManager,
};
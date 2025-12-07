const { redis } = require('../redisClient');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    console.log(`[CHANNEL DELETE] Channel deleted: ${channel.name} (${channel.id})`);
    
    // Only process voice channels that were managed by the bot
    if (channel.type !== 2) return; // 2 = VoiceChannel
    
    try {
      // Check if this was a bot-managed channel
      const creatorId = await redis.get(`creator:${channel.id}`);
      if (!creatorId) {
        console.log(`[CHANNEL DELETE] Channel ${channel.id} was not bot-managed, skipping cleanup`);
        return;
      }
      
      console.log(`[CHANNEL DELETE] Cleaning up Redis data for channel ${channel.id}`);
      
      // Comprehensive cleanup of all channel-related Redis keys
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
        `rejected_users:${channel.id}`,
        `hidden_lock_state:${channel.id}`,
        `task_timer:${channel.id}`,
        `task_ready:${channel.id}`,
        `temp_channel_active:${channel.id}`,
        `protected:${channel.id}`,
        `denied_users:${channel.id}`,
        `tlock:${channel.id}`,
        `access_requests:${channel.id}`,
        `vc:managers:${channel.id}`,
        `transferred:${channel.id}`,
        `channel_${channel.id}`,
        `temp_${channel.id}`,
        `voice_${channel.id}`
      ];
      
      // Use pipeline for efficient cleanup
      const pipeline = redis.pipeline();
      keys.forEach(key => {
        pipeline.del(key);
      });
      
      // Also remove from guild's temp channels set
      if (channel.guild) {
        pipeline.srem(`guild:${channel.guild.id}:tempchannels`, channel.id);
      }
      
      await pipeline.exec();
      
      console.log(`[CHANNEL DELETE] ✅ Successfully cleaned up Redis data for channel ${channel.id}`);
      
      // Log to dashboard if available
      if (global.addBotLog) {
        global.addBotLog('info', `Channel deleted and cleaned: ${channel.name} (${channel.id})`);
      }
      
    } catch (error) {
      console.error(`[CHANNEL DELETE] ❌ Error cleaning up channel ${channel.id}:`, error);
    }
  }
};

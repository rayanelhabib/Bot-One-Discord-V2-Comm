const { redis } = require('../redisClient');
const { DEFAULT_CONFIG } = require('../utils/configManager');
const { REST, Routes } = require('discord.js');


module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    console.log(`Joined new guild: ${guild.name} (${guild.id})`);

    try {
      // Ne crée plus de catégorie ni de salon vocal automatiquement
      // Enregistre seulement la config par défaut sans IDs de salons
      const initialConfig = {
        ...DEFAULT_CONFIG,
        createChannelId: null,
        tempChannelCategory: null,
        guildId: guild.id
      };
      await redis.set(`guild:${guild.id}:config`, JSON.stringify(initialConfig));

      // Enregistrement des commandes slash
      const rest = new REST({ version: '10' }).setToken(client.token);
      const commandsData = Array.from(client.commands.slash.values()).map(cmd => cmd.data.toJSON());
      const route = Routes.applicationGuildCommands(client.user.id, guild.id);
      const result = await rest.put(route, { body: commandsData });

      console.log(`⚡ Registered ${result.length} slash commands in ${guild.id}`);

    } catch (error) {
      console.error(`💀 Failed to setup guild ${guild.id}:`, error);
    }
  }
}

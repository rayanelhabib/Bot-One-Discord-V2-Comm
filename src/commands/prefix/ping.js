const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Check bot latency',
  usage: '.v ping',
  async execute(message, args, client) {
    try {
      // Optimisation maximale: calcul immédiat sans async
      const startTime = process.hrtime.bigint();
      const apiLatency = client.ws.ping;
      
      // Création d'un embed pour une meilleure présentation
      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong!')
        .setDescription('Bot latency information')
        .addFields(
          { name: '🤖 Bot Latency', value: `${Math.round(Number(process.hrtime.bigint() - startTime) / 1000000)}ms`, inline: true },
          { name: '🌐 API Latency', value: `${apiLatency}ms`, inline: true },
          { name: '📊 Status', value: apiLatency < 50 ? '🚀 Excellent' : apiLatency < 100 ? '✅ Good' : apiLatency < 200 ? '⚠️ Fair' : '❌ Poor', inline: true }
        )
        .setColor('#00B2FF')
        .setTimestamp()
        .setFooter({ text: 'OneTab - Voice management' });
      
      // Réponse ultra-rapide avec embed
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('[PING] Error:', error);
      await message.reply('❌ Error checking bot latency.').catch(() => {});
    }
  }
};
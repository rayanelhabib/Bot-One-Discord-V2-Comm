const { 
  EmbedBuilder,
  TextDisplayBuilder,
  ContainerBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'ping',
  description: 'Check bot latency',
  usage: '.v ping',
  async execute(message, args, client) {
    try {
      // Optimisation maximale: calcul immédiat sans async
      const startTime = process.hrtime.bigint();
      const apiLatency = client.ws.ping;
      
      // Calcul des latences
      const botLatency = Math.round(Number(process.hrtime.bigint() - startTime) / 1000000);
      const status = apiLatency < 50 ? '🚀 Excellent' : apiLatency < 100 ? '✅ Good' : apiLatency < 200 ? '⚠️ Fair' : '❌ Poor';
      
      // === DISCORD COMPONENTS V2 PING PANEL ===
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

      // Bouton de rafraîchissement
      const refreshButton = new ButtonBuilder()
        .setCustomId('ping_refresh')
        .setLabel('Refresh')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄');

      const buttonRow = new ActionRowBuilder().addComponents(refreshButton);

      // Container principal
      const container = new ContainerBuilder()
        .addTextDisplayComponents(titleText, latencyText, footerText)
        .addActionRowComponents(buttonRow);
      
      // Réponse avec Discord Components V2
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
      });
    } catch (error) {
      console.error('[PING] Error:', error);
      await message.reply('❌ Error checking bot latency.').catch(() => {});
    }
  }
};
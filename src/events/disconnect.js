// Gestionnaire pour nettoyer les connexions vocales lors de l'arrêt du bot
process.on('SIGINT', () => {
  console.log('[VOICE SURVEILLANCE] Arrêt du bot détecté, nettoyage des connexions vocales...');
  if (global.client && global.client.voiceSurveillance) {
    global.client.voiceSurveillance.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[VOICE SURVEILLANCE] Arrêt du bot détecté, nettoyage des connexions vocales...');
  if (global.client && global.client.voiceSurveillance) {
    global.client.voiceSurveillance.cleanup();
  }
  process.exit(0);
});

module.exports = {};

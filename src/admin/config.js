// Configuration pour les fonctionnalités d'administration du bot

const BOT_CONFIG = {
  // URLs du bot
  INVITE_URL: 'https://discord.com/oauth2/authorize?client_id=1409259003481165876&permissions=8&integration_type=0&scope=bot+applications.commands',
  SUPPORT_SERVER: 'https://discord.gg/wyWGcKWssQ',
  GITHUB_URL: 'https://github.com/rayanelhabib',
  DOCS_URL: 'https://your-docs-website.com',
  PREMIUM_URL: 'https://your-premium-website.com',
  
  // Permissions requises pour le bot
  REQUIRED_PERMISSIONS: [
    'Manage Channels',
    'Manage Roles', 
    'Send Messages',
    'Use Slash Commands',
    'Embed Links',
    'Attach Files',
    'Read Message History',
    'Connect to Voice',
    'Speak in Voice',
    'Use Voice Activity'
  ],
  
  // Statistiques du bot
  STATS: {
    COMMANDS_COUNT: 25,
    FEATURES_COUNT: 15,
    SUPPORT_AVAILABILITY: '24/7'
  },
  
  // Fonctionnalités premium
  PREMIUM_FEATURES: [
    'Unlimited voice channels',
    'Advanced permissions',
    'Custom channel names',
    'Priority support',
    'Beta features access',
    'Custom emojis and themes',
    'Advanced analytics',
    'Custom commands'
  ],
  
  // Prix premium
  PRICING: {
    MONTHLY: 5.99,
    YEARLY: 49.99,
    YEARLY_SAVINGS: 30
  }
};

module.exports = BOT_CONFIG;

require('dotenv').config();

console.log('🔍 Test de configuration Redis...');
console.log('================================');

// Afficher les variables Redis
console.log('REDIS_URL:', process.env.REDIS_URL);
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***SET***' : 'NOT SET');
console.log('REDIS_DB:', process.env.REDIS_DB);

console.log('\n🔧 Test de détection Redis...');

// Logique de détection Redis (copiée de redisClient.js)
const hasRedisConfig = (process.env.REDIS_HOST && 
                        process.env.REDIS_HOST !== 'localhost' && 
                        process.env.REDIS_HOST !== 'disabled') || 
                       (process.env.REDIS_URL && process.env.REDIS_URL !== '') || 
                       (process.env.REDIS_PORT && process.env.REDIS_PORT !== '0');

console.log('hasRedisConfig:', hasRedisConfig);

if (hasRedisConfig) {
    console.log('✅ Redis sera activé !');
    
    // Test de connexion Redis
    const Redis = require('ioredis');
    
    try {
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: process.env.REDIS_DB || 0,
            connectTimeout: 5000,
            commandTimeout: 3000
        };
        
        console.log('Configuration Redis:', {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password ? '***SET***' : 'NOT SET',
            db: redisConfig.db
        });
        
        const redis = new Redis(redisConfig);
        
        redis.on('connect', () => {
            console.log('✅ Redis connecté !');
            redis.disconnect();
        });
        
        redis.on('error', (error) => {
            console.log('❌ Erreur Redis:', error.message);
        });
        
        // Test de ping
        setTimeout(async () => {
            try {
                const result = await redis.ping();
                console.log('✅ Ping Redis réussi:', result);
                redis.disconnect();
            } catch (error) {
                console.log('❌ Ping Redis échoué:', error.message);
            }
        }, 2000);
        
    } catch (error) {
        console.log('❌ Erreur création client Redis:', error.message);
    }
} else {
    console.log('❌ Redis ne sera PAS activé');
}

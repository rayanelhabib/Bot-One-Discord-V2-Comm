# Configuration Redis - Guide d'exemple

## Configuration automatique (recommandée)

Le bot détecte automatiquement si Redis est disponible et s'adapte en conséquence.

## Configuration manuelle Redis

Si vous voulez utiliser Redis, configurez ces variables d'environnement :

### Option 1: REDIS_URL (recommandée)
```env
REDIS_URL=redis://username:password@host:port/database
```

### Option 2: Configuration séparée
```env
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Option 3: Redis Cloud / Upstash
```env
REDIS_URL=rediss://username:password@host:port
```

## Configuration bot-hosting.net

### Sans Redis (par défaut)
```env
DISCORD_TOKEN=your_bot_token
BOT_PREFIX=.v
```

### Avec Redis
```env
DISCORD_TOKEN=your_bot_token
BOT_PREFIX=.v
REDIS_URL=your_redis_url_here
```

## Vérification

Le bot affichera :
- **Sans Redis :** `⚠️ No Redis configuration found, running without Redis...`
- **Avec Redis :** `✅ Redis client created, attempting connection...`

## Avantages Redis

- Rate limiting avancé
- Cache persistant
- Meilleures performances
- Gestion des sessions

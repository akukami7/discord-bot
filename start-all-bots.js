import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load root .env file (optional on Render — env vars are injected directly)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('[Master] Loaded .env file.');
} else {
  console.log('[Master] No .env file found — using environment variables from host (Render/Docker/etc.).');
}

// Validate required root env vars
const requiredRootVars = ['MONGO_URI'];
for (const key of requiredRootVars) {
  if (!process.env[key]) {
    console.error(`[Master] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Bot configurations with environment variable mappings
const bots = [
  {
    name: 'Tickets Bot',
    cwd: __dirname,
    envMap: {
      TOKEN: process.env.TOKEN,
      CLIENT_ID: process.env.CLIENT_ID,
      GUILD_ID: process.env.GUILD_ID,
      MONGO_URI: process.env.MONGO_URI,
      EMBED_COLOR: process.env.EMBED_COLOR,
      EMBED_ACCENT: process.env.EMBED_ACCENT,
      TICKETS_CATEGORY_ID: process.env.TICKETS_CATEGORY_ID,
      TICKETS_LOG_CHANNEL_ID: process.env.TICKETS_LOG_CHANNEL_ID,
    },
  },
  {
    name: 'MainBot',
    cwd: path.join(__dirname, 'main'),
    envMap: {
      TOKEN: process.env.MAIN_TOKEN,
      CLIENT_ID: process.env.MAIN_CLIENT_ID,
      GUILD_ID: process.env.MAIN_GUILD_ID,
      MONGO_URI: process.env.MAIN_MONGO_URI,
      EMBED_COLOR: process.env.MAIN_EMBED_COLOR,
      EMBED_ACCENT: process.env.MAIN_EMBED_ACCENT,
      TIMELY_AMOUNT: process.env.MAIN_TIMELY_AMOUNT,
      TIMELY_COOLDOWN: process.env.MAIN_TIMELY_COOLDOWN,
      STAR_TO_COIN_RATE: process.env.MAIN_STAR_TO_COIN_RATE,
      XP_COOLDOWN: process.env.MAIN_XP_COOLDOWN,
      XP_MIN: process.env.MAIN_XP_MIN,
      XP_MAX: process.env.MAIN_XP_MAX,
    },
  },
  {
    name: 'ModeratorBot',
    cwd: path.join(__dirname, 'moderator'),
    envMap: {
      TOKEN: process.env.MOD_TOKEN,
      CLIENT_ID: process.env.MOD_CLIENT_ID,
      GUILD_ID: process.env.MOD_GUILD_ID,
      MONGO_URI: process.env.MOD_MONGO_URI,
      EMBED_COLOR: process.env.MOD_EMBED_COLOR,
      EMBED_ACCENT: process.env.MOD_EMBED_ACCENT,
      STAFF_ROLE_ID: process.env.MOD_STAFF_ROLE_ID,
      ADMIN_PANEL_CHANNEL_ID: process.env.MOD_ADMIN_PANEL_CHANNEL_ID,
      REPORT_CHANNEL_ID: process.env.MOD_REPORT_CHANNEL_ID,
      BLACKLIST_LOG_CHANNEL_ID: process.env.MOD_BLACKLIST_LOG_CHANNEL_ID,
    },
  },
];

const processes = [];
const restartAttempts = new Map();
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_BACKOFF_MS = 5000;

function startBot(bot) {
  console.log(`[Master] Starting ${bot.name}...`);

  // Check if token exists
  if (!bot.envMap.TOKEN) {
    console.error(`[Master] No TOKEN found for ${bot.name}. Skipping...`);
    return;
  }

  // Validate required env vars for this bot
  if (!bot.envMap.GUILD_ID) {
    console.error(`[Master] No GUILD_ID found for ${bot.name}. Skipping...`);
    return;
  }

  // Create child environment (merge with process.env)
  const childEnv = {
    ...process.env,
    ...bot.envMap,
    NODE_ENV: process.env.NODE_ENV || 'production',
  };

  const child = spawn('node', ['src/index.js'], {
    cwd: bot.cwd,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  // Pipe child output to parent with prefix
  child.stdout?.on('data', (data) => {
    process.stdout.write(`[${bot.name}] ${data}`);
  });

  child.stderr?.on('data', (data) => {
    process.stderr.write(`[${bot.name}] ${data}`);
  });

  const attemptKey = bot.name;
  let attempts = restartAttempts.get(attemptKey) || 0;

  child.on('exit', (code, signal) => {
    console.log(`[Master] ${bot.name} exited with code ${code} (signal: ${signal})`);
    const idx = processes.findIndex(p => p.name === bot.name);
    if (idx !== -1) processes.splice(idx, 1);

    // Auto-restart with backoff if not a clean exit
    if (code !== 0 && code !== null) {
      attempts++;
      restartAttempts.set(attemptKey, attempts);

      if (attempts <= MAX_RESTART_ATTEMPTS) {
        const delay = RESTART_BACKOFF_MS * attempts;
        console.log(`[Master] Restarting ${bot.name} in ${delay / 1000}s (attempt ${attempts}/${MAX_RESTART_ATTEMPTS})...`);
        setTimeout(() => {
          startBot(bot);
        }, delay);
      } else {
        console.error(`[Master] ${bot.name} exceeded max restart attempts. Not restarting.`);
      }
    }

    if (processes.length === 0) {
      const allBotsStopped = bots.every(b => {
        const hasProcess = processes.some(p => p.name === b.name);
        const maxAttempts = restartAttempts.get(b.name) || 0;
        return !hasProcess && maxAttempts > MAX_RESTART_ATTEMPTS;
      });

      if (allBotsStopped) {
        console.log('[Master] All bots stopped. Exiting...');
        process.exit(1);
      }
    }
  });

  child.on('error', (err) => {
    console.error(`[Master] ${bot.name} error:`, err);
  });

  processes.push({ name: bot.name, process: child });
  console.log(`[Master] ${bot.name} started successfully (PID: ${child.pid})`);
  return child;
}

function shutdown() {
  console.log('[Master] Shutting down all bots...');

  // Clear all restart timeouts by removing from array
  processes.forEach(({ name, process: child }) => {
    console.log(`[Master] Stopping ${name}...`);
    child.kill('SIGTERM');
  });

  // Clear restart attempts map
  restartAttempts.clear();

  setTimeout(() => {
    console.log('[Master] Force exiting...');
    process.exit(0);
  }, 10000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('[Master] Initializing all bots...');
bots.forEach(startBot);

// --- RENDER.COM 24/7 KEEP-ALIVE SERVER ---
// Render requires web services to bind to a port within a time limit.
// This simple HTTP server fulfills that requirement.
import http from 'http';

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot manager is alive and running.');
  }
});

server.listen(PORT, () => {
  console.log(`[Master] Local HTTP Web Server listening on port ${PORT} for Render.com keep-alive.`);
});

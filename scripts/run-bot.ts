import { createServer } from 'net';
import { initializeDiscordBot } from '../lib/discord-bot';
import { getAlertPollIntervalMs } from '../lib/alert-config';
import 'dotenv/config';

const BOT_SINGLETON_PORT = Number(process.env.BOT_LOCK_PORT ?? 45731);

/** Only one bot process at a time — prevents double Discord replies */
function acquireSingletonLock(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            'Another bot instance is already running! Stop it first (Ctrl+C in that terminal), then run npm run bot again.'
          )
        );
      } else {
        reject(err);
      }
    });
    server.listen(BOT_SINGLETON_PORT, '127.0.0.1', () => resolve());
  });
}

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const alertChannelId = process.env.DISCORD_ALERT_CHANNEL_ID?.trim();
  const alertPollIntervalMs = getAlertPollIntervalMs();

  const validAlertChannelId =
    alertChannelId && /^\d{17,20}$/.test(alertChannelId) ? alertChannelId : undefined;

  if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables');
    process.exit(1);
  }

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (!groqKey || groqKey === 'your_groq_api_key_here' || !groqKey.startsWith('gsk_')) {
    console.warn('⚠️  GROQ_API_KEY missing or invalid — replies will use friendly text templates');
  } else {
    console.log('✅ Groq LLM configured');
  }

  try {
    await acquireSingletonLock();
  } catch (error) {
    console.error('❌', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log('🤖 Starting Office Energy Monitor Discord Bot...');
  console.log(`📡 API Base URL: ${apiBaseUrl}`);
  console.log(`⏱️  Alert poll every ${alertPollIntervalMs / 1000}s`);
  if (process.env.CONTINUOUS_ON_THRESHOLD_SEC) {
    console.log(`🧪 Demo mode: continuous-on alert after ${process.env.CONTINUOUS_ON_THRESHOLD_SEC}s`);
  }
  if (validAlertChannelId) {
    console.log(`🔔 Alert Channel: ${validAlertChannelId}`);
  }

  try {
    await initializeDiscordBot({
      token,
      apiBaseUrl,
      alertChannelId: validAlertChannelId,
      alertPollIntervalMs,
    });
    console.log('✅ Bot connected — listening for messages');
  } catch (error) {
    console.error('❌ Failed to initialize bot:', error);
    process.exit(1);
  }
}

main();

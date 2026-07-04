import {
  Client,
  IntentsBitField,
  EmbedBuilder,
  ActivityType,
  type Message,
  type TextChannel,
} from 'discord.js';
import { polishForDiscord, answerNaturally } from './llm';
import {
  buildOfficeFacts,
  buildHumanStatusMessage,
  buildHumanRoomMessage,
  formatUsageExact,
  fetchDashboardState,
  fetchAlerts,
  formatProactiveAlertStats,
  resolveRoomId,
} from './bot-helpers';
import type { Alert } from './types';

interface BotConfig {
  token: string;
  apiBaseUrl: string;
  alertChannelId?: string;
  alertPollIntervalMs?: number;
}

const sentAlertIds = new Set<string>();
/** Prevent duplicate handling if the same message event fires twice */
const handledMessageIds = new Map<string, number>();
const MESSAGE_DEDUP_TTL_MS = 60_000;

function markMessageHandled(messageId: string): boolean {
  const now = Date.now();
  if (handledMessageIds.has(messageId)) return false;

  handledMessageIds.set(messageId, now);

  // Cleanup old entries
  for (const [id, ts] of handledMessageIds) {
    if (now - ts > MESSAGE_DEDUP_TTL_MS) handledMessageIds.delete(id);
  }

  return true;
}

export async function initializeDiscordBot(config: BotConfig) {
  const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent,
      IntentsBitField.Flags.DirectMessages,
    ],
  });

  client.once('ready', () => {
    console.log(`Discord bot ready as ${client.user?.tag}`);
    client.user?.setActivity('Office Energy | !help', { type: ActivityType.Watching });

    if (config.alertChannelId) {
      startProactiveAlertMonitor(client, config);
      console.log(`Proactive alerts enabled → channel ${config.alertChannelId}`);
    } else {
      console.log('DISCORD_ALERT_CHANNEL_ID not set — proactive alerts disabled');
    }
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!markMessageHandled(message.id)) return;

    const content = message.content.trim();
    if (!content) return;

    const isCommand = content.startsWith('!');
    const args = isCommand ? content.slice(1).trim().split(/ +/) : [];
    const command = isCommand ? args.shift()?.toLowerCase() : undefined;

    try {
      if (!isCommand) {
        await handleNaturalMessage(message, config.apiBaseUrl);
        return;
      }

      switch (command) {
        case 'status':
          await handleStatusCommand(message, config.apiBaseUrl);
          break;
        case 'room':
          await handleRoomCommand(message, args.join(' '), config.apiBaseUrl);
          break;
        case 'usage':
          await handleUsageCommand(message, config.apiBaseUrl);
          break;
        case 'help':
          await handleHelpCommand(message);
          break;
        default:
          await handleNaturalMessage(message, config.apiBaseUrl, content);
          break;
      }
    } catch (error) {
      console.error('Command error:', error);
      await message.reply(
        "Sorry, I couldn't reach the office data right now. Make sure the dashboard is running (`npm run dev`) and try again!"
      );
    }
  });

  await client.login(config.token);
  return client;
}

async function handleStatusCommand(message: Message, apiBaseUrl: string) {
  const state = await fetchDashboardState(apiBaseUrl);
  const baseline = buildHumanStatusMessage(state);
  const text = await polishForDiscord(baseline, buildOfficeFacts(state));
  await message.reply(text);
}

async function handleRoomCommand(
  message: Message,
  roomName: string,
  apiBaseUrl: string
) {
  const state = await fetchDashboardState(apiBaseUrl);
  const roomId = resolveRoomId(roomName);

  if (!roomId || !state.rooms[roomId]) {
    await message.reply(
      `Hmm, I don't know a room called "${roomName || '(empty)'}". Try \`!room drawing\`, \`!room work1\`, or \`!room work2\`.`
    );
    return;
  }

  const room = state.rooms[roomId];
  const baseline = buildHumanRoomMessage(room, state.officeTime);
  const text = await polishForDiscord(baseline, buildOfficeFacts(state));
  await message.reply(text);
}

async function handleUsageCommand(message: Message, apiBaseUrl: string) {
  const state = await fetchDashboardState(apiBaseUrl);
  // Exact factual format — no LLM so kWh is never dropped
  await message.reply(formatUsageExact(state));
}

async function handleHelpCommand(message: Message) {
  const embed = new EmbedBuilder()
    .setColor(0x62d3a2)
    .setTitle('Office Energy Monitor')
    .setDescription(
      'Quick checks without opening the dashboard. I pull live data and reply in plain English (powered by Groq).'
    )
    .addFields(
      { name: '!status', value: 'Full office overview — every room' },
      { name: '!room <name>', value: '`drawing`, `work1`, or `work2`' },
      { name: '!usage', value: 'Current watts + today\'s kWh estimate' },
      { name: 'Or just chat', value: 'Ask me anything about office energy — no `!` needed' }
    )
    .setFooter({ text: 'Tip: only run one bot instance (npm run bot) to avoid double replies' })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

async function handleNaturalMessage(
  message: Message,
  apiBaseUrl: string,
  userText?: string
) {
  const state = await fetchDashboardState(apiBaseUrl);
  const facts = buildOfficeFacts(state);
  const prompt = userText ?? message.content;
  const text = await answerNaturally(prompt, facts);

  if (text.length > 2000) {
    await message.reply(text.slice(0, 1997) + '...');
  } else {
    await message.reply(text);
  }
}

function startProactiveAlertMonitor(client: Client, config: BotConfig) {
  const interval = config.alertPollIntervalMs ?? 15_000;

  const poll = async () => {
    try {
      const data = await fetchAlerts(config.apiBaseUrl);
      const alerts: Alert[] = data.alerts ?? [];

      if (!config.alertChannelId) return;

      const channel = await client.channels.fetch(config.alertChannelId);
      if (!channel || !channel.isTextBased()) return;

      const textChannel = channel as TextChannel;
      const activeIds = new Set(alerts.map((a) => a.id));

      for (const id of sentAlertIds) {
        if (!activeIds.has(id)) sentAlertIds.delete(id);
      }

      for (const alert of alerts) {
        if (sentAlertIds.has(alert.id)) continue;

        const state = await fetchDashboardState(config.apiBaseUrl);
        const stats = formatProactiveAlertStats(alert, state);

        const embed = new EmbedBuilder()
          .setColor(alert.type === 'after-hours' ? 0xef4444 : 0xf59e0b)
          .setTitle(stats.title)
          .setDescription(stats.description)
          .addFields(stats.fields)
          .setTimestamp(new Date(alert.timestamp))
          .setFooter({ text: 'Office Energy Monitor · Live stats' });

        await textChannel.send({ embeds: [embed] });
        sentAlertIds.add(alert.id);
      }
    } catch (error) {
      console.error('Proactive alert poll error:', error);
    }
  };

  void poll();
  setInterval(poll, interval);
}

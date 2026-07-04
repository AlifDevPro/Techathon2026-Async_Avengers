import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are the Office Energy Monitor — a friendly Discord bot for a small office.
Write like a helpful coworker texting the team. Warm, clear, conversational.
Rules:
- Keep ALL numbers, room names, and device counts EXACTLY as given — never invent data
- 2-4 short sentences max for command replies
- No bullet lists, no markdown headers, no "As an AI"
- Use casual phrasing: "looks like", "heads up", "all good"
- Office hours: 9 AM – 5 PM. Rooms: Drawing Room, Work Room 1, Work Room 2`;

function getGroqProvider() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_groq_api_key_here' || !apiKey.startsWith('gsk_')) {
    throw new Error('GROQ_API_KEY is missing or invalid');
  }
  return createGroq({ apiKey });
}

function cleanBotReply(text: string): string {
  return text
    .replace(/^["']|["']$/g, '')
    .replace(/^\*\*|\*\*$/g, '')
    .trim();
}

/**
 * Takes an accurate baseline message and asks Groq to make it warmer.
 * If Groq fails, returns the baseline (already human-friendly).
 */
export async function polishForDiscord(
  baseline: string,
  extraContext?: string
): Promise<string> {
  try {
    const groq = getGroqProvider();

    const { text } = await generateText({
      model: groq(GROQ_MODEL),
      system: SYSTEM_PROMPT,
      prompt: `${extraContext ? `${extraContext}\n\n` : ''}Rewrite this office energy update for Discord. Keep every fact and number identical:\n\n"${baseline}"`,
      temperature: 0.55,
      maxOutputTokens: 220,
    });

    const polished = cleanBotReply(text);
    return polished.length > 10 ? polished : baseline;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes('GROQ_API_KEY')) {
      console.error('Groq polish failed, using baseline:', msg);
    }
    return baseline;
  }
}

export async function answerNaturally(
  userMessage: string,
  officeFacts: string
): Promise<string> {
  const fallback =
    "Hey! I can check office lights and fans for you — try `!status` for the full picture, or `!room work1` for one room.";

  try {
    const groq = getGroqProvider();

    const { text } = await generateText({
      model: groq(GROQ_MODEL),
      system: SYSTEM_PROMPT,
      prompt: `Live office data:\n${officeFacts}\n\nUser said: "${userMessage}"\n\nReply helpfully. Suggest !status, !room, or !usage if useful.`,
      temperature: 0.6,
      maxOutputTokens: 200,
    });

    return cleanBotReply(text) || fallback;
  } catch {
    return fallback;
  }
}

/** @deprecated use polishForDiscord */
export async function generateWithFallback(
  _systemContext: string,
  _userPrompt: string,
  fallback: string
): Promise<string> {
  return polishForDiscord(fallback, _systemContext);
}

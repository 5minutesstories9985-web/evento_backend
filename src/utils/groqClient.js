import Groq from 'groq-sdk';
import { env } from '../config/env.js';

const client = env.groqApiKey ? new Groq({ apiKey: env.groqApiKey }) : null;

export const groqEnabled = () => Boolean(client);

/** Chat completion → raw text. Throws if Groq isn't configured. */
export async function groqChat(messages, { json = false, temperature = 0.4 } = {}) {
  if (!client) throw new Error('GROQ_API_KEY not configured');
  const res = await client.chat.completions.create({
    model: env.groqModel,
    messages,
    temperature,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });
  return res.choices[0]?.message?.content ?? '';
}

/** Chat completion expecting JSON → parsed object, or null on any failure. */
export async function groqJson(messages, opts = {}) {
  try {
    const text = await groqChat(messages, { ...opts, json: true });
    return JSON.parse(text);
  } catch (e) {
    console.warn('[groq] json failed:', e.message);
    return null;
  }
}

import { groqEnabled, groqJson, groqChat } from '../../utils/groqClient.js';
import * as vendors from '../vendors/vendor.service.js';

// Fixed fallback split used when Groq is unavailable or returns junk.
const FALLBACK = [
  { label: 'Hall', pct: 0.4 },
  { label: 'Food', pct: 0.3 },
  { label: 'Decor', pct: 0.1 },
  { label: 'Photography', pct: 0.1 },
  { label: 'Misc', pct: 0.1 },
];

function fallbackBudget(total) {
  return FALLBACK.map((f) => ({ label: f.label, amount: Math.round(total * f.pct) }));
}

export async function suggestBudget(category, totalBudget) {
  if (!groqEnabled()) return { items: fallbackBudget(totalBudget), source: 'fallback' };

  const out = await groqJson([
    {
      role: 'system',
      content:
        'You are an Indian event budget planner. Split the total budget into sensible ' +
        'categories for the event type. Amounts must sum to the total (INR). ' +
        'Reply JSON: {"items":[{"label":"Hall","amount":200000}, ...]}.',
    },
    { role: 'user', content: `Event type: ${category}. Total budget: ${totalBudget} INR.` },
  ]);

  const items = out?.items?.filter((i) => i.label && typeof i.amount === 'number');
  if (!items?.length) return { items: fallbackBudget(totalBudget), source: 'fallback' };
  return { items, source: 'ai' };
}

export async function chat(event, message, history = []) {
  // Pull owned vendors near the event as grounding context (if geocoded).
  let nearby = [];
  const coords = event.location?.coordinates;
  if (coords) {
    nearby = await vendors.nearby({ lat: coords[1], lng: coords[0], limit: 20 });
  }

  if (!groqEnabled()) {
    return {
      reply:
        'AI chat is not configured (set GROQ_API_KEY). Here are nearby vendors I found.',
      vendors: nearby,
    };
  }

  const context = nearby.map((v) => ({
    name: v.name,
    category: v.category,
    phone: v.phone,
    rating: v.rating,
    startingPrice: v.startingPrice,
  }));

  try {
    const reply = await groqChat([
      {
        role: 'system',
        content:
          `You are the Smart Event Assistant for "${event.name}" (${event.category}) at ${event.venue}. ` +
          `Answer concisely and recommend from these nearby vendors when relevant: ${JSON.stringify(context)}. ` +
          'If none match, say so honestly.',
      },
      ...history.slice(-6),
      { role: 'user', content: message },
    ]);
    return { reply, vendors: nearby };
  } catch (e) {
    // Don't 500 the client on a Groq hiccup — degrade to the grounded vendor list.
    console.warn('[ai] chat failed:', e.message);
    return {
      reply: nearby.length
        ? 'I had trouble reaching the AI just now, but here are relevant vendors near your venue.'
        : 'I had trouble reaching the AI just now. Please try again in a moment.',
      vendors: nearby,
    };
  }
}

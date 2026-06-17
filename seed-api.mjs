// One-off live seeder: creates Tamil Nadu events + vendor service listings via
// the public API (so everything is geocoded the same way the app does it).
// Run: node seed-api.mjs   (override host with BASE=... node seed-api.mjs)
const BASE = process.env.BASE || 'https://eventobackend-production-4bfc.up.railway.app/api';
const SEED = { name: 'TN Events Co', email: 'seed-tn@evento.app', password: 'seed12345', role: 'vendor' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

async function auth() {
  let r = await api('/auth/register', { method: 'POST', body: SEED });
  if (r.status === 201 || r.status === 200) return r.json.token;
  // Already exists → log in.
  r = await api('/auth/login', { method: 'POST', body: { email: SEED.email, password: SEED.password } });
  if (r.json?.token) return r.json.token;
  throw new Error('auth failed: ' + JSON.stringify(r.json));
}

const day = (n) => new Date(Date.now() + n * 86400000).toISOString();

// Venues use "Area, City, Tamil Nadu" strings that geocode reliably.
const events = [
  { name: 'Priya & Arjun Wedding', category: 'wedding', venue: 'T Nagar, Chennai, Tamil Nadu', dateTime: day(14), totalBudget: 800000 },
  { name: 'Karthik Reception Gala', category: 'reception', venue: 'Anna Nagar, Chennai, Tamil Nadu', dateTime: day(21), totalBudget: 500000 },
  { name: 'Meena Engagement', category: 'engagement', venue: 'Gandhipuram, Coimbatore, Tamil Nadu', dateTime: day(9), totalBudget: 300000 },
  { name: 'Aadhya 1st Birthday', category: 'birthday', venue: 'RS Puram, Coimbatore, Tamil Nadu', dateTime: day(5), totalBudget: 150000 },
  { name: 'TechWave Corporate Meet', category: 'corporate', venue: 'OMR, Chennai, Tamil Nadu', dateTime: day(30), totalBudget: 600000 },
  { name: 'Lakshmi Baby Shower', category: 'baby shower', venue: 'Madurai, Tamil Nadu', dateTime: day(11), totalBudget: 120000 },
  { name: 'New Home Pooja', category: 'house warming', venue: 'Trichy, Tamil Nadu', dateTime: day(7), totalBudget: 90000 },
  { name: 'Pongal Cultural Fest', category: 'festival', venue: 'Salem, Tamil Nadu', dateTime: day(40), totalBudget: 250000 },
];

// Service listings concentrated around Chennai so the Chennai events rank them.
const vendors = [
  { name: 'Sri Saravana Catering', category: 'caterer', phone: '+919840012301', startingPrice: 350, address: 'T Nagar, Chennai, Tamil Nadu', rating: 4.6, reviewCount: 212 },
  { name: 'Annapoorna Caterers', category: 'caterer', phone: '+919840012302', startingPrice: 280, address: 'Anna Nagar, Chennai, Tamil Nadu', rating: 4.4, reviewCount: 158 },
  { name: 'DJ Pulse Events', category: 'dj', phone: '+919840012303', startingPrice: 18000, address: 'Velachery, Chennai, Tamil Nadu', rating: 4.7, reviewCount: 96 },
  { name: 'BeatBox DJ', category: 'dj', phone: '+919840012304', startingPrice: 15000, address: 'Adyar, Chennai, Tamil Nadu', rating: 4.3, reviewCount: 64 },
  { name: 'Lens & Light Studio', category: 'photographer', phone: '+919840012305', startingPrice: 45000, address: 'Mylapore, Chennai, Tamil Nadu', rating: 4.8, reviewCount: 173 },
  { name: 'Candid Tales Photography', category: 'photographer', phone: '+919840012306', startingPrice: 38000, address: 'Nungambakkam, Chennai, Tamil Nadu', rating: 4.5, reviewCount: 121 },
  { name: 'Bloom Decorators', category: 'decorator', phone: '+919840012307', startingPrice: 60000, address: 'Adyar, Chennai, Tamil Nadu', rating: 4.6, reviewCount: 88 },
  { name: 'Royal Mandap Decor', category: 'decorator', phone: '+919840012308', startingPrice: 75000, address: 'Porur, Chennai, Tamil Nadu', rating: 4.4, reviewCount: 73 },
  { name: 'Grand Events Organizers', category: 'organizer', phone: '+919840012309', startingPrice: 100000, address: 'Guindy, Chennai, Tamil Nadu', rating: 4.7, reviewCount: 142 },
  { name: 'Shree Makeup Artistry', category: 'makeup', phone: '+919840012310', startingPrice: 25000, address: 'Besant Nagar, Chennai, Tamil Nadu', rating: 4.9, reviewCount: 205 },
  { name: 'Glam Bridal Studio', category: 'makeup', phone: '+919840012311', startingPrice: 30000, address: 'Kilpauk, Chennai, Tamil Nadu', rating: 4.6, reviewCount: 117 },
  { name: 'Chennai Travels Fleet', category: 'vehicle', phone: '+919840012312', startingPrice: 8000, address: 'Egmore, Chennai, Tamil Nadu', rating: 4.2, reviewCount: 54 },
  { name: 'Star Entertainment', category: 'entertainment', phone: '+919840012313', startingPrice: 20000, address: 'Vadapalani, Chennai, Tamil Nadu', rating: 4.3, reviewCount: 69 },
  { name: 'GRT Grand Stay', category: 'hotel', phone: '+919840012314', startingPrice: 4500, address: 'T Nagar, Chennai, Tamil Nadu', rating: 4.5, reviewCount: 311 },
  // A few around Coimbatore for the CBE events.
  { name: 'Kovai Caterers', category: 'caterer', phone: '+919840012315', startingPrice: 300, address: 'RS Puram, Coimbatore, Tamil Nadu', rating: 4.5, reviewCount: 98 },
  { name: 'Kovai Frames Photography', category: 'photographer', phone: '+919840012316', startingPrice: 35000, address: 'Gandhipuram, Coimbatore, Tamil Nadu', rating: 4.4, reviewCount: 61 },
];

(async () => {
  const token = await auth();
  console.log('authed as seed vendor');

  let ev = 0;
  for (const e of events) {
    const r = await api('/events', { method: 'POST', token, body: { ...e, organizerName: SEED.name } });
    const ok = r.status === 201 && r.json?.location?.coordinates;
    console.log(`event ${ok ? '✓' : '✗'} ${e.name} ${ok ? r.json.location.coordinates : JSON.stringify(r.json)}`);
    if (ok) ev++;
    await sleep(400);
  }

  let vn = 0;
  for (const v of vendors) {
    const r = await api('/vendors', { method: 'POST', token, body: v });
    const ok = r.status === 201 && r.json?.location?.coordinates;
    console.log(`vendor ${ok ? '✓' : '✗'} ${v.name} ${ok ? '' : JSON.stringify(r.json)}`);
    if (ok) vn++;
    await sleep(400);
  }

  console.log(`\nDone: ${ev}/${events.length} events, ${vn}/${vendors.length} vendors seeded.`);
})().catch((e) => { console.error(e); process.exit(1); });

# Evento Backend

Node.js + Express + MongoDB backend with a Groq AI layer and a free OpenStreetMap
geo stack (Nominatim geocode · Overpass nearby POIs · OSRM routing). Powers the
**Smart Event Assistant** and is the migration target for the Flutter app's data.

## Run locally

```bash
cp .env.example .env       # then set GROQ_API_KEY (optional) and MONGODB_URI
npm install
npm run seed               # optional: starter vendors around Chennai
npm run dev                # http://localhost:4000
```

Needs a MongoDB. Quickest: `docker run -d -p 27017:27017 mongo:7` (default URI already
points at `mongodb://127.0.0.1:27017/evento`).

Self-check (pure ranking logic, no DB): `npm test`.

## API (all under `/api`, JWT required except `/auth`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register`, `/auth/login` | get a JWT |
| CRUD | `/events`, `/events/:id` | events (venue geocoded on create) |
| GET | `/events/:id/nearby-services?category=` | distance-sorted services |
| GET | `/events/:id/recommendations?category=` | AI-ranked top-10 + justification |
| GET | `/vendors/search`, `/vendors/nearby` | vendor lookup |
| GET | `/maps/geocode`, `/maps/directions`, `/maps/nearby` | OSM proxy (cached) |
| POST | `/ai/budget`, `/ai/chat` | Groq budget split + chat |
| CRUD | `/tickets` `/attendees` `/expenses` `/reminders` `/bookings` | migrated collections (owner-scoped, idempotent by `clientId`) |

Categories: `caterer dj photographer decorator organizer entertainment vehicle makeup hotel`.

## Deploy to Railway

1. New project → Deploy from repo (this `backend/` dir). Uses the `Dockerfile`.
2. Add the **MongoDB** plugin (or an Atlas URI) → sets `MONGODB_URI`.
3. Set vars: `JWT_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`.
4. Point the app at it: `flutter run --dart-define=API_BASE_URL=https://<app>.up.railway.app/api`.

## Notes / known ceilings

- **Groq is optional.** Without `GROQ_API_KEY`: budget uses a fixed split, chat returns
  raw nearby vendors, recommendations still rank (no AI justification). With the key,
  the AI layer activates — no code change.
- **OSM data is geo-only** (no ratings/prices/phone). Rich vendor data lives in the
  `Vendor` collection (seed it). OSM POIs are flagged `estimated` in responses.
- **Public Nominatim/Overpass/OSRM** are rate-limited dev servers (1 req/s, proxied +
  cached in the `locations` collection). For real traffic, self-host or use a paid geo
  provider — only `src/utils/osm.js` and the `*_URL` env vars change.

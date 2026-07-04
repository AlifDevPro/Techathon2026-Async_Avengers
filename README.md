# Office Energy Monitor

**IUT Hackathon — Preliminary Round**  
A real-time office energy monitoring system with a web dashboard and Discord bot, sharing one backend for live device and power data.

---

## Table of Contents

1. [Problem Statement Understanding](#a-problem-statement-understanding)
2. [Solution Approach and Architecture](#b-solution-approach-and-architecture)
3. [Technologies Used](#c-technologies-used)
4. [Setup and Installation](#d-setup-and-installation-instructions)
5. [How to Run the Application](#e-how-to-run-the-application)
6. [API Endpoints Documentation](#f-api-endpoints-documentation)
7. [AI Integration Details](#g-ai-integration-details)

---

## a. Problem Statement Understanding

### Context

A small office uses Discord for daily communication, but staff often leave **lights and fans running** after leaving. Electricity costs rise, and nobody notices until the bill arrives. The challenge is to build a system that lets anyone monitor office electrical devices and energy usage through:

1. A **real-time web dashboard**
2. A **Discord bot** for quick remote checks

No physical hardware is required — device data is **simulated** but must behave realistically and stay in sync across both interfaces.

### Fixed Office Configuration

| Item | Specification |
|------|----------------|
| Rooms | Drawing Room, Work Room 1, Work Room 2 |
| Devices per room | 3 lights (15 W each) + 2 fans (60 W each) |
| Total devices | **15** |
| Office hours | 9:00 AM – 5:00 PM |
| Max total power | 495 W (all devices on) |

### Core Requirements

| Requirement | Our Implementation |
|-------------|-------------------|
| Live device status by room | Dashboard device panel + floor plan |
| Live power meter (total + per room) | Power meter component with room breakdown |
| Active alerts panel | After-hours, high consumption, continuous-on alerts |
| Discord `!status` | Humanized all-room summary from live API |
| Discord `!room <name>` | Room-specific status via Groq LLM |
| Discord `!usage` | Current watts + today's estimated kWh |
| Single shared backend | `lib/device-store.ts` — one source of truth |
| No page reload on dashboard | SWR polling every 4 seconds |
| Human-friendly bot responses | Groq LLM with factual baselines |

### Bonus Features Implemented

- Interactive office floor plan (lights glow, fans animate)
- Groq-powered conversational Discord replies (natural language, no `!` required)
- Proactive Discord alert embeds with live stats (power, lights, fans, kWh)
- Docker image — dashboard + bot in one container
- Accelerated simulated office clock for demo-friendly after-hours alerts

---

## b. Solution Approach and Architecture

### Design Principles

1. **Single source of truth** — All clients read from the same in-memory device store on the server.
2. **Factual baselines first** — Bot builds accurate messages from API data, then optionally polishes with LLM.
3. **Separation of concerns** — Simulation, alerts, API, UI, and bot are isolated modules.
4. **Demo-stable updates** — Slower simulation ticks (8 s) and dashboard polling (4 s) so dashboard and bot stay aligned.

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SIMULATION LAYER                             │
│  device-simulator.ts  →  realistic on/off patterns, office clock     │
│  device-store.ts      →  shared state, energy accumulation           │
│  alerts-engine.ts     →  after-hours / high-power / continuous-on  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js)                          │
│  GET/POST  /api/devices   →  full dashboard state                    │
│  GET       /api/alerts    →  active alerts + summary state           │
└───────────────┬──────────────────────────────┬───────────────────────┘
                │                              │
                ▼                              ▼
┌───────────────────────────┐   ┌────────────────────────────────────┐
│   WEB DASHBOARD           │   │   DISCORD BOT                      │
│   React + SWR polling     │   │   discord.js + Groq (Vercel AI SDK)│
│   /dashboard              │   │   !status / !room / !usage / chat  │
│   Power meter, alerts,    │   │   Proactive alert polling          │
│   floor plan, controls    │   │                                    │
└───────────────────────────┘   └────────────────────────────────────┘
```

### Data Flow

**Dashboard load**
```
Browser → GET /api/devices → device-store → JSON state → SWR cache → UI re-render
```

**Device toggle**
```
User clicks toggle → POST /api/devices → device-store updates → returns new state → UI updates
```

**Discord command**
```
User types !status → bot fetches GET /api/devices → builds baseline → Groq polishes → reply
```

**Proactive alert**
```
Bot polls GET /api/alerts every 30s → new alert detected → stats embed posted to Discord channel
```

### Project Structure

```
office-energy-monitor/
├── app/
│   ├── api/devices/route.ts       # REST API — device state
│   ├── api/alerts/route.ts        # REST API — alerts
│   └── dashboard/                 # Web UI
├── components/dashboard/          # Power meter, alerts, floor plan, controls
├── lib/
│   ├── device-store.ts            # Shared in-memory state (single source of truth)
│   ├── device-simulator.ts        # Device simulation logic
│   ├── alerts-engine.ts           # Alert rule evaluation
│   ├── discord-bot.ts             # Discord command handlers
│   ├── bot-helpers.ts             # Message formatting
│   ├── llm.ts                     # Groq integration
│   ├── alert-config.ts            # Alert timing configuration
│   └── simulation-config.ts       # Poll/simulation tuning
├── scripts/run-bot.ts             # Discord bot entrypoint
├── docker/entrypoint.sh           # Docker: starts Next.js + bot
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## c. Technologies Used

### Languages

| Language | Usage |
|----------|-------|
| **TypeScript** | Entire application — types, API, bot, simulation |
| **SQL** | Not used (in-memory store; database-ready architecture) |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | App Router, API routes, SSR |
| **React** | 19 | UI components |
| **Tailwind CSS** | v4 | Styling and design tokens |
| **Framer Motion** | 12 | Animations (power meter, alerts, floor plan) |
| **SWR** | 2.x | Client-side data fetching / polling |
| **next-themes** | 0.4 | Light / dark mode |

### Backend & Bot

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16 | REST endpoints |
| **Discord.js** | 14 | Discord bot framework |
| **dotenv** | 17 | Environment variable loading |

### AI / LLM

| Technology | Purpose |
|------------|---------|
| **Groq API** | Fast LLM inference |
| **Vercel AI SDK** (`ai`) | Unified `generateText` interface |
| **@ai-sdk/groq** | Groq provider for AI SDK |
| **Model: `llama-3.3-70b-versatile`** | Conversational bot responses |

### DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Multi-stage production image |
| **Docker Compose** | Single-command local deployment |
| **Node.js** | 22 (Alpine) in Docker; 20+ locally |

### External APIs

| API | Role |
|-----|------|
| **Discord Gateway API** | Bot messaging and events |
| **Groq Chat Completions API** | Natural language generation |

---

## d. Setup and Installation Instructions

### Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js 20+ | Local development |
| npm | Package manager |
| Git | Clone repository |
| Discord Developer Account | [discord.com/developers](https://discord.com/developers/applications) |
| Groq API Key | [console.groq.com](https://console.groq.com) (free tier available) |
| Docker Desktop | Optional — for container deployment |

### 1. Clone the Repository

```bash
git clone https://github.com/AlifDevPro/Techathon2026-Async_Avengers.git
cd Techathon2026-Async_Avengers
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_ALERT_CHANNEL_ID=your_discord_channel_id
API_BASE_URL=http://localhost:3000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
ALERT_POLL_INTERVAL_MS=30000
CONTINUOUS_ON_THRESHOLD_SEC=30
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes (for bot) | From Discord Developer Portal → Bot |
| `GROQ_API_KEY` | Recommended | Starts with `gsk_` |
| `DISCORD_ALERT_CHANNEL_ID` | Optional | For proactive alert embeds |
| `API_BASE_URL` | No | Default `http://localhost:3000` |
| `ALERT_POLL_INTERVAL_MS` | No | Bot alert poll interval (ms) |
| `CONTINUOUS_ON_THRESHOLD_SEC` | No | Demo mode: shorten continuous-on alert |

### 4. Discord Bot Setup

1. Create application at [Discord Developer Portal](https://discord.com/developers/applications)
2. **Bot** tab → **Add Bot** → enable **Message Content Intent**
3. Copy token → `DISCORD_BOT_TOKEN`
4. **OAuth2 → URL Generator** → scope `bot` → permissions: View Channels, Send Messages, Read History, Embed Links
5. Open generated URL → invite bot to your server
6. Enable **Developer Mode** in Discord → right-click channel → **Copy Channel ID** → `DISCORD_ALERT_CHANNEL_ID`

### 5. Groq API Setup

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create API key → paste into `GROQ_API_KEY`

---

## e. How to Run the Application

### Option 1 — Local Development (two terminals)

**Terminal 1 — Dashboard and API:**
```bash
npm run dev
```

**Terminal 2 — Discord bot:**
```bash
npm run bot
```

| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000/dashboard |
| API | http://localhost:3000/api/devices |

### Option 2 — Production Build (local)

```bash
npm run build
npm start          # Terminal 1 — serves on :3000
npm run bot        # Terminal 2
```

### Option 3 — Docker (dashboard + bot, single command)

**Build locally:**
```bash
docker build -t office-energy-monitor:latest .
```

**Run:**
```bash
docker run -d \
  --name office-energy \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  office-energy-monitor:latest
```

**Docker Compose:**
```bash
docker compose up -d
```

**Pull from Docker Hub (no rebuild):**
```bash
docker pull AlifDevPro/office-energy-monitor:latest

docker run -d \
  --name office-energy \
  -p 3000:3000 \
  --env-file .env \
  AlifDevPro/office-energy-monitor:latest
```

### Verify It Works

```bash
# API health
curl http://localhost:3000/api/devices

# Discord (in your server channel)
!status
!room work1
!usage
!help
```

### Publish to Docker Hub (maintainers)

```bash
docker login
docker build -t AlifDevPro/office-energy-monitor:latest .
docker push AlifDevPro/office-energy-monitor:latest
```

Or:
```bash
bash scripts/docker-publish.sh AlifDevPro latest
```

---

## f. API Endpoints Documentation

Base URL: `http://localhost:3000` (or your deployed host)

All endpoints return `Content-Type: application/json` and disable caching.

---

### `GET /api/devices`

Returns the complete live dashboard state.

**Response `200 OK`**

```json
{
  "devices": [
    {
      "id": "light-drawing-1",
      "name": "Light 1",
      "type": "light",
      "room": "drawing",
      "status": "on",
      "power": 15,
      "lastToggled": 1780000000000
    }
  ],
  "totalPower": 135,
  "totalDevicesOn": 3,
  "maxPower": 495,
  "energyToday": 5420.5,
  "officeTime": "2:45 PM",
  "isOfficeHours": true,
  "rooms": {
    "drawing": {
      "id": "drawing",
      "name": "drawing",
      "displayName": "Drawing Room",
      "devices": [],
      "totalPower": 45
    },
    "work1": { },
    "work2": { }
  },
  "alerts": [],
  "timestamp": 1780000000000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `devices` | `Device[]` | All 15 devices |
| `totalPower` | `number` | Current draw in watts |
| `totalDevicesOn` | `number` | Count of devices with `status: "on"` |
| `maxPower` | `number` | Maximum possible draw (495 W) |
| `energyToday` | `number` | Cumulative energy today in **watt-hours (Wh)** |
| `officeTime` | `string` | Simulated office clock, e.g. `"6:30 PM"` |
| `isOfficeHours` | `boolean` | `true` between 9 AM – 5 PM simulated |
| `rooms` | `object` | Per-room device lists and `totalPower` |
| `alerts` | `Alert[]` | Active alert conditions |
| `timestamp` | `number` | Server timestamp (ms) |

**Errors**

| Status | Body |
|--------|------|
| `500` | `{ "error": "Failed to fetch devices" }` |

---

### `POST /api/devices`

Toggle a device on or off.

**Request body**

```json
{
  "deviceId": "fan-work1-2",
  "status": "off"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `deviceId` | `string` | Yes | e.g. `light-drawing-1`, `fan-work2-1` |
| `status` | `string` | Yes | `"on"` or `"off"` |

**Response `200 OK`** — Full updated `DashboardState` (same shape as `GET /api/devices`)

**Errors**

| Status | Body |
|--------|------|
| `400` | `{ "error": "Invalid deviceId or status" }` |
| `500` | `{ "error": "Failed to update device" }` |

**Device ID format:** `{type}-{room}-{index}`  
Examples: `light-drawing-1`, `fan-work1-2`, `light-work2-3`

---

### `GET /api/alerts`

Returns active alerts and a summary state snapshot. Used by the Discord bot for proactive notifications.

**Response `200 OK`**

```json
{
  "alerts": [
    {
      "id": "after-hours",
      "type": "after-hours",
      "title": "Devices Left On After Hours",
      "message": "At 6:49 PM (simulated office time), 2 device(s) still on — ...",
      "timestamp": 1780000000000,
      "resolved": false
    }
  ],
  "state": {
    "totalPower": 75,
    "energyToday": 5400,
    "officeTime": "6:49 PM",
    "isOfficeHours": false,
    "totalDevicesOn": 2
  },
  "timestamp": 1780000000000
}
```

**Alert types**

| Type | Trigger |
|------|---------|
| `after-hours` | Devices on outside 9 AM – 5 PM simulated |
| `high-consumption` | Total power > 75% of max, or all devices on too long |
| `info` | Reserved for future use |

**Errors**

| Status | Body |
|--------|------|
| `500` | `{ "error": "Failed to fetch alerts" }` |

---

## g. AI Integration Details

### Overview

This project uses **Groq** as the LLM provider for Discord bot responses. There is **no custom model training** — we use a pre-trained instruction-tuned model via API with carefully designed prompts and factual baselines.

### Model

| Setting | Value |
|---------|-------|
| Provider | [Groq](https://groq.com) |
| Model | `llama-3.3-70b-versatile` (configurable via `GROQ_MODEL`) |
| SDK | Vercel AI SDK (`ai` + `@ai-sdk/groq`) |
| API | Groq OpenAI-compatible chat completions |

### Integration Architecture

```
Live API data (/api/devices)
        │
        ▼
buildHumanStatusMessage() / buildOfficeFacts()   ← factual baseline (no AI)
        │
        ├── !usage  → formatUsageExact()         ← exact format, no LLM
        │
        ├── Proactive alerts → stats embed       ← no LLM
        │
        └── !status / !room / natural chat
                │
                ▼
         polishForDiscord() / answerNaturally()
                │
                ▼
         Groq llama-3.3-70b-versatile
                │
                ▼
         Human-friendly Discord reply
```

### Prompt Strategy (not training)

We use a **baseline + polish** pattern instead of asking the LLM to invent data:

1. **Fetch live state** from `/api/devices`
2. **Build a factual baseline** string with exact numbers (device counts, watts, kWh)
3. **Send to Groq** with a system prompt that enforces:
   - Keep all numbers identical
   - Conversational coworker tone
   - 2–4 short sentences
   - No bullet lists or "As an AI" phrasing
4. **Fallback** — if Groq fails or `GROQ_API_KEY` is missing, return the baseline text

**System prompt excerpt:**
```
You are the Office Energy Monitor — a friendly Discord bot for a small office.
Keep ALL numbers, room names, and device counts EXACTLY as given — never invent data.
Office hours: 9 AM – 5 PM. Rooms: Drawing Room, Work Room 1, Work Room 2.
```

### Where AI Is Used vs Not Used

| Feature | LLM Used? | Method |
|---------|-----------|--------|
| `!status` | Yes | Groq polishes factual baseline |
| `!room <name>` | Yes | Groq polishes room baseline |
| `!usage` | **No** | Exact string: `Total power right now: XW. Today's estimated usage: Y kWh.` |
| `!help` | No | Static Discord embed |
| Natural chat (no `!`) | Yes | Groq with full office context |
| Proactive alerts | **No** | Structured Discord embed with live stats |
| Dashboard | No | Direct API data only |

### Configuration

```env
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### Error Handling

- Invalid or missing API key → bot uses human-friendly text templates (no crash)
- Groq API timeout / 401 → logged to console; fallback baseline returned
- `!usage` never depends on LLM — ensures hackathon-required format is always correct

### Why Groq?

- **Low latency** — sub-second responses suitable for Discord
- **Free tier** — accessible for hackathon demos
- **OpenAI-compatible API** — works seamlessly with Vercel AI SDK
- **No training required** — instruction following via prompt engineering only

---

## Discord Bot Command Reference

| Command | Example output |
|---------|----------------|
| `!status` | *"Drawing Room: 1 fan ON, 2 lights ON. Work Room 1: all off..."* |
| `!room work1` | Room-specific friendly summary |
| `!usage` | `Total power right now: 135W. Today's estimated usage: 5.4 kWh.` |
| `!help` | Command list embed |
| `What's using the most power?` | Natural Groq reply with live context |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot does not reply | Enable **Message Content Intent** in Discord Developer Portal |
| Double bot replies | Run only one `npm run bot` or one Docker container |
| API returns 500 | Restart `npm run dev`; check terminal for compile errors |
| Groq errors in logs | Verify `GROQ_API_KEY`; bot still works with fallbacks |
| Port 3000 busy | `netstat -ano \| findstr :3000` → kill PID or use `-p 3001:3000` |
| Docker bot cannot reach API | Do not override `API_BASE_URL` in Docker (defaults to `127.0.0.1:3000`) |

---

## License

MIT — educational and hackathon use.

---

## Author

**IUT Hackathon — Preliminary Round**  
Office Energy Monitor — Web Dashboard + Discord Bot + Groq LLM Integration

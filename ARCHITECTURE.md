# System Architecture

## Overview

The Office Energy Monitor is a modern full-stack application with a web dashboard frontend and Discord bot backend, all sharing a unified API for device management and status updates.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐         ┌──────────────────────────┐  │
│  │  Web Dashboard      │         │  Discord Bot Client      │  │
│  │  (Next.js/React)    │         │  (Discord.js)            │  │
│  │  - PowerMeter       │         │  - Command Handlers      │  │
│  │  - DeviceCounter    │         │  - Message Processing    │  │
│  │  - DevicePanel      │         │  - LLM Integration       │  │
│  │  - OfficeLayout     │         │                          │  │
│  │  - Alerts           │         │                          │  │
│  └─────────┬───────────┘         └──────────────┬───────────┘  │
│            │                                    │               │
└────────────┼────────────────────────────────────┼───────────────┘
             │ HTTP/REST (SWR Polling)           │ Discord API
             │                                    │
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes                                              │  │
│  │  /api/devices                                            │  │
│  │    - GET: Fetch all devices & state                      │  │
│  │    - POST: Toggle device on/off                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Device Simulator (lib/device-simulator.ts)             │   │
│  │                                                         │   │
│  │  - initializeDevices()                                 │   │
│  │  - simulateDeviceStateChange()                         │   │
│  │  - getDashboardState()                                 │   │
│  │  - checkAlerts()                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Discord Bot (lib/discord-bot.ts)                       │   │
│  │                                                         │   │
│  │  - initializeDiscordBot()                              │   │
│  │  - handleStatusCommand()                               │   │
│  │  - handleRoomCommand()                                 │   │
│  │  - handleUsageCommand()                                │   │
│  │  - handleConversational()                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Type System (lib/types.ts)                             │   │
│  │                                                         │   │
│  │  - Device                                              │   │
│  │  - Room                                                │   │
│  │  - DashboardState                                      │   │
│  │  - Alert                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────┐
        │  IN-MEMORY STATE STORE                │
        │  (Global device state - in dev mode)   │
        │  (Can be replaced with DB in prod)     │
        └───────────────────────────────────────┘
```

## Component Architecture

### Web Dashboard Components

```
DashboardClient (app/dashboard/dashboard-client.tsx)
├── Header
│   ├── Logo & Title
│   ├── Time Display
│   └── Theme Toggle + Navigation
│
├── PowerMeter (Main Stats Card)
│   ├── Total Power Display
│   ├── Animated Power Bar
│   ├── Room Breakdown
│   └── Alert Warning
│
├── DeviceCounter (Lights/Fans Summary)
│   ├── Lights Counter Card
│   │   ├── Glowing Icon
│   │   ├── Count Display (X/Total)
│   │   └── Visual Light Indicators
│   │
│   └── Fans Counter Card
│       ├── Wind Icon
│       ├── Count Display (X/Total)
│       └── Rotating Fan Indicators
│
├── AlertsPanel
│   ├── System Status
│   └── Individual Alerts
│
└── DevicePanel
    ├── RoomSection (Drawing Room)
    │   ├── Room Header
    │   ├── Lights
    │   │   └── DeviceCard[] (3 lights)
    │   └── Fans
    │       └── DeviceCard[] (2 fans)
    │
    ├── RoomSection (Work Room 1)
    │   └── (Same structure)
    │
    └── RoomSection (Work Room 2)
        └── (Same structure)
```

### OfficeLayout Component (Floor Plan View)

```
OfficeLayoutClient
├── Header (with back navigation)
├── OfficeLayout
│   ├── SVG Canvas (1000x400)
│   ├── RoomVisualization (Drawing Room)
│   │   ├── Room Border
│   │   ├── Room Name
│   │   ├── Light Icons (3x)
│   │   │   └── Animated glow effect
│   │   ├── Fan Icons (2x)
│   │   │   └── Rotating animation
│   │   └── Power Display
│   │
│   ├── RoomVisualization (Work Room 1)
│   │   └── (Same structure)
│   │
│   ├── RoomVisualization (Work Room 2)
│   │   └── (Same structure)
│   │
│   └── Legend (Room summary cards)
│
└── Info Panel
```

## Data Flow

### Initial Load

```
1. User opens dashboard
   ↓
2. DashboardClient mounts
   ↓
3. useDevices() hook triggers
   ↓
4. SWR fetches GET /api/devices
   ↓
5. API route queries device simulator
   ↓
6. Returns DashboardState with all devices
   ↓
7. Components render with animations
   ↓
8. SWR begins polling every 1.5s
```

### Real-time Updates

```
Every 1.5 seconds:
1. SWR fetches GET /api/devices
   ↓
2. Device simulator checks if state should change
   ↓
3. If changed, updates internal state
   ↓
4. Returns new DashboardState
   ↓
5. SWR detects data change
   ↓
6. Components re-render with Framer Motion animations
   ↓
7. User sees smooth transitions
```

### Device Toggle

```
1. User clicks device toggle
   ↓
2. toggleDevice(deviceId, newStatus) called
   ↓
3. POST /api/devices with device update
   ↓
4. API updates internal state
   ↓
5. Returns updated DashboardState
   ↓
6. SWR optimistically updates UI
   ↓
7. Components animate to new state
```

### Discord Command Flow

```
1. User types command in Discord
   ↓
2. Discord bot receives messageCreate event
   ↓
3. Parses command (e.g., "!status")
   ↓
4. Calls corresponding handler function
   ↓
5. Handler fetches data from API_BASE_URL/api/devices
   ↓
6. Processes data into formatted response
   ↓
7. For unknown commands, sends to Groq LLM
   ↓
8. LLM generates natural response
   ↓
9. Bot sends embedded message to Discord channel
```

## State Management Strategy

### Frontend State
- **SWR Cache**: Managed by the `useDevices()` hook
  - Automatic deduplication within 1 second
  - Revalidation on focus
  - Configurable refresh interval (1.5s)

- **Component State**: Local React state for UI-only changes
  - Theme (light/dark) - persisted via next-themes
  - Expanded rooms - local DevicePanel state
  - Time display - updated every second

### Backend State
- **In-Memory Store**: Global variable in API route
  - Simulated device states
  - Timestamps for animations
  - Alert conditions

**Production Note**: Replace with database (Neon, Supabase, etc.) for persistence

## Animation Strategy

### CSS Animations (Global)
```css
@keyframes power-flow
@keyframes glow-pulse
@keyframes rotate-smooth
@keyframes slide-in
```

### Framer Motion Animations (Component Level)
- Power meter gauge: Spring animation with damping
- Number transitions: Fade + scale
- Alert entries: Slide in from left
- Device toggle: Smooth color transitions
- Fan rotation: Continuous linear
- Light glow: Pulsing filter effect

## Type System

### Core Types

```typescript
type DeviceType = 'light' | 'fan';
type DeviceStatus = 'on' | 'off';

interface Device {
  id: string;
  name: string;
  type: DeviceType;
  room: 'drawing' | 'work1' | 'work2';
  status: DeviceStatus;
  power: number;
  lastToggled: number;
}

interface Room {
  id: string;
  name: string;
  displayName: string;
  devices: Device[];
  totalPower: number;
}

interface DashboardState {
  devices: Device[];
  totalPower: number;
  totalDevicesOn: number;
  rooms: Record<string, Room>;
  timestamp: number;
}

interface Alert {
  id: string;
  type: 'after-hours' | 'high-consumption' | 'info';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
}
```

## API Contract

### GET /api/devices

**Response (DashboardState)**
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
      "lastToggled": 1704067200000
    },
    // ... 14 more devices
  ],
  "totalPower": 450,
  "totalDevicesOn": 5,
  "rooms": {
    "drawing": {
      "id": "drawing",
      "name": "drawing",
      "displayName": "Drawing Room",
      "devices": [ /* filtered devices */ ],
      "totalPower": 150
    },
    // ... work1, work2
  },
  "timestamp": 1704067200000
}
```

### POST /api/devices

**Request**
```json
{
  "deviceId": "light-drawing-1",
  "status": "off"
}
```

**Response**: Same as GET (updated state)

## Discord Bot Integration

### Commands

| Command | Handler | Action |
|---------|---------|--------|
| !status | handleStatusCommand | Fetch overall status, embed response |
| !room <name> | handleRoomCommand | Get room status, LLM response |
| !usage | handleUsageCommand | Power breakdown, embed response |
| !help | handleHelpCommand | Show command list |
| (other) | handleConversational | Route to Groq LLM for response |

### LLM Integration (Groq/OpenAI)

```
Input: Device data from /api/devices
       User's Discord message
       Context about rooms/devices

Processing: 
- Groq LLM generates natural language response
- Uses AI SDK for standardized API

Output: Natural conversation in Discord
```

## Performance Considerations

### Optimization Strategies

1. **SWR Caching**
   - Deduplicates requests within 1 second
   - Prevents rapid re-fetches
   - Revalidates intelligently

2. **Component Memoization**
   - RoomSection memoized to prevent unnecessary re-renders
   - DeviceCard only re-renders if device data changes

3. **Animation Performance**
   - GPU-accelerated transforms (rotate, scale)
   - CSS animations for lights/fans (no JS overhead)
   - Framer Motion optimized for 60fps

4. **Code Splitting**
   - Layout component lazy-loaded
   - Dashboard components bundled together

### Benchmarks (Target)

- **First Paint**: < 2s
- **Dashboard Update**: < 500ms from API response
- **Animation FPS**: 60fps
- **API Response Time**: < 200ms

## Scalability Notes

### Current Limitations
- Single in-memory state store
- No database persistence
- No user authentication
- Single Discord bot instance

### For Production

1. **Database Layer**
   ```
   Neon/Supabase → Store device history
                 → Persist user settings
                 → Track events/logs
   ```

2. **Authentication**
   ```
   NextAuth/Better Auth → User accounts
                        → Role-based access
                        → API key management
   ```

3. **Real-time Updates**
   ```
   WebSocket/Socket.IO → Replace polling
                       → Server-push updates
                       → Subscription model
   ```

4. **Distributed Bot**
   ```
   Message Queue → Handle multiple Discord servers
                 → Load balancing
                 → Failover recovery
   ```

## Deployment Strategy

### Development
```bash
pnpm dev          # Dashboard on localhost:3000
pnpm bot          # Bot with API at localhost:3000
```

### Production
```
vercel deploy              # Next.js dashboard
NODE_ENV=production pnpm bot # Bot with API_BASE_URL
```

### Environment Variables

Required for production:
```
DISCORD_BOT_TOKEN      # Discord API token
OPENAI_API_KEY         # LLM API key
API_BASE_URL           # Dashboard API endpoint (for bot)
```

## Testing Strategy

### Unit Tests (Future)
- Device simulator functions
- State calculations
- Alert conditions

### Integration Tests (Future)
- API endpoints
- Discord commands
- Data flow

### E2E Tests (Future)
- Dashboard interaction
- Bot commands
- Real-time updates

## Security Considerations

1. **API Security**
   - Validate input on device toggle
   - Rate limit API endpoints
   - Add CORS headers

2. **Discord Bot**
   - Validate Discord tokens
   - Rate limit command processing
   - Sanitize user input for LLM

3. **Environment Variables**
   - Never commit secrets
   - Use .env.local for development
   - Store safely in production

## Future Enhancements

1. Database persistence (Neon)
2. User authentication (NextAuth)
3. WebSocket real-time updates
4. Device control from web dashboard
5. Historical data & trends
6. Custom alert thresholds
7. Scheduled automation
8. Mobile app version
9. Multi-user support
10. Advanced analytics

---

## Diagram Legend

```
┌─────────────────────┐
│   Component         │  Represents a module, service, or component
└─────────────────────┘

    ↓ or → (arrow)   Data or control flow
```

## References

- [Next.js 16 Documentation](https://nextjs.org)
- [React 19 Features](https://react.dev)
- [Discord.js Guide](https://discordjs.guide)
- [AI SDK Documentation](https://sdk.vercel.ai)
- [Framer Motion Docs](https://www.framer.com/motion)

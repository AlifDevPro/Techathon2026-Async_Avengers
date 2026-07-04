# Setup & Deployment Guide

## Quick Start (Development)

### 1. Install Dependencies
```bash
cd /vercel/share/v0-project
pnpm install
```

### 2. Run Dashboard
```bash
pnpm dev
```
Open http://localhost:3000 in your browser. The page will auto-redirect to `/dashboard`.

### 3. Run Discord Bot (Optional)
In a new terminal:
```bash
# First, create .env.local with your Discord token
cp .env.example .env.local
# Edit .env.local and add your tokens

# Then run the bot
pnpm bot
```

## Configuration

### Environment Variables

Create `.env.local` in the project root:

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# OpenAI API Key (for LLM responses)
OPENAI_API_KEY=your_openai_api_key_here

# API Configuration
API_BASE_URL=http://localhost:3000
```

### Getting Required Tokens

#### Discord Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "Office Energy Monitor")
4. Go to "Bot" tab → Click "Add Bot"
5. Under "TOKEN", click "Copy"
6. Paste into `DISCORD_BOT_TOKEN` in `.env.local`

#### Required Discord Bot Permissions
- Read Messages/View Channels
- Send Messages
- Embed Links
- Read Message History

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or login
3. Navigate to API keys section
4. Click "Create new secret key"
5. Copy and paste into `OPENAI_API_KEY` in `.env.local`

## Running the Application

### Dashboard Only
```bash
pnpm dev
```
- Runs on http://localhost:3000
- Auto-redirects to http://localhost:3000/dashboard
- Shows live device monitoring
- Updates every 1.5 seconds

### Dashboard + Bot
Terminal 1:
```bash
pnpm dev
```

Terminal 2:
```bash
pnpm bot
```

The bot will connect to Discord and listen for commands in any channel where it has permissions.

## Features Overview

### Dashboard Features

#### Main Dashboard (/dashboard)
- **Power Meter**: Real-time power consumption display
  - Animated power bar
  - Room breakdown (3 rooms)
  - Consumption alerts

- **Device Counter**: Lights and fans summary
  - Visual glowing light effects
  - Rotating fan animations
  - X/Total count display

- **Alert Panel**: System status notifications
  - After-hours alerts
  - High consumption warnings

- **Device Control**: Collapse/expand rooms
  - View all 15 devices (5 lights, 5 fans per 3 rooms)
  - Individual on/off toggles
  - Power draw display for each device

#### Office Layout (/dashboard/layout)
- Interactive floor plan visualization
- Top-down view of 3 office rooms
- Glowing lights and rotating fans
- Room power consumption summary
- Device legend

### Discord Bot Commands

```
!status       → Show overall office status
!room <name>  → Check specific room (drawing, work1, work2)
!usage        → View power consumption breakdown
!help         → Show available commands
```

Any unknown message will get an LLM-generated friendly response about office energy.

## Development Workflow

### File Structure
```
app/                          # Next.js app directory
├── api/devices/route.ts       # Device API endpoint
├── dashboard/
│   ├── page.tsx              # Dashboard entry
│   ├── dashboard-client.tsx   # Main component
│   └── layout/
│       ├── page.tsx          # Office layout page
│       └── office-layout-client.tsx
├── layout.tsx                # Root layout with theme
├── globals.css               # Design tokens & animations
└── page.tsx                  # Home redirect

components/dashboard/
├── header.tsx                # Navigation & theme toggle
├── power-meter.tsx           # Power display card
├── device-counter.tsx        # Lights/fans counters
├── device-panel.tsx          # Device list
├── room-section.tsx          # Room grouping
├── device-card.tsx           # Individual device
├── alerts-panel.tsx          # Alert notifications
└── office-layout.tsx         # Floor plan SVG

lib/
├── types.ts                  # TypeScript interfaces
├── device-simulator.ts       # Realistic usage patterns
├── discord-bot.ts            # Bot commands & handlers
└── hooks/use-devices.ts      # SWR data fetching hook

scripts/
└── run-bot.ts               # Bot runner script
```

### Making Changes

1. **Styling**: Edit `app/globals.css` for design tokens
2. **Components**: Add new components in `components/dashboard/`
3. **API**: Extend `app/api/devices/route.ts`
4. **Bot**: Modify `lib/discord-bot.ts` for new commands
5. **Types**: Update `lib/types.ts` for new data structures

### Testing Changes

- **Dashboard**: Run `pnpm dev`, changes auto-reload
- **Bot**: Restart bot with `pnpm bot`, changes require restart

## Deployment

### Deploy to Vercel (Dashboard Only)

1. Push code to GitHub repository
2. Go to [Vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set environment variables:
   - `OPENAI_API_KEY` (for LLM if bot also needed)
5. Click Deploy

### Deploy Bot to Production

The bot needs to run continuously. Options:

#### Option 1: VPS/Server
```bash
ssh your_server
cd project
pnpm install
pnpm build
export NODE_ENV=production
export API_BASE_URL=https://your-vercel-domain.com
export DISCORD_BOT_TOKEN=your_token
export OPENAI_API_KEY=your_key
pnpm bot
# Keep running in screen/tmux/systemd
```

#### Option 2: Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
ENV NODE_ENV=production
CMD ["pnpm", "bot"]
```

#### Option 3: Vercel Functions (Future)
With [Vercel Crons](https://vercel.com/docs/cron-jobs), could run bot logic on schedule.

## Troubleshooting

### Dashboard not updating
- Check browser console for errors
- Verify API route is responding: `curl http://localhost:3000/api/devices`
- Ensure `pnpm dev` is running

### Bot not responding
- Verify `DISCORD_BOT_TOKEN` is set correctly
- Check bot has message permissions in Discord server
- Look for errors in bot terminal output
- Ensure `API_BASE_URL` matches dashboard location

### LLM responses not working
- Verify `OPENAI_API_KEY` is set
- Check API key has credits
- Monitor OpenAI dashboard for usage/errors

### Styling issues
- Clear browser cache (Ctrl+Shift+R)
- Rebuild styles: `pnpm dev` usually handles this
- Check Tailwind CSS is properly configured

## Building for Production

```bash
# Build dashboard
pnpm build

# Test build locally
pnpm start

# Deploy
vercel deploy --prod
```

## Performance Optimization

### Current
- SWR polling every 1.5s
- ~60fps animations
- CSS optimizations enabled

### Future Improvements
- Replace polling with WebSocket (real-time)
- Add database indexing
- Cache historical data
- Implement service workers for offline mode

## Monitoring

### Dashboard Health
- Check browser DevTools for JS errors
- Monitor network tab for API requests
- Verify SWR cache behavior

### Bot Health
- Monitor terminal output for errors
- Check Discord logs for failed messages
- Track OpenAI API usage and costs

### Production
- Set up error tracking (Sentry)
- Monitor API response times
- Track device state anomalies
- Alert on high power consumption

## Backup & Recovery

### State Backup
Currently uses in-memory state. For production:

```bash
# Export device state periodically
curl http://localhost:3000/api/devices > backup_$(date +%s).json

# Restore from backup (manual)
# Implement restore endpoint in API
```

### Database Migration (Future)
When moving to Neon/Supabase:
1. Set up database
2. Run migrations
3. Implement DB layer in API routes
4. Update device simulator to use DB
5. Maintain real-time sync

## Security Checklist

- [ ] Never commit .env.local to git
- [ ] Use environment variables for all secrets
- [ ] Validate API input
- [ ] Rate limit API endpoints
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated (`pnpm update`)
- [ ] Review Discord bot permissions
- [ ] Monitor API key usage

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Port 3000 already in use | Another process | `lsof -i :3000` then kill process |
| Bot doesn't respond | Token invalid | Check `.env.local`, restart bot |
| Styling looks broken | CSS not loading | Run `pnpm dev` again |
| High API usage | Polling too frequent | Reduce refresh interval in `use-devices.ts` |
| Animations stutter | Performance issue | Check browser DevTools performance tab |

## Next Steps

1. Get Discord token and OpenAI key
2. Configure `.env.local`
3. Run `pnpm dev` for dashboard
4. Test device toggles and animations
5. Run `pnpm bot` for Discord integration
6. Try commands in Discord
7. Deploy to Vercel when ready

## Support Resources

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Tailwind**: https://tailwindcss.com
- **Framer Motion**: https://www.framer.com/motion/
- **Discord.js**: https://discord.js.org/
- **AI SDK**: https://sdk.vercel.ai

## Contact & Questions

This is a hackathon project. For questions about architecture or specific implementations, check the code comments and ARCHITECTURE.md documentation.

---

Happy monitoring! Let me know if you need any clarifications or adjustments.

import type { Alert, DashboardState, Room } from './types';

function roomDeviceSummary(room: Room): string {
  const fansOn = room.devices.filter((d) => d.type === 'fan' && d.status === 'on').length;
  const lightsOn = room.devices.filter((d) => d.type === 'light' && d.status === 'on').length;

  if (fansOn === 0 && lightsOn === 0) {
    return `${room.displayName}: all off`;
  }

  const parts: string[] = [];
  if (fansOn > 0) parts.push(`${fansOn} fan${fansOn > 1 ? 's' : ''} ON`);
  if (lightsOn > 0) parts.push(`${lightsOn} light${lightsOn > 1 ? 's' : ''} ON`);

  return `${room.displayName}: ${parts.join(', ')}`;
}

/** Hackathon-style human baseline — used as fallback and LLM source of truth */
export function buildHumanStatusMessage(state: DashboardState): string {
  const rooms = Object.values(state.rooms).map(roomDeviceSummary).join('. ');
  const timeNote = state.isOfficeHours
    ? `It's ${state.officeTime} — still office hours.`
    : `It's ${state.officeTime} — we're after hours, so anything still on is worth a look.`;

  return `Here's the office right now: ${rooms}. We're drawing ${state.totalPower}W total across ${state.totalDevicesOn} active devices. ${timeNote}`;
}

export function buildHumanRoomMessage(room: Room, officeTime: string): string {
  const fansOn = room.devices.filter((d) => d.type === 'fan' && d.status === 'on');
  const lightsOn = room.devices.filter((d) => d.type === 'light' && d.status === 'on');

  if (fansOn.length === 0 && lightsOn.length === 0) {
    return `Good news — ${room.displayName} is completely quiet right now. All lights and fans are off (${room.totalPower}W).`;
  }

  const fanText =
    fansOn.length > 0
      ? `${fansOn.length} fan${fansOn.length > 1 ? 's' : ''} running`
      : 'fans are off';
  const lightText =
    lightsOn.length > 0
      ? `${lightsOn.length} light${lightsOn.length > 1 ? 's' : ''} on`
      : 'lights are off';

  return `In ${room.displayName} at ${officeTime}: ${fanText}, ${lightText}. That's ${room.totalPower}W from this room.`;
}

export function buildHumanUsageMessage(state: DashboardState): string {
  return formatUsageExact(state);
}

/** Exact hackathon format for !usage — always includes current W and today kWh */
export function formatUsageExact(state: DashboardState): string {
  const kwh = (state.energyToday / 1000).toFixed(1);
  return `Total power right now: ${state.totalPower}W. Today's estimated usage: ${kwh} kWh.`;
}

/** Structured facts for LLM context */
export function buildOfficeFacts(state: DashboardState): string {
  const roomLines = Object.values(state.rooms).map((room) =>
    formatRoomFacts(room)
  );

  return [
    `Simulated office time: ${state.officeTime} (${state.isOfficeHours ? 'office hours' : 'after hours'})`,
    `Total power now: ${state.totalPower}W`,
    `Devices on: ${state.totalDevicesOn}/${state.devices.length}`,
    `Energy used today: ${(state.energyToday / 1000).toFixed(2)} kWh`,
    'Per room:',
    ...roomLines,
  ].join('\n');
}

export function formatRoomFacts(room: Room): string {
  const fansOn = room.devices.filter((d) => d.type === 'fan' && d.status === 'on');
  const lightsOn = room.devices.filter((d) => d.type === 'light' && d.status === 'on');

  if (fansOn.length === 0 && lightsOn.length === 0) {
    return `${room.displayName}: all off (${room.totalPower}W)`;
  }

  const fanPart =
    fansOn.length === 0
      ? 'no fans on'
      : `${fansOn.length} fan(s) ON: ${fansOn.map((d) => d.name).join(', ')}`;

  const lightPart =
    lightsOn.length === 0
      ? 'no lights on'
      : `${lightsOn.length} light(s) ON: ${lightsOn.map((d) => d.name).join(', ')}`;

  return `${room.displayName}: ${fanPart}, ${lightPart} — ${room.totalPower}W`;
}

/** @deprecated use buildHumanStatusMessage */
export function buildStatusFallback(state: DashboardState): string {
  return buildHumanStatusMessage(state);
}

/** @deprecated use buildHumanUsageMessage */
export function buildUsageFallback(state: DashboardState): string {
  return buildHumanUsageMessage(state);
}

const ROOM_ALIASES: Record<string, string> = {
  drawing: 'drawing',
  'drawing room': 'drawing',
  draw: 'drawing',
  work1: 'work1',
  'work 1': 'work1',
  'work room 1': 'work1',
  wr1: 'work1',
  work2: 'work2',
  'work 2': 'work2',
  'work room 2': 'work2',
  wr2: 'work2',
};

export function resolveRoomId(input?: string): string | null {
  if (!input) return null;
  const normalized = input.toLowerCase().trim();
  return ROOM_ALIASES[normalized] ?? (['drawing', 'work1', 'work2'].includes(normalized) ? normalized : null);
}

export async function fetchDashboardState(apiBaseUrl: string): Promise<DashboardState> {
  const response = await fetch(`${apiBaseUrl}/api/devices`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

export async function fetchAlerts(apiBaseUrl: string) {
  const response = await fetch(`${apiBaseUrl}/api/alerts`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) throw new Error(`Alerts API error: ${response.status}`);
  return response.json();
}

/** Plain stats alert for proactive Discord posts — no LLM */
export function formatProactiveAlertStats(
  alert: Alert,
  state: DashboardState
): { title: string; description: string; fields: { name: string; value: string; inline?: boolean }[] } {
  const lightsOn = state.devices.filter((d) => d.type === 'light' && d.status === 'on');
  const fansOn = state.devices.filter((d) => d.type === 'fan' && d.status === 'on');
  const lightsPower = lightsOn.reduce((s, d) => s + d.power, 0);
  const fansPower = fansOn.reduce((s, d) => s + d.power, 0);
  const kwhToday = (state.energyToday / 1000).toFixed(2);

  const roomLines = Object.values(state.rooms)
    .map((room) => {
      const rLights = room.devices.filter((d) => d.type === 'light' && d.status === 'on').length;
      const rFans = room.devices.filter((d) => d.type === 'fan' && d.status === 'on').length;
      if (rLights === 0 && rFans === 0) return `**${room.displayName}** — all off`;
      const parts: string[] = [];
      if (rLights > 0) parts.push(`${rLights} light${rLights > 1 ? 's' : ''} ON`);
      if (rFans > 0) parts.push(`${rFans} fan${rFans > 1 ? 's' : ''} ON`);
      return `**${room.displayName}** — ${parts.join(', ')} — ${room.totalPower}W`;
    })
    .join('\n');

  const hoursLabel = state.isOfficeHours ? 'Office hours' : 'After hours';

  return {
    title: `⚠️ ${alert.title}`,
    description: alert.message,
    fields: [
      { name: 'Office time', value: state.officeTime, inline: true },
      { name: 'Status', value: hoursLabel, inline: true },
      { name: 'Total power', value: `${state.totalPower}W`, inline: true },
      {
        name: 'Lights',
        value: `${lightsOn.length} on · ${lightsPower}W`,
        inline: true,
      },
      {
        name: 'Fans',
        value: `${fansOn.length} on · ${fansPower}W`,
        inline: true,
      },
      {
        name: 'Devices active',
        value: `${state.totalDevicesOn}/${state.devices.length}`,
        inline: true,
      },
      {
        name: 'Used today',
        value: `${kwhToday} kWh`,
        inline: true,
      },
      {
        name: 'Room breakdown',
        value: roomLines || 'All rooms off',
        inline: false,
      },
    ],
  };
}

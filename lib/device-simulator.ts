import type { Device, DashboardState, Room, DeviceStatus } from './types';
import { DEVICE_TOGGLE_CHANCE } from './simulation-config';

const LIGHT_POWER = 15; // watts
const FAN_POWER = 60; // watts
const OFFICE_HOURS_START = 9; // 9 AM
const OFFICE_HOURS_END = 17; // 5 PM

// A full simulated "office day" cycles every this many real seconds so the
// dashboard is always lively for demos and periodically shows after-hours alerts.
const DAY_CYCLE_SECONDS = 240; // 4 minutes = one simulated 24h day

/**
 * Returns a simulated hour (0-23.999) that advances quickly, so viewers always
 * see activity regardless of the real server time.
 */
export function getSimulatedHour(): number {
  const secondsIntoCycle = (Date.now() / 1000) % DAY_CYCLE_SECONDS;
  // Bias the cycle so most of the time is spent during office hours (more to see),
  // but still passes through evening/night to trigger after-hours alerts.
  return (secondsIntoCycle / DAY_CYCLE_SECONDS) * 24;
}

export function formatSimulatedTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

// Initialize devices with realistic office setup
export function initializeDevices(): Device[] {
  const devices: Device[] = [];
  
  const rooms = [
    { id: 'drawing', name: 'drawing' },
    { id: 'work1', name: 'work1' },
    { id: 'work2', name: 'work2' },
  ];

  rooms.forEach((room) => {
    // 2 fans per room
    for (let i = 1; i <= 2; i++) {
      devices.push({
        id: `fan-${room.id}-${i}`,
        name: `Fan ${i}`,
        type: 'fan',
        room: room.id as any,
        status: 'off',
        power: FAN_POWER,
        lastToggled: Date.now(),
      });
    }

    // 3 lights per room
    for (let i = 1; i <= 3; i++) {
      devices.push({
        id: `light-${room.id}-${i}`,
        name: `Light ${i}`,
        type: 'light',
        room: room.id as any,
        status: 'off',
        power: LIGHT_POWER,
        lastToggled: Date.now(),
      });
    }
  });

  return devices;
}

export function getRoom(devices: Device[], roomId: string): Room {
  const roomDevices = devices.filter((d) => d.room === roomId);
  const totalPower = roomDevices.reduce((sum, d) => sum + (d.status === 'on' ? d.power : 0), 0);

  const roomNames: Record<string, string> = {
    drawing: 'Drawing Room',
    work1: 'Work Room 1',
    work2: 'Work Room 2',
  };

  return {
    id: roomId,
    name: roomId,
    displayName: roomNames[roomId] || roomId,
    devices: roomDevices,
    totalPower,
  };
}

// Maximum possible power: 9 lights * 15W + 6 fans * 60W = 495W
export const MAX_POSSIBLE_POWER =
  9 * LIGHT_POWER + 6 * FAN_POWER;

export function getDashboardState(devices: Device[], energyToday = 0): DashboardState {
  const totalPower = devices.reduce((sum, d) => sum + (d.status === 'on' ? d.power : 0), 0);
  const totalDevicesOn = devices.filter((d) => d.status === 'on').length;
  const hour = getSimulatedHour();
  const isOfficeHours = hour >= OFFICE_HOURS_START && hour < OFFICE_HOURS_END;

  return {
    devices,
    totalPower,
    totalDevicesOn,
    maxPower: MAX_POSSIBLE_POWER,
    energyToday,
    officeTime: formatSimulatedTime(hour),
    isOfficeHours,
    rooms: {
      drawing: getRoom(devices, 'drawing'),
      work1: getRoom(devices, 'work1'),
      work2: getRoom(devices, 'work2'),
    },
    timestamp: Date.now(),
  };
}

// Realistic office usage simulation driven by the accelerated simulated clock.
export function simulateDeviceStateChange(devices: Device[]): Device[] {
  const hour = getSimulatedHour();
  const isOfficeHours = hour >= OFFICE_HOURS_START && hour < OFFICE_HOURS_END;
  // Ramp activity up in the morning and down in the evening for a natural curve.
  const isPeak = hour >= 10 && hour < 16;

  return devices.map((device) => {
    // Probability a device should currently be on
    let onProbability: number;
    if (isPeak) {
      onProbability = device.type === 'light' ? 0.8 : 0.6;
    } else if (isOfficeHours) {
      onProbability = device.type === 'light' ? 0.55 : 0.35;
    } else {
      // After hours: a few devices occasionally left on (triggers alerts)
      onProbability = 0.12;
    }

    let shouldBeOn = Math.random() < onProbability;

    // Add hysteresis: only toggle occasionally so states feel stable, not flickery
    const currentlyOn = device.status === 'on';
    const toggleChance = DEVICE_TOGGLE_CHANCE;
    if (Math.random() > toggleChance) {
      shouldBeOn = currentlyOn; // keep current state this cycle
    }

    if (shouldBeOn !== currentlyOn) {
      return {
        ...device,
        status: shouldBeOn ? 'on' : 'off',
        lastToggled: Date.now(),
      };
    }

    return device;
  });
}

/** Simulated hours — production default when CONTINUOUS_ON_THRESHOLD_SEC is not set */
export const CONTINUOUS_ON_THRESHOLD_HOURS = 2;

// Re-export for modules that import checkAlerts from device-simulator
export { checkAlerts } from './alerts-engine';

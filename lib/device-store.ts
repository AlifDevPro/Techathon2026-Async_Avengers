import {
  initializeDevices,
  getDashboardState,
  simulateDeviceStateChange,
  getSimulatedHour,
} from './device-simulator';
import { checkAlerts } from './alerts-engine';
import { DEVICE_SIMULATION_TICK_MS } from './simulation-config';
import type { Device, DashboardState, Alert } from './types';

const DAY_CYCLE_SECONDS = 240;
const TIME_ACCELERATION = 360;

let deviceState = simulateDeviceStateChange(initializeDevices());
let lastSimulationTime = Date.now();
let lastEnergyTick = Date.now();
let energyToday = 5400; // Wh — partial-day baseline for meaningful "Used Today"
let lastSimHour = getSimulatedHour();

/** Per-room timestamp (ms) when all devices in the room were first all ON */
const roomAllOnSince: Record<string, number> = {};

function withAlerts(state: DashboardState): DashboardState {
  return { ...state, alerts: checkAlerts(state, roomAllOnSince) };
}

function accumulateEnergy() {
  const now = Date.now();
  const simHour = getSimulatedHour();

  if (simHour < lastSimHour) {
    energyToday = 0;
    Object.keys(roomAllOnSince).forEach((k) => delete roomAllOnSince[k]);
  }
  lastSimHour = simHour;

  const currentPower = deviceState.reduce(
    (sum, d) => sum + (d.status === 'on' ? d.power : 0),
    0
  );
  const hoursElapsed =
    ((now - lastEnergyTick) / (1000 * 60 * 60)) * TIME_ACCELERATION;
  energyToday += currentPower * hoursElapsed;
  lastEnergyTick = now;
}

function updateRoomAllOnTracking(devices: Device[]) {
  const roomIds = ['drawing', 'work1', 'work2'] as const;

  for (const roomId of roomIds) {
    const roomDevices = devices.filter((d) => d.room === roomId);
    const allOn =
      roomDevices.length > 0 && roomDevices.every((d) => d.status === 'on');

    if (allOn) {
      if (!roomAllOnSince[roomId]) {
        roomAllOnSince[roomId] = Date.now();
      }
    } else {
      delete roomAllOnSince[roomId];
    }
  }
}

/** Convert real elapsed ms to simulated hours (accelerated clock). */
export function realMsToSimulatedHours(ms: number): number {
  return (ms / 1000 / DAY_CYCLE_SECONDS) * 24;
}

export function getRoomContinuousOnHours(roomId: string): number | null {
  const since = roomAllOnSince[roomId];
  if (!since) return null;
  return realMsToSimulatedHours(Date.now() - since);
}

export function tickSimulation(): DashboardState {
  accumulateEnergy();

  const now = Date.now();
  if (now - lastSimulationTime > DEVICE_SIMULATION_TICK_MS) {
    deviceState = simulateDeviceStateChange(deviceState);
    lastSimulationTime = now;
  }

  updateRoomAllOnTracking(deviceState);
  return getDashboardState(deviceState, energyToday);
}

export function getCurrentState(): DashboardState {
  return withAlerts(tickSimulation());
}

export function getCurrentAlerts(): Alert[] {
  const state = tickSimulation();
  return checkAlerts(state, roomAllOnSince);
}

export function toggleDevice(deviceId: string, status: 'on' | 'off'): DashboardState {
  accumulateEnergy();

  deviceState = deviceState.map((device) => {
    if (device.id === deviceId) {
      return {
        ...device,
        status: status === 'on' ? 'on' : 'off',
        lastToggled: Date.now(),
      };
    }
    return device;
  });

  updateRoomAllOnTracking(deviceState);
  return withAlerts(getDashboardState(deviceState, energyToday));
}

/** Reset store for tests */
export function resetDeviceStore() {
  deviceState = simulateDeviceStateChange(initializeDevices());
  lastSimulationTime = Date.now();
  lastEnergyTick = Date.now();
  energyToday = 5400;
  lastSimHour = getSimulatedHour();
  Object.keys(roomAllOnSince).forEach((k) => delete roomAllOnSince[k]);
}

export { CONTINUOUS_ON_THRESHOLD_HOURS } from './device-simulator';

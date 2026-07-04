import type { DashboardState } from './types';
import {
  getContinuousOnThresholdMs,
  formatContinuousOnDuration,
} from './alert-config';
import { MAX_POSSIBLE_POWER } from './device-simulator';

function formatAlertTime(_timestamp: number, officeTime: string): string {
  return `${officeTime} (simulated office time)`;
}

/**
 * Check alert conditions against a dashboard snapshot.
 * Uses state.isOfficeHours from the same snapshot to avoid clock drift.
 */
export function checkAlerts(
  state: DashboardState,
  roomAllOnSince?: Record<string, number>,
  continuousOnThresholdMs?: number
) {
  const isAfterHours = !state.isOfficeHours;
  const alerts = [];
  const now = Date.now();
  const timeLabel = formatAlertTime(now, state.officeTime);

  if (isAfterHours) {
    const afterHoursDevices = state.devices.filter((d) => d.status === 'on');
    if (afterHoursDevices.length > 0) {
      const byRoom = afterHoursDevices.reduce<Record<string, string[]>>((acc, d) => {
        const roomName = state.rooms[d.room]?.displayName ?? d.room;
        if (!acc[roomName]) acc[roomName] = [];
        acc[roomName].push(d.name);
        return acc;
      }, {});

      const detail = Object.entries(byRoom)
        .map(([room, names]) => `${room}: ${names.join(', ')}`)
        .join('; ');

      alerts.push({
        id: 'after-hours',
        type: 'after-hours' as const,
        title: 'Devices Left On After Hours',
        message: `At ${timeLabel}, ${afterHoursDevices.length} device(s) still on — ${detail}`,
        timestamp: now,
        resolved: false,
      });
    }
  }

  if (roomAllOnSince) {
    const thresholdMs = continuousOnThresholdMs ?? getContinuousOnThresholdMs();

    for (const [roomId, since] of Object.entries(roomAllOnSince)) {
      const elapsed = now - since;
      if (elapsed >= thresholdMs) {
        const room = state.rooms[roomId];
        if (!room) continue;

        const durationLabel = formatContinuousOnDuration(elapsed);
        alerts.push({
          id: `continuous-on-${roomId}`,
          type: 'high-consumption' as const,
          title: `${room.displayName}: All Devices On Too Long`,
          message: `At ${timeLabel}, every device in ${room.displayName} has been ON for ${durationLabel} straight (${room.devices.length} devices, ${room.totalPower}W).`,
          timestamp: now,
          resolved: false,
          roomId,
        });
      }
    }
  }

  const highThreshold = MAX_POSSIBLE_POWER * 0.75;
  if (state.totalPower > highThreshold) {
    alerts.push({
      id: 'high-power',
      type: 'high-consumption' as const,
      title: 'High Power Consumption',
      message: `At ${timeLabel}, usage is ${Math.round(state.totalPower)}W (over ${Math.round(highThreshold)}W). Consider switching off idle devices.`,
      timestamp: now,
      resolved: false,
    });
  }

  return alerts;
}

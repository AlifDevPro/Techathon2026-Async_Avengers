export type DeviceType = 'light' | 'fan';
export type DeviceStatus = 'on' | 'off';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  room: 'drawing' | 'work1' | 'work2';
  status: DeviceStatus;
  power: number; // watts
  lastToggled: number; // timestamp
}

export interface Room {
  id: string;
  name: string;
  displayName: string;
  devices: Device[];
  totalPower: number;
}

export interface DashboardState {
  devices: Device[];
  totalPower: number;
  totalDevicesOn: number;
  maxPower: number; // maximum possible power draw (all devices on)
  energyToday: number; // cumulative energy used today in watt-hours (Wh)
  officeTime: string; // simulated office clock, e.g. "2:45 PM"
  isOfficeHours: boolean;
  rooms: Record<string, Room>;
  alerts?: Alert[];
  timestamp: number;
}

export interface Alert {
  id: string;
  type: 'after-hours' | 'high-consumption' | 'info';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  deviceId?: string;
  roomId?: string;
}

export interface WebSocketMessage {
  type: 'device-update' | 'state-sync' | 'alert' | 'connection';
  payload: any;
  timestamp: number;
}

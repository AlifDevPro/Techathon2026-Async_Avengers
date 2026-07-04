/** How often the dashboard polls /api/devices (ms) */
export const DASHBOARD_POLL_MS = 4_000;

/** How often simulated device states may change on the server (ms) */
export const DEVICE_SIMULATION_TICK_MS = 8_000;

/** Per simulation tick, probability a device re-evaluates on/off (lower = stabler) */
export const DEVICE_TOGGLE_CHANCE = 0.12;

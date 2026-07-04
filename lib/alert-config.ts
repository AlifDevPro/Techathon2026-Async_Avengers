const DAY_CYCLE_MS = 240_000; // 4 real min = 24 simulated hours

/**
 * How long all devices in a room must stay ON before the continuous-use alert fires.
 * Set CONTINUOUS_ON_THRESHOLD_SEC=30 for fast demo/testing (real seconds).
 * Default: 2 simulated office hours (~20 real seconds with accelerated clock).
 */
export function getContinuousOnThresholdMs(): number {
  const secEnv = process.env.CONTINUOUS_ON_THRESHOLD_SEC?.trim();
  if (secEnv) {
    const sec = parseInt(secEnv, 10);
    if (!Number.isNaN(sec) && sec > 0) return sec * 1000;
  }

  const hoursEnv = process.env.CONTINUOUS_ON_THRESHOLD_HOURS?.trim();
  const hours = hoursEnv ? parseFloat(hoursEnv) : 2;
  return (hours / 24) * DAY_CYCLE_MS;
}

export function formatContinuousOnDuration(elapsedMs: number): string {
  const secEnv = process.env.CONTINUOUS_ON_THRESHOLD_SEC?.trim();
  if (secEnv) {
    const sec = Math.round(elapsedMs / 1000);
    return `${sec}s`;
  }
  const simHours = ((elapsedMs / DAY_CYCLE_MS) * 24).toFixed(1);
  return `~${simHours}h`;
}

export function getAlertPollIntervalMs(): number {
  const raw = process.env.ALERT_POLL_INTERVAL_MS?.trim();
  if (raw) {
    const ms = parseInt(raw, 10);
    if (!Number.isNaN(ms) && ms >= 5000) return ms;
  }
  return 15_000;
}

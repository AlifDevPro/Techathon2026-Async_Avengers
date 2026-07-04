'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { DashboardState, Alert } from '@/lib/types';

interface AlertsPanelProps {
  state: DashboardState | undefined;
}

const ALERT_STYLES = {
  'after-hours': {
    color: 'var(--danger-color)',
    Icon: AlertTriangle,
  },
  'high-consumption': {
    color: 'var(--warn-color)',
    Icon: Zap,
  },
  info: {
    color: 'var(--fan-color)',
    Icon: CheckCircle2,
  },
} as const;

export function AlertsPanel({ state }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!state) return;
    const newAlerts = state.alerts ?? [];
    setAlerts(newAlerts.filter((alert) => !dismissedAlerts.has(alert.id)));
  }, [state, dismissedAlerts]);

  const formatTimestamp = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const hasAlerts = alerts.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          System Status
        </h2>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            color: hasAlerts ? 'var(--danger-color)' : 'var(--power-color)',
            backgroundColor: hasAlerts
              ? 'color-mix(in oklab, var(--danger-color) 12%, transparent)'
              : 'color-mix(in oklab, var(--power-color) 12%, transparent)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: hasAlerts ? 'var(--danger-color)' : 'var(--power-color)' }}
          />
          {hasAlerts ? `${alerts.length} active` : 'All clear'}
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {hasAlerts ? (
          alerts.map((alert) => {
            const style = ALERT_STYLES[alert.type] ?? ALERT_STYLES.info;
            const { Icon } = style;
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="p-4 rounded-xl border flex gap-3 items-start group"
                style={{
                  borderColor: 'color-mix(in oklab, ' + style.color + ' 35%, transparent)',
                  backgroundColor: 'color-mix(in oklab, ' + style.color + ' 8%, transparent)',
                }}
              >
                <div
                  className="flex-shrink-0 p-1.5 rounded-lg"
                  style={{ backgroundColor: 'color-mix(in oklab, ' + style.color + ' 18%, transparent)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: style.color }}>
                    {alert.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {state?.officeTime ? `Office time: ${state.officeTime}` : formatTimestamp(alert.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            key="all-clear"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border flex gap-3 items-center"
            style={{
              borderColor: 'color-mix(in oklab, var(--power-color) 35%, transparent)',
              backgroundColor: 'color-mix(in oklab, var(--power-color) 8%, transparent)',
            }}
          >
            <div
              className="flex-shrink-0 p-1.5 rounded-lg"
              style={{ backgroundColor: 'color-mix(in oklab, var(--power-color) 18%, transparent)' }}
            >
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--power-color)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--power-color)' }}>
                All systems nominal
              </p>
              <p className="text-sm text-muted-foreground">
                No devices left on after hours, consumption within limits.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

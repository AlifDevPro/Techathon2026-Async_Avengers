'use client';

import { motion } from 'framer-motion';
import { DashboardState, Device } from '@/lib/types';
import { FanIcon, BulbIcon } from './device-icons';

interface DeviceCounterProps {
  state: DashboardState | undefined;
}

function BigCount({ count, total, color }: { count: number; total: number; color: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <motion.span
        key={count}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="text-5xl font-bold tabular-nums leading-none"
        style={{ color }}
      >
        {count}
      </motion.span>
      <span className="text-xl font-medium text-muted-foreground">/{total}</span>
    </div>
  );
}

function CounterCard({
  label,
  devices,
  colorVar,
  delay,
  kind,
}: {
  label: string;
  devices: Device[];
  colorVar: string;
  delay: number;
  kind: 'light' | 'fan';
}) {
  const onCount = devices.filter((d) => d.status === 'on').length;
  const anyOn = onCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative p-5 bg-card border border-border rounded-xl overflow-hidden flex flex-col justify-between"
    >
      {/* Colored ambient wash when active */}
      {anyOn && (
        <div
          className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: colorVar }}
        />
      )}

      {/* Header: label + count */}
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </h3>
          <BigCount count={onCount} total={devices.length} color={anyOn ? colorVar : 'var(--muted-foreground)'} />
          <p className="text-xs text-muted-foreground">
            {anyOn ? `${onCount} running` : 'All off'}
          </p>
        </div>
      </div>

      {/* Middle: large centered animated icon fills the card */}
      <div className="relative flex-1 flex items-center justify-center py-4">
        {kind === 'fan' ? (
          <FanIcon on={anyOn} size={72} />
        ) : (
          <BulbIcon on={anyOn} size={72} />
        )}
      </div>

      {/* Bottom: individual device indicators */}
      <div className="relative pt-4 border-t border-border">
        <div className="flex items-end justify-between gap-2">
          {devices.map((device) => {
            const isOn = device.status === 'on';
            return (
              <div key={device.id} className="flex flex-col items-center gap-1.5 flex-1">
                {kind === 'light' ? (
                  <BulbIcon on={isOn} size={24} />
                ) : (
                  <FanIcon on={isOn} size={24} />
                )}
                <span
                  className="w-full h-1 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: isOn ? colorVar : 'var(--border)' }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function DeviceCounter({ state }: DeviceCounterProps) {
  if (!state) {
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        <div className="bg-card rounded-xl animate-pulse" />
        <div className="bg-card rounded-xl animate-pulse" />
      </div>
    );
  }

  const lights = state.devices.filter((d) => d.type === 'light');
  const fans = state.devices.filter((d) => d.type === 'fan');

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <CounterCard
        label="Lights"
        devices={lights}
        colorVar="var(--bulb-color)"
        delay={0.1}
        kind="light"
      />
      <CounterCard
        label="Fans"
        devices={fans}
        colorVar="var(--fan-color)"
        delay={0.15}
        kind="fan"
      />
    </div>
  );
}

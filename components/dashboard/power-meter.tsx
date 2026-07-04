'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Gauge } from 'lucide-react';
import { DashboardState } from '@/lib/types';
import { AtomIcon } from './device-icons';

interface PowerMeterProps {
  state: DashboardState | undefined;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {Math.round(value)}
    </motion.span>
  );
}

/** Horizontal wire with flowing current particles */
function CurrentFlow({ active }: { active: boolean }) {
  return (
    <svg className="w-full h-6" viewBox="0 0 200 24" fill="none" preserveAspectRatio="none">
      {/* Base wire */}
      <line x1="0" y1="12" x2="200" y2="12" stroke="var(--border)" strokeWidth="2" />
      {/* Flowing current */}
      {active && (
        <line
          x1="0"
          y1="12"
          x2="200"
          y2="12"
          stroke="var(--power-color)"
          strokeWidth="2.5"
          className="animate-flow-dash"
          strokeLinecap="round"
        />
      )}
      {/* End nodes */}
      <circle cx="4" cy="12" r="3" fill="var(--power-color)" />
      <circle cx="196" cy="12" r="3" fill={active ? 'var(--power-color)' : 'var(--border)'} />
    </svg>
  );
}

export function PowerMeter({ state }: PowerMeterProps) {
  if (!state) {
    return <div className="h-64 bg-card rounded-xl animate-pulse" />;
  }

  const maxPower = state.maxPower || 495;
  const powerPercentage = Math.min((state.totalPower / maxPower) * 100, 100);
  const load = state.totalPower / maxPower;

  // Color by load level
  const level =
    load < 0.4 ? 'low' : load < 0.7 ? 'medium' : 'high';
  const powerColorVar =
    level === 'low' ? 'var(--power-color)' : level === 'medium' ? 'var(--warn-color)' : 'var(--danger-color)';
  const levelLabel = level === 'low' ? 'Optimal' : level === 'medium' ? 'Moderate' : 'High Load';

  // energyToday is in Wh -> show kWh
  const kwhToday = state.energyToday / 1000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4" style={{ color: 'var(--power-color)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Total Power Usage
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">Live consumption across all rooms</p>
        </div>
        <AtomIcon on={state.totalPower > 0} size={40} />
      </div>

      {/* Two big stats: currently consuming + today total */}
      <div className="grid grid-cols-2 gap-4">
        {/* Currently consuming */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'color-mix(in oklab, ' + powerColorVar + ' 12%, transparent)',
          }}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Now Consuming
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <AnimatedNumber
              value={state.totalPower}
              className="text-4xl font-bold tabular-nums"
            />
            <span className="text-lg font-semibold" style={{ color: powerColorVar }}>
              W
            </span>
          </div>
          <div
            className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              color: powerColorVar,
              backgroundColor: 'color-mix(in oklab, ' + powerColorVar + ' 15%, transparent)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: powerColorVar }} />
            {levelLabel}
          </div>
        </div>

        {/* Today total */}
        <div className="p-4 rounded-xl bg-muted/60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Used Today
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <motion.span
              key={Math.round(kwhToday * 100)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tabular-nums"
            >
              {kwhToday.toFixed(2)}
            </motion.span>
            <span className="text-lg font-semibold text-muted-foreground">kWh</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--power-color)' }} />
            {state.totalDevicesOn} of {state.devices.length} devices active
          </div>
        </div>
      </div>

      {/* Current flow wire */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Grid</span>
          <span>Current Flow</span>
          <span>Office</span>
        </div>
        <CurrentFlow active={state.totalPower > 0} />
      </div>

      {/* Power load bar (scaled to actual max) */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 W</span>
          <span className="font-medium" style={{ color: powerColorVar }}>
            {Math.round(powerPercentage)}% load
          </span>
          <span>{maxPower} W</span>
        </div>
        <div className="h-3.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full animate-shimmer"
            style={{
              background: `linear-gradient(90deg, ${powerColorVar}, color-mix(in oklab, ${powerColorVar} 60%, white))`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${powerPercentage}%` }}
            transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          />
        </div>
      </div>

      {/* Room breakdown */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(state.rooms).map(([roomId, room]) => {
          const roomLoad = room.totalPower / (maxPower / 3);
          const roomColor =
            roomLoad < 0.5 ? 'var(--power-color)' : roomLoad < 0.85 ? 'var(--warn-color)' : 'var(--danger-color)';
          return (
            <div key={roomId} className="p-3 rounded-lg bg-muted/60 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">
                {room.displayName}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold tabular-nums" style={{ color: roomColor }}>
                  <AnimatedNumber value={room.totalPower} />
                </span>
                <span className="text-[10px] text-muted-foreground">W</span>
              </div>
              <div className="flex gap-1">
                {room.devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex-1 h-1.5 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        device.status === 'on' ? roomColor : 'var(--border)',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

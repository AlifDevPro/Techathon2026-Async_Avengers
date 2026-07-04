'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Device } from '@/lib/types';
import { toggleDevice } from '@/lib/hooks/use-devices';
import { FanIcon, BulbIcon } from './device-icons';

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const newStatus = device.status === 'on' ? 'off' : 'on';
      await toggleDevice(device.id, newStatus);
    } catch (error) {
      console.error('Failed to toggle device:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const isOn = device.status === 'on';
  const colorVar = device.type === 'light' ? 'var(--bulb-color)' : 'var(--fan-color)';
  const timeAgo = Math.round((Date.now() - device.lastToggled) / 1000);

  let timeLabel = 'now';
  if (timeAgo >= 3600) timeLabel = `${Math.floor(timeAgo / 3600)}h ago`;
  else if (timeAgo >= 60) timeLabel = `${Math.floor(timeAgo / 60)}m ago`;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleToggle}
      disabled={isToggling}
      className="w-full p-3 rounded-lg flex items-center justify-between gap-3 text-left transition-colors disabled:opacity-60"
      style={{
        backgroundColor: isOn ? 'color-mix(in oklab, ' + colorVar + ' 12%, transparent)' : 'var(--muted)',
      }}
    >
      {/* Left: icon + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: isOn
              ? 'color-mix(in oklab, ' + colorVar + ' 16%, transparent)'
              : 'var(--card)',
          }}
        >
          {device.type === 'light' ? (
            <BulbIcon on={isOn} size={24} />
          ) : (
            <FanIcon on={isOn} size={24} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{device.name}</p>
          <p className="text-xs text-muted-foreground">
            {device.power}W • {timeLabel}
          </p>
        </div>
      </div>

      {/* Right: live wattage + toggle */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {isOn && (
          <motion.div
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1"
            style={{ color: colorVar }}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-mono font-semibold">{device.power}W</span>
          </motion.div>
        )}
        <span
          className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
          style={{ backgroundColor: isOn ? colorVar : 'var(--border)' }}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-5 h-5 rounded-full bg-card block"
            style={{ marginLeft: isOn ? 'auto' : 0 }}
          />
        </span>
      </div>
    </motion.button>
  );
}

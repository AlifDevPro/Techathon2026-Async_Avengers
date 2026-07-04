'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb, Wind } from 'lucide-react';
import { Room } from '@/lib/types';
import { DeviceCard } from './device-card';

interface RoomSectionProps {
  room: Room;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function RoomSection({ room, isExpanded, onToggleExpand }: RoomSectionProps) {
  const lightsOn = room.devices.filter((d) => d.type === 'light' && d.status === 'on').length;
  const fansOn = room.devices.filter((d) => d.type === 'fan' && d.status === 'on').length;
  const totalLights = room.devices.filter((d) => d.type === 'light').length;
  const totalFans = room.devices.filter((d) => d.type === 'fan').length;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <motion.button
        onClick={onToggleExpand}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left group"
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">{room.displayName}</h3>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Lightbulb className="w-4 h-4" style={{ color: 'var(--bulb-color)' }} />
                <span className="text-muted-foreground">{lightsOn}/{totalLights}</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-4 h-4" style={{ color: 'var(--fan-color)' }} />
                <span className="text-muted-foreground">{fansOn}/{totalFans}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {room.totalPower}W • {room.devices.filter((d) => d.status === 'on').length}/{room.devices.length} devices on
          </p>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-2"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </motion.div>
      </motion.button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-3">
              {/* Lights */}
              {room.devices.filter((d) => d.type === 'light').length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Lights</p>
                  <div className="space-y-2">
                    {room.devices
                      .filter((d) => d.type === 'light')
                      .map((device, idx) => (
                        <motion.div
                          key={device.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <DeviceCard device={device} />
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {/* Fans */}
              {room.devices.filter((d) => d.type === 'fan').length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Fans</p>
                  <div className="space-y-2">
                    {room.devices
                      .filter((d) => d.type === 'fan')
                      .map((device, idx) => (
                        <motion.div
                          key={device.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <DeviceCard device={device} />
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

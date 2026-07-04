'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardState } from '@/lib/types';
import { RoomSection } from './room-section';

interface DevicePanelProps {
  state: DashboardState | undefined;
  isLoading: boolean;
}

export function DevicePanel({ state, isLoading }: DevicePanelProps) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  if (!state || isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-card rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const roomOrder = ['drawing', 'work1', 'work2'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Device Control</h2>
        <p className="text-sm text-muted-foreground">
          {state.totalDevicesOn} of {state.devices.length} devices on
        </p>
      </div>

      <div className="space-y-3">
        {roomOrder.map((roomId, idx) => (
          <motion.div
            key={roomId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <RoomSection
              room={state.rooms[roomId]}
              isExpanded={expandedRoom === roomId}
              onToggleExpand={() =>
                setExpandedRoom(expandedRoom === roomId ? null : roomId)
              }
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

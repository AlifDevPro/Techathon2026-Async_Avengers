'use client';

import { useEffect, useState } from 'react';
import { useDevices } from '@/lib/hooks/use-devices';
import { PowerMeter } from '@/components/dashboard/power-meter';
import { DeviceCounter } from '@/components/dashboard/device-counter';
import { DevicePanel } from '@/components/dashboard/device-panel';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { OfficeLayout } from '@/components/dashboard/office-layout';
import { Header } from '@/components/dashboard/header';
import { motion } from 'framer-motion';

function Section({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DashboardClient() {
  const { state, isLoading } = useDevices();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header officeTime={state?.officeTime} isOfficeHours={state?.isOfficeHours} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top row: power meter (2 cols) + device counters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Section delay={0.05} className="lg:col-span-2">
            <div className="h-full p-6 bg-card border border-border rounded-xl">
              <PowerMeter state={state} />
            </div>
          </Section>
          {/* Device counters align to the right column */}
          <Section delay={0.1} className="lg:col-span-1">
            <div className="h-full">
              <DeviceCounter state={state} />
            </div>
          </Section>
        </div>

        {/* Alerts */}
        <Section delay={0.15}>
          <div className="p-5 bg-card border border-border rounded-xl">
            <AlertsPanel state={state} />
          </div>
        </Section>

        {/* Office floor plan — now on the front page */}
        <Section delay={0.2}>
          <div className="p-5 bg-card border border-border rounded-xl">
            <OfficeLayout state={state} />
          </div>
        </Section>

        {/* Device control */}
        <Section delay={0.25}>
          <DevicePanel state={state} isLoading={isLoading} />
        </Section>
      </main>
    </div>
  );
}

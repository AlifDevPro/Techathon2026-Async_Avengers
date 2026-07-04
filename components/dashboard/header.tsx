'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { AtomIcon } from './device-icons';

interface HeaderProps {
  officeTime?: string;
  isOfficeHours?: boolean;
}

export function Header({ officeTime, isOfficeHours }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  const statusColor = isOfficeHours ? 'var(--power-color)' : 'var(--warn-color)';

  return (
    <header className="border-b border-border bg-card/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'color-mix(in oklab, var(--power-color) 14%, transparent)' }}
            >
              <AtomIcon on size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Energy Monitor</h1>
              <p className="text-xs text-muted-foreground">Office Device Management</p>
            </div>
          </motion.div>

          {/* Simulated office clock + status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden sm:flex items-center gap-3"
          >
            <div className="flex flex-col items-center">
              <div className="text-sm font-mono font-medium tabular-nums">
                {officeTime ?? '--:--'}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Office Time
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                color: statusColor,
                backgroundColor: 'color-mix(in oklab, ' + statusColor + ' 12%, transparent)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: statusColor }}
              />
              {isOfficeHours ? 'Open' : 'After Hours'}
            </span>
          </motion.div>

          {/* Theme toggle */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="inline-flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-lg border border-border bg-muted hover:bg-muted/70 transition-colors"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <Sun className="w-4 h-4" style={{ color: 'var(--bulb-color)' }} />
            ) : (
              <Moon className="w-4 h-4" style={{ color: 'var(--fan-color)' }} />
            )}
            <span className="text-xs font-medium hidden sm:inline">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

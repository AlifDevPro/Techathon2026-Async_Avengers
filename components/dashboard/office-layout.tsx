'use client';

import { motion } from 'framer-motion';
import { DashboardState, Device } from '@/lib/types';
import { toggleDevice } from '@/lib/hooks/use-devices';
import { FanIcon, BulbIcon } from './device-icons';

interface OfficeLayoutProps {
  state: DashboardState | undefined;
}

/* ---- Fixed illustration material palette (theme-independent panel) ---- */
const M = {
  wall: '#2f2a26',
  roomFloor: '#efe7db',
  roomFloorAlt: '#ece2d2',
  corridor: '#d8c2a2',
  plank: '#c8b088',
  wood: '#c39a6b',
  woodDark: '#6f4e34',
  sofa: '#5b5049',
  cushion: '#7a6c5d',
  rug: '#c9a98a',
  monitor: '#26272b',
  screen: '#3b4a5a',
  chair: '#3f3a36',
  potTop: '#a9713f',
  pot: '#8a5a33',
  leaf: '#4f7c3f',
  leafDark: '#3d6531',
  dispenser: '#eef1f2',
  water: '#8fc0dd',
  label: '#5b4a39',
};

/* ---------------------- Interactive devices ---------------------- */

function CeilingFan({ device, cx, cy }: { device: Device; cx: number; cy: number }) {
  const on = device.status === 'on';
  const color = on ? 'var(--fan-color)' : '#9a9285';

  return (
    <g
      role="button"
      tabIndex={0}
      className="cursor-pointer"
      onClick={() => toggleDevice(device.id, on ? 'off' : 'on')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') toggleDevice(device.id, on ? 'off' : 'on');
      }}
    >
      <title>{`${device.name} — ${on ? 'On' : 'Off'} (click to toggle)`}</title>
      {/* Larger invisible hit area */}
      <circle cx={cx} cy={cy} r="30" fill="transparent" />
      {/* Ceiling mount plate */}
      <circle cx={cx} cy={cy} r="7" fill={M.roomFloor} stroke={M.woodDark} strokeOpacity="0.3" strokeWidth="1" />
      {/* Rotating assembly: 3 realistic curved paddle blades (top view) */}
      <g
        className={on ? 'animate-fan-spin' : ''}
        style={{ transformBox: 'view-box', transformOrigin: `${cx}px ${cy}px` }}
      >
        {[0, 120, 240].map((deg) => (
          <g key={deg} transform={`rotate(${deg} ${cx} ${cy})`}>
            {/* Blade arm */}
            <path
              d={`M ${cx} ${cy}
                  C ${cx - 3} ${cy - 9}, ${cx - 6} ${cy - 20}, ${cx - 4.5} ${cy - 28}
                  C ${cx - 3.5} ${cy - 33}, ${cx + 3.5} ${cy - 33}, ${cx + 4.5} ${cy - 28}
                  C ${cx + 6} ${cy - 20}, ${cx + 3} ${cy - 9}, ${cx} ${cy} Z`}
              fill={on ? color : '#8a7f6f'}
              stroke={M.woodDark}
              strokeOpacity="0.35"
              strokeWidth="0.75"
            />
          </g>
        ))}
      </g>
      {/* Center motor housing */}
      <circle cx={cx} cy={cy} r="6" fill={M.woodDark} />
      <circle cx={cx} cy={cy} r="3" fill={on ? color : '#b3aa9a'} />
    </g>
  );
}

function WallLight({ device, cx, cy }: { device: Device; cx: number; cy: number }) {
  const on = device.status === 'on';
  return (
    <g
      role="button"
      tabIndex={0}
      className="cursor-pointer"
      onClick={() => toggleDevice(device.id, on ? 'off' : 'on')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') toggleDevice(device.id, on ? 'off' : 'on');
      }}
    >
      <title>{`${device.name} — ${on ? 'On' : 'Off'} (click to toggle)`}</title>
      <circle cx={cx} cy={cy} r="16" fill="transparent" />
      {/* Warm halo glow when on */}
      {on && (
        <>
          <circle cx={cx} cy={cy} r="15" fill="var(--bulb-color)" opacity="0.2" className="animate-pulse" />
          <circle cx={cx} cy={cy} r="10.5" fill="var(--bulb-color)" opacity="0.35" />
        </>
      )}
      {/* Fixture housing ring (downlight trim) */}
      <circle
        cx={cx}
        cy={cy}
        r="8"
        fill={on ? '#fff4d6' : '#e6ded0'}
        stroke={on ? 'var(--bulb-color)' : '#a79d8c'}
        strokeWidth="2"
      />
      {/* Bright inner bulb */}
      <circle
        cx={cx}
        cy={cy}
        r="4.5"
        fill={on ? 'var(--bulb-color)' : '#c9c0b1'}
        className={on ? 'animate-bulb-glow' : ''}
        style={on ? { color: 'var(--bulb-color)' } : undefined}
      />
    </g>
  );
}

/* ---------------------- Static furniture ---------------------- */

function Workstation({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  // Desk faces the central aisle. `flip` mirrors it for the right column.
  const s = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`}>
      {/* Desk surface */}
      <rect x="-2" y="-20" width="46" height="40" rx="3" fill={M.wood} stroke={M.woodDark} strokeWidth="1" />
      {/* Monitor */}
      <rect x="30" y="-13" width="9" height="26" rx="1.5" fill={M.monitor} />
      <rect x="32" y="-11" width="5" height="22" rx="1" fill={M.screen} />
      {/* Keyboard */}
      <rect x="12" y="-6" width="14" height="12" rx="1.5" fill="#d8cbb6" stroke={M.woodDark} strokeWidth="0.5" />
      {/* Chair */}
      <rect x="-16" y="-11" width="14" height="22" rx="4" fill={M.chair} />
      <rect x="-13" y="-8" width="9" height="16" rx="3" fill="#55504a" />
    </g>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-7" y="-7" width="14" height="14" rx="3" fill={M.pot} />
      <rect x="-7" y="-7" width="14" height="4" rx="2" fill={M.potTop} />
      <circle cx="-3" cy="-3" r="6" fill={M.leaf} />
      <circle cx="4" cy="-2" r="5.5" fill={M.leafDark} />
      <circle cx="0" cy="-8" r="5" fill={M.leaf} />
    </g>
  );
}

function DoorArc({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`}>
      {/* Swing arc */}
      <path d="M0 0 A 34 34 0 0 1 34 34" fill="none" stroke={M.woodDark} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      {/* Door leaf */}
      <line x1="0" y1="0" x2="34" y2="0" stroke={M.woodDark} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/* ---------------------- Main layout ---------------------- */

export function OfficeLayout({ state }: OfficeLayoutProps) {
  if (!state) {
    return <div className="h-80 bg-muted rounded-xl animate-pulse" />;
  }

  const rooms = [
    { id: 'drawing', left: 22, right: 262 },
    { id: 'work1', left: 274, right: 518 },
    { id: 'work2', left: 530, right: 778 },
  ];

  const roomTop = 22;
  const roomBottom = 388;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Office Floor Plan · Top View
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Click any light or fan to toggle it — updates live everywhere.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BulbIcon on size={16} />
            <span>Light</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FanIcon on size={16} />
            <span>Fan</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full overflow-hidden rounded-xl"
      >
        <svg viewBox="0 0 800 500" className="w-full h-auto" role="img" aria-label="Office floor plan top view">
          {/* Outer building + walls */}
          <rect x="10" y="10" width="780" height="480" rx="14" fill={M.wall} />
          <rect x="22" y="22" width="756" height="456" rx="6" fill={M.roomFloor} />

          {/* Corridor at the bottom */}
          <rect x="22" y="392" width="756" height="86" rx="4" fill={M.corridor} />
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={i}
              x1={22 + i * 42}
              y1="392"
              x2={22 + i * 42}
              y2="478"
              stroke={M.plank}
              strokeWidth="1.5"
            />
          ))}

          {/* Room floors (alt tint for work rooms) */}
          <rect x="274" y="22" width="244" height="366" fill={M.roomFloorAlt} />
          <rect x="530" y="22" width="248" height="366" fill={M.roomFloorAlt} />

          {/* Partition walls between rooms */}
          <rect x="263" y="22" width="10" height="366" fill={M.wall} />
          <rect x="519" y="22" width="10" height="366" fill={M.wall} />
          {/* Wall dividing rooms from corridor */}
          <rect x="22" y="386" width="756" height="8" fill={M.wall} />

          {/* Door openings (gaps + swing arcs) */}
          <rect x="120" y="384" width="46" height="12" fill={M.corridor} />
          <rect x="372" y="384" width="46" height="12" fill={M.corridor} />
          <rect x="628" y="384" width="46" height="12" fill={M.corridor} />
          <DoorArc x="122" y="388" />
          <DoorArc x="374" y="388" />
          <DoorArc x="630" y="388" />

          {/* ---- DRAWING ROOM furniture ---- */}
          {/* Straight 3-seater sofa against the left wall, vertically centered */}
          <rect x="44" y="150" width="52" height="150" rx="10" fill={M.sofa} />
          {/* Armrest caps (top + bottom, darker) */}
          <rect x="46" y="150" width="48" height="16" rx="6" fill={M.woodDark} opacity="0.5" />
          <rect x="46" y="284" width="48" height="16" rx="6" fill={M.woodDark} opacity="0.5" />
          {/* Seat cushions (three) */}
          <rect x="62" y="170" width="30" height="36" rx="5" fill={M.cushion} />
          <rect x="62" y="208" width="30" height="34" rx="5" fill={M.cushion} />
          <rect x="62" y="244" width="30" height="36" rx="5" fill={M.cushion} />
          {/* Rug + coffee table facing the sofa */}
          <rect x="112" y="168" width="110" height="116" rx="8" fill={M.rug} opacity="0.6" />
          <rect x="132" y="196" width="60" height="58" rx="5" fill={M.wood} stroke={M.woodDark} strokeWidth="1" />
          {/* Plants tucked into corners (clear of lights & furniture) */}
          <Plant x={240} y={82} />
          <Plant x={240} y={360} />

          {/* ---- WORK ROOM 1 workstations ---- */}
          <Workstation x={300} y={120} />
          <Workstation x={300} y={285} />
          <Workstation x={492} y={120} flip />
          <Workstation x={492} y={285} flip />
          <Plant x={292} y={366} />

          {/* ---- WORK ROOM 2 workstations ---- */}
          <Workstation x={556} y={120} />
          <Workstation x={556} y={285} />
          <Workstation x={748} y={120} flip />
          <Workstation x={748} y={285} flip />
          <Plant x={548} y={366} />

          {/* Water dispenser in corridor corner */}
          <g transform="translate(742 430)">
            <rect x="-11" y="0" width="22" height="34" rx="3" fill={M.dispenser} stroke={M.woodDark} strokeWidth="1" />
            <rect x="-8" y="-14" width="16" height="16" rx="4" fill={M.water} opacity="0.9" />
          </g>

          {/* Room labels + live wattage */}
          {rooms.map((r) => {
            const room = state.rooms[r.id];
            const cx = (r.left + r.right) / 2;
            return (
              <g key={`label-${r.id}`}>
                <text
                  x={cx}
                  y={228}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  letterSpacing="0.5"
                  fill={M.label}
                >
                  {room.displayName.toUpperCase()}
                </text>
                <text x={cx} y={246} textAnchor="middle" fontSize="11" fontWeight="600" fill={M.woodDark}>
                  {room.totalPower}W
                </text>
              </g>
            );
          })}

          {/* Devices: fans + lights per room, reflecting live state */}
          {rooms.map((r) => {
            const room = state.rooms[r.id];
            const cx = (r.left + r.right) / 2;
            const fans = room.devices.filter((d) => d.type === 'fan');
            const lights = room.devices.filter((d) => d.type === 'light');

            // Fan positions: upper and lower center
            const fanPos = [
              { cx, cy: 110 },
              { cx, cy: 300 },
            ];
            // Light positions: two top corners + bottom center
            const lightPos = [
              { cx: r.left + 40, cy: 56 },
              { cx: r.right - 40, cy: 56 },
              { cx, cy: 360 },
            ];

            return (
              <g key={`dev-${r.id}`}>
                {fans.map((f, i) => (
                  <CeilingFan key={f.id} device={f} cx={fanPos[i]?.cx ?? cx} cy={fanPos[i]?.cy ?? 110} />
                ))}
                {lights.map((l, i) => (
                  <WallLight key={l.id} device={l} cx={lightPos[i]?.cx ?? cx} cy={lightPos[i]?.cy ?? 56} />
                ))}
              </g>
            );
          })}
        </svg>
      </motion.div>
    </div>
  );
}

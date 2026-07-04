'use client';

interface IconProps {
  on: boolean;
  size?: number;
  className?: string;
}

/**
 * A fan with real propeller blades that spin when the fan is on.
 */
export function FanIcon({ on, size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Outer housing ring */}
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke={on ? 'var(--fan-color)' : 'var(--muted-foreground)'}
        strokeOpacity={on ? 0.4 : 0.25}
        strokeWidth="2"
      />
      {/* Spinning propeller group */}
      <g className={on ? 'animate-fan-spin' : ''} style={{ transformOrigin: '24px 24px' }}>
        {[0, 90, 180, 270].map((deg) => (
          <path
            key={deg}
            d="M24 24 C 27 14, 34 12, 38 15 C 34 20, 30 22, 24 24 Z"
            fill={on ? 'var(--fan-color)' : 'var(--muted-foreground)'}
            fillOpacity={on ? 0.9 : 0.45}
            transform={`rotate(${deg} 24 24)`}
          />
        ))}
      </g>
      {/* Center hub */}
      <circle cx="24" cy="24" r="3.5" fill={on ? 'var(--fan-color)' : 'var(--muted-foreground)'} />
      <circle cx="24" cy="24" r="1.5" fill="var(--card)" />
    </svg>
  );
}

/**
 * A light bulb that emits a warm glow when on.
 */
export function BulbIcon({ on, size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`${on ? 'animate-bulb-glow' : ''} ${className}`}
      style={{ color: on ? 'var(--bulb-color)' : 'var(--muted-foreground)' }}
      aria-hidden="true"
    >
      {/* Glass bulb */}
      <path
        d="M24 6 C 15 6, 9 12, 9 20 C 9 26, 13 30, 16 33 C 17.5 34.5, 18 36, 18 38 L 30 38 C 30 36, 30.5 34.5, 32 33 C 35 30, 39 26, 39 20 C 39 12, 33 6, 24 6 Z"
        fill={on ? 'var(--bulb-color)' : 'transparent'}
        fillOpacity={on ? 0.25 : 0}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Filament */}
      <path
        d="M20 22 L 22.5 26 L 25.5 20 L 28 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Base */}
      <line x1="19" y1="41" x2="29" y2="41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="44" x2="27" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * An animated "power / atom" icon with orbiting electrons — used for the
 * total power card to visualise energy flow.
 */
export function AtomIcon({ on, size = 32, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Nucleus */}
      <circle cx="24" cy="24" r="4" fill="var(--power-color)" />
      {/* Orbit rings with electrons */}
      <g className={on ? 'animate-orbit' : ''} style={{ transformOrigin: '24px 24px' }}>
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="var(--power-color)" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="42" cy="24" r="2.5" fill="var(--power-color)" />
      </g>
      <g
        className={on ? 'animate-orbit-reverse' : ''}
        style={{ transformOrigin: '24px 24px' }}
        transform="rotate(60 24 24)"
      >
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="var(--power-color)" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="6" cy="24" r="2.5" fill="var(--power-color)" />
      </g>
      <g
        className={on ? 'animate-orbit' : ''}
        style={{ transformOrigin: '24px 24px', animationDuration: '3.8s' }}
        transform="rotate(120 24 24)"
      >
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="var(--power-color)" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="42" cy="24" r="2.5" fill="var(--power-color)" />
      </g>
    </svg>
  );
}

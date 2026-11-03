/** Small 24px line icons for the dashboard. Decorative: always aria-hidden. */
const PATHS = {
  heart: 'M12 20 L4 12 Q1 8 4.5 5 Q8 3 12 7.5 Q16 3 19.5 5 Q23 8 20 12 Z',
  home: 'M3 11 L12 3 L21 11 M5 9.5 V20 H10 V14 H14 V20 H19 V9.5',
  repo: 'M5 4 H17 Q19 4 19 6 V20 H7 Q5 20 5 18 Z M5 17 Q5 15.5 7 15.5 H19 M9 8 H15',
  pr: 'M6 4 V20 M6 4 A2 2 0 1 0 6.01 4 M6 20 A2 2 0 1 0 6.01 20 M18 20 V9 Q18 6 15 6 H11 M13 4 L11 6 L13 8 M18 20 A2 2 0 1 0 18.01 20',
  issue: 'M12 3 A9 9 0 1 0 12.01 3 Z M12 7 V13 M12 16.5 V17',
  codespace: 'M3 5 H21 V16 H3 Z M8 20 H16 M12 16 V20 M8 9 L6 10.5 L8 12 M16 9 L18 10.5 L16 12 M13 8.5 L11 12.5',
  star: 'M12 3 L14.6 9 L21 9.5 L16 13.6 L17.6 20 L12 16.6 L6.4 20 L8 13.6 L3 9.5 L9.4 9 Z',
  gist: 'M8 6 L3 12 L8 18 M16 6 L21 12 L16 18 M14 4 L10 20',
  org: 'M8 11 A3 3 0 1 0 8.01 11 M16 11 A3 3 0 1 0 16.01 11 M2 20 Q2 15 8 15 Q14 15 14 20 M12 15.5 Q14 14.5 16 14.5 Q22 14.5 22 20',
  pin: 'M12 21 Q5 13 5 9 A7 7 0 0 1 19 9 Q19 13 12 21 Z M12 6.5 A2.5 2.5 0 1 0 12.01 6.5',
  sparkle: 'M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z',
  fork: 'M6 3 V8 Q6 12 12 12 Q18 12 18 8 V3 M12 12 V21 M6 3 A1.5 1.5 0 1 0 6.01 3 M18 3 A1.5 1.5 0 1 0 18.01 3',
  save: 'M4 4 H17 L20 7 V20 H4 Z M8 4 V9 H15 V4 M7 20 V14 H17 V20',
  plus: 'M12 4 V20 M4 12 H20',
  cd: 'M12 3 A9 9 0 1 0 12.01 3 Z M12 9.5 A2.5 2.5 0 1 0 12.01 9.5 Z M6.5 9 Q7.5 6.5 10 6',
  print: 'M7 9 V3 H17 V9 M7 17 H4 V9 H20 V17 H17 M7 14 H17 V21 H7 Z',
  eye: 'M2 12 Q12 3 22 12 Q12 21 2 12 Z M12 9 A3 3 0 1 0 12.01 9 Z',
  sound: 'M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 Q18 12 16 15 M18.5 6.5 Q22.5 12 18.5 17.5',
  mute: 'M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 L21 15 M21 9 L16 15',
  comment: 'M4 5 H20 V16 H11 L6 20 V16 H4 Z',
  merge: 'M6 4 V20 M6 4 A2 2 0 1 0 6.01 4 M6 9 Q6 14 12 14 H16 M16 14 A2 2 0 1 0 16.01 14',
  push: 'M12 20 V5 M6 11 L12 5 L18 11 M4 21 H20',
  calendar: 'M4 6 H20 V20 H4 Z M4 10 H20 M8 3 V7 M16 3 V7',
  check: 'M4 12 L10 18 L20 6',
  trash: 'M5 7 H19 M9 7 V4 H15 V7 M7 7 L8 20 H16 L17 7',
  camera: 'M4 8 H8 L10 5 H14 L16 8 H20 V19 H4 Z M12 10 A3.5 3.5 0 1 0 12.01 10 Z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  const filled = name === 'heart' || name === 'star' || name === 'sparkle';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={`ico${filled ? ' ico-fill' : ''}${className ? ' ' + className : ''}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

import type { ReactElement, SVGProps } from "react";

/** Inline SVG icon set (24 × 24 grid, 1.75 stroke). No icon library needed. */
const PATHS = {
  users: (<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.4" /><path d="M17 14.2c2.4.3 4 2.2 4 4.8" /></>),
  userPlus: (<><circle cx="10" cy="8" r="3.2" /><path d="M3.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" /><path d="M19 8v6M16 11h6" /></>),
  repeat: (<><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></>),
  cursor: (<path d="M5 4l14 6.5-6 2-2 6z" />),
  eye: (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  layers: (<><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13.5l9 5 9-5" /></>),
  target: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></>),
  exit: (<><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" /><path d="M15 8l4 4-4 4" /><path d="M19 12H9" /></>),
  bolt: (<path d="M13 2L4 14h7l-1 8 9-12h-7z" />),
  download: (<><path d="M12 4v11" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></>),
  qr: (<><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h3v3M20 14v.01M14 20h.01M17 20h3v-3" /></>),
  chat: (<path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8z" />),
  phone: (<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z" />),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  file: (<><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 16h6" /></>),
  external: (<><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>),
  monitor: (<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>),
  mobile: (<><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>),
  tablet: (<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M11 18h2" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>),
  share: (<><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="6" r="2.5" /><circle cx="17" cy="18" r="2.5" /><path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6" /></>),
  refresh: (<><path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4" /><path d="M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4" /></>),
  export: (<><path d="M12 15V4" /><path d="M8 8l4-4 4 4" /><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" /></>),
  calendar: (<><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  trend: (<><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>),
  trash: (<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
  shield: (<><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>),
  bulb: (<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>),
  flow: (<><path d="M4 6h4c4 0 4 12 8 12h4" /><path d="M4 18h4c1.5 0 2.5-1.5 3.5-3.5" /><path d="M20 6h-4c-1.5 0-2.5 1.5-3.5 3.5" /></>),
  activity: (<path d="M3 12h4l3-8 4 16 3-8h4" />),
  scroll: (<><rect x="7" y="3" width="10" height="18" rx="5" /><path d="M12 7v4" /></>),
  home: (<><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></>),
  back: (<><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>),
  chevronDown: (<path d="M6 9l6 6 6-6" />),
  check: (<path d="M5 12.5l4.5 4.5L19 7.5" />),
  arrowRight: (<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>),
  sort: (<><path d="M8 9l4-4 4 4" /><path d="M8 15l4 4 4-4" /></>),
  sortUp: (<><path d="M8 14l4-4 4 4" /></>),
  sortDown: (<><path d="M8 10l4 4 4-4" /></>),
  timer: (<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 3h5" /></>),
  bounce: (<><path d="M5 5v14" /><path d="M5 12h14" /><path d="M15 8l4 4-4 4" /></>),
  chart: (<><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-5M12 16V8M16 16v-3" /></>),
} satisfies Record<string, ReactElement>;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

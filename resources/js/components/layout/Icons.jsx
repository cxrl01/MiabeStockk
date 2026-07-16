const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconDashboard = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="11" y="2.5" width="6.5" height="4" rx="1.5" />
    <rect x="11" y="8.5" width="6.5" height="9" rx="1.5" />
    <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

export const IconCart = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <path d="M2.5 3h2l1.6 9.6a1.5 1.5 0 0 0 1.5 1.25h6.8a1.5 1.5 0 0 0 1.48-1.24l1.1-6.3H5" />
    <circle cx="8" cy="17" r="1.1" />
    <circle cx="14.5" cy="17" r="1.1" />
  </svg>
);

export const IconBox = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <path d="M2.5 6.2 10 2.5l7.5 3.7L10 9.8 2.5 6.2Z" />
    <path d="M2.5 6.2v7.6L10 17.5l7.5-3.7V6.2" />
    <path d="M10 9.8v7.7" />
  </svg>
);

export const IconUsers = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <circle cx="7" cy="6.5" r="2.5" />
    <path d="M2.5 17c0-3 2-5 4.5-5s4.5 2 4.5 5" />
    <circle cx="14.5" cy="7" r="2" />
    <path d="M12.5 12.3c1.9.3 3.5 2 3.5 4.7" />
  </svg>
);

export const IconUser = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <circle cx="10" cy="6.5" r="3" />
    <path d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
  </svg>
);

export const IconTruck = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <rect x="2" y="6" width="9" height="7.5" rx="1" />
    <path d="M11 8.5h3.3L17 11v2.5h-6" />
    <circle cx="6" cy="15.5" r="1.4" />
    <circle cx="13.7" cy="15.5" r="1.4" />
  </svg>
);

export const IconChart = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <path d="M3 17V3" />
    <path d="M3 17h14" />
    <path d="M6.5 14v-4" />
    <path d="M10.5 14V7" />
    <path d="M14.5 14v-6.5" />
  </svg>
);

export const IconWallet = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <rect x="2.5" y="5" width="15" height="11" rx="1.8" />
    <path d="M2.5 8.5h15" />
    <circle cx="14" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconGear = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <circle cx="10" cy="10" r="2.6" />
    <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" />
  </svg>
);

export const IconBell = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <path d="M5 8a5 5 0 0 1 10 0c0 3.2 1 4.3 1.3 4.7H3.7C4 12.3 5 11.2 5 8Z" />
    <path d="M8 15.3a2 2 0 0 0 4 0" />
  </svg>
);

export const IconLogout = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <path d="M8 17H4.5a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4.5 3H8" />
    <path d="M13 13.5 17 10l-4-3.5" />
    <path d="M17 10H8" />
  </svg>
);

export const IconMenu = (p) => (
  <svg viewBox="0 0 20 20" width="20" height="20" {...base} {...p}>
    <path d="M3 6h14M3 10h14M3 14h14" />
  </svg>
);

export const IconSun = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <circle cx="10" cy="10" r="3.2" />
    <path d="M10 2v1.6M10 16.4V18M4 4l1.2 1.2M14.8 14.8 16 16M2 10h1.6M16.4 10H18M4 16l1.2-1.2M14.8 5.2 16 4" />
  </svg>
);

export const IconMoon = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <path d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5Z" />
  </svg>
);

export const IconAlertTriangle = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <path d="M8.6 3.3 1.9 15a1.7 1.7 0 0 0 1.4 2.5h13.4a1.7 1.7 0 0 0 1.4-2.5L11.4 3.3a1.7 1.7 0 0 0-2.8 0Z" />
    <path d="M10 8v3.3M10 14.3h.01" />
  </svg>
);

export const IconCheck = (p) => (
  <svg viewBox="0 0 20 20" width="28" height="28" {...base} {...p}>
    <path d="M3.5 10.5 8 15l8.5-9.5" />
  </svg>
);

// --- Ajouts pour le bloc "Alertes" du Dashboard (stock bas, dettes) ---

export const IconAlertCircle = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 6.5v4M10 13.5h.01" />
  </svg>
);

export const IconDollar = (p) => (
  <svg viewBox="0 0 20 20" width="18" height="18" {...base} {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 5.5v9M12.6 7.7c0-1-1.1-1.7-2.6-1.7-1.7 0-2.7.8-2.7 1.9 0 2.6 5.3 1.2 5.3 3.8 0 1.1-1.1 1.9-2.7 1.9-1.5 0-2.6-.7-2.6-1.7" />
  </svg>
);
export function LogoBoutique({ className = 'h-9 w-9' }) {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="currentColor" />
        <text
          x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="20" fill="#F7F5F0"
        >
          M
        </text>
      </svg>
    );
  }
  
  export function LogoAdmin({ className = 'h-9 w-9' }) {
    return (
      <svg viewBox="0 0 40 44" className={className} aria-hidden="true">
        <path d="M20 1 L37 7 V21 C37 31 30 38 20 43 C10 38 3 31 3 21 V7 Z" fill="currentColor" />
        <text
          x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
          fontFamily="'Space Grotesk', sans-serif" fontWeight="700" fontSize="16" fill="#12172B"
        >
          M
        </text>
      </svg>
    );
  }
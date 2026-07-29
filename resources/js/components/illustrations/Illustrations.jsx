// Petites illustrations en ligne fine, dans l'esprit du commerce local
// (cauri, cageot, bourse...) plutôt que des icônes génériques.
// Toutes héritent de currentColor : passe une classe de couleur au parent.

export function IconCauri({ className = 'w-14 h-14' }) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="32" cy="32" rx="24" ry="15" />
        <path d="M12 32 Q19 25 26 32 Q32 39 38 32 Q45 25 52 32" />
      </svg>
    );
  }
  
  export function IconCageot({ className = 'w-14 h-14' }) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 23 L32 13 L55 23 L32 33 Z" />
        <path d="M9 23 L9 46 L32 56 L32 33" />
        <path d="M55 23 L55 46 L32 56" />
        <path d="M20 18 L20 51" opacity="0.45" />
        <path d="M44 18 L44 51" opacity="0.45" />
      </svg>
    );
  }
  
  export function IconSilhouette({ className = 'w-14 h-14' }) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="32" cy="21" r="10" />
        <path d="M12 54 C12 39 20 33 32 33 C44 33 52 39 52 54" />
      </svg>
    );
  }
  
  export function IconLivraison({ className = 'w-14 h-14' }) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="6" y="23" width="27" height="19" rx="2" />
        <path d="M33 29 H47 L56 38 V42 H33 Z" />
        <circle cx="18" cy="47" r="5" />
        <circle cx="47" cy="47" r="5" />
      </svg>
    );
  }
  
  export function IconRecu({ className = 'w-14 h-14' }) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 7 H48 V55 L42 49 L36 55 L30 49 L24 55 L18 49 L16 55 Z" />
        <path d="M23 19 H41 M23 27 H41 M23 35 H33" opacity="0.45" />
      </svg>
    );
  }
  
  export function IconBourse({ className = 'w-14 h-14' }) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 23 C22 13 42 13 42 23" />
        <path d="M16 23 H48 L44 52 C44 56 40 58 32 58 C24 58 20 56 20 52 Z" />
        <path d="M27 7 L22 23 M37 7 L42 23" opacity="0.45" />
      </svg>
    );
  }
  
  export function IconCategorie({ className = 'w-14 h-14' }) {
    return (
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10 12 H27 L32 19 H54 V52 H10 Z" />
      </svg>
    );
  }
  
  /** Bloc générique pour états vides — icône léger + texte + action optionnelle. */
  export function EmptyState({ icon, title, subtitle, action }) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-14 px-4">
        <div className="text-ink900/15 mb-4">{icon}</div>
        <p className="text-sm font-medium text-ink900/50">{title}</p>
        {subtitle && <p className="text-xs text-ink900/35 mt-1.5 max-w-xs">{subtitle}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }
  
  /** Petit badge circulaire coloré pour accompagner une stat-card. */
  export function PastilleIcone({ icon, tone = 'indigo' }) {
    const tons = {
      indigo: 'bg-indigo-700/10 text-indigo-700',
      success: 'bg-success/10 text-success',
      danger: 'bg-danger/10 text-danger',
      ochre: 'bg-ochre-500/10 text-ochre-600',
    };
    return (
      <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${tons[tone]}`}>
        {icon}
      </span>
    );
  }
const TONES = {
  indigo: { badge: 'bg-indigo-700/10 text-indigo-700', value: 'text-ink900' },
  success: { badge: 'bg-success/10 text-success', value: 'text-success' },
  ochre: { badge: 'bg-ochre-500/10 text-ochre-600', value: 'text-ink900' },
  danger: { badge: 'bg-danger/10 text-danger', value: 'text-danger' },
};

// Tons disponibles pour les pastilles secondaires (props "badges"), reprend la meme
// palette que le composant Badge global pour rester coherent dans toute l'app.
const BADGE_TONES = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  neutral: 'bg-ink900/8 text-ink900/60',
};

/**
 * badges (optionnel) : [{ label: '3 actifs', tone: 'success' }, ...]
 * Remplace l'affichage de "trend" quand la carte doit montrer plusieurs statuts
 * plutot qu'une seule tendance (cas de la carte "Clients" sur le Dashboard : "3 actifs"
 * + "3 alertes" cote a cote, au lieu d'un texte "+X% vs mois dernier").
 */
export default function StatCard({ label, sub, value, trend, badges, Icon, tone = 'indigo' }) {
  const t = TONES[tone];

  return (
    <div className="bg-surface rounded-xl border border-ink900/10 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-ink900/70">{label}</p>
          {sub && <p className="text-xs text-ink900/40">{sub}</p>}
        </div>
        {Icon && (
          <span className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.badge}`}>
            <Icon />
          </span>
        )}
      </div>

      <p className={`font-mono text-2xl font-semibold ${t.value}`}>{value}</p>

      {badges?.length ? (
        <div className="flex items-center gap-2 mt-2">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_TONES[b.tone] ?? BADGE_TONES.neutral}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      ) : (
        trend && <p className="text-xs text-ink900/40 mt-1.5">{trend}</p>
      )}
    </div>
  );
}
import { Link } from 'react-router-dom';
import TearLine from './ui/TearLine';

const POINTS_CLES = [
  { label: 'Ventes du jour', valeur: '16 transactions' },
  { label: 'Chiffre d\'affaires', valeur: '7 310 333 F CFA' },
  { label: 'Stock suivi en temps réel', valeur: 'Alertes automatiques' },
];

function PanneauVitrine() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-[440px] shrink-0 bg-indigo-700 px-10 py-12 text-paper overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-ochre-500/20 blur-3xl"
      />

      <div className="relative z-10">
        <span className="font-display text-xl font-semibold tracking-tight">
          <span className="text-paper">Miabé</span>
          <span className="text-ochre-400">Stock</span>
        </span>

        <h1 className="mt-10 font-display text-3xl font-semibold leading-tight">
          Gérez votre boutique,<br />pas votre paperasse.
        </h1>
        <p className="mt-4 text-sm text-paper/70 leading-relaxed max-w-[320px]">
          Ventes, stock, clients et trésorerie dans un seul espace, pensé pour les commerces
          d'Afrique de l'Ouest.
        </p>
      </div>

      {/* Mini-facture stylisée façon ticket de caisse */}
      <div className="relative z-10 rounded-xl bg-paper text-ink900 p-5 font-mono text-xs shadow-xl">
        <p className="font-display font-semibold text-sm mb-3 text-ink900">Aperçu du jour</p>
        <div className="space-y-2">
          {POINTS_CLES.map((p) => (
            <div key={p.label} className="flex items-center justify-between">
              <span className="text-ink900/50">{p.label}</span>
              <span className="font-semibold">{p.valeur}</span>
            </div>
          ))}
        </div>
        <div className="my-3">
          <TearLine />
        </div>
        <p className="text-ink900/40 text-[11px]">Aperçu illustratif — vos vraies données ici.</p>
      </div>

      <p className="relative z-10 text-xs text-paper/50">
        © {new Date().getFullYear()} MiabéStock
      </p>
    </div>
  );
}

/**
 * Layout auth : formulaire centré (par défaut), ou split-screen avec
 * panneau de marque quand showcase=true (utilisé sur l'inscription).
 */
export default function AuthLayout({ title, subtitle, children, footer, showcase = false }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper flex">
      {showcase && <PanneauVitrine />}

      <div className="relative flex-1">
        {!showcase && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-28 -left-20 h-72 w-72 rounded-full bg-indigo-500/12 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 -right-24 h-80 w-80 rounded-full bg-ochre-500/10 blur-3xl"
            />
          </>
        )}

        <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            {!showcase && (
              <Link
                to="/"
                className="mb-10 inline-block font-display text-xl font-semibold tracking-tight text-ink900"
              >
                <span className="text-indigo-600">Miabé</span>
                <span className="text-ochre-500">Stock</span>
              </Link>
            )}

            <h2 className="font-display text-2xl font-semibold text-ink900">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-ink900/55">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 text-center text-sm text-ink900/55">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
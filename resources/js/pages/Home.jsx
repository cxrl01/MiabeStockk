import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Button from '../components/ui/Button';

/* ------------------------------------------------------------------ */
/* Données                                                              */
/* ------------------------------------------------------------------ */

const TRUST = [
  {
    label: 'Données sécurisées',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    label: 'Multi-boutiques',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    label: 'Temps réel',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  },
  {
    label: 'Web & mobile',
    icon: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </>
    ),
  },
];

const FEATURES = [
  {
    titre: 'Point de vente rapide',
    texte:
      'Créez une vente en quelques secondes. Calculez le total automatiquement, choisissez le mode de paiement et générez la facture instantanément.',
    icon: (
      <>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </>
    ),
  },
  {
    titre: 'Gestion des stocks',
    texte:
      "Suivez chaque produit en temps réel. Recevez une alerte automatique dès qu'un article approche de son seuil critique, avant la rupture.",
    icon: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    titre: 'Suivi des dettes',
    texte:
      "Chaque paiement partiel génère sa propre facture numérotée. Retrouvez l'historique complet de chaque client en cas de litige.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    titre: 'Trésorerie en temps réel',
    texte:
      'Entrées, sorties, dépenses courantes : visualisez votre solde exact à tout moment, sans attendre la fin du mois.',
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  {
    titre: 'Rapports & statistiques',
    texte:
      "Chiffre d'affaires, marges, top ventes : prenez des décisions basées sur vos vraies données, exportables en PDF.",
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
  {
    titre: 'Équipe & rôles',
    texte:
      'Le Gérant crée et gère les comptes Gestionnaire et Commercial. Chacun accède uniquement à ce qui le concerne.',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
];

const STEPS = [
  {
    num: '01',
    titre: 'Créez votre boutique',
    texte: 'Inscrivez-vous, configurez le nom, la devise et le logo de votre boutique en moins de 2 minutes.',
  },
  {
    num: '02',
    titre: 'Ajoutez vos produits',
    texte: "Importez votre catalogue, définissez les prix d'achat et de vente, et paramétrez les seuils d'alerte.",
  },
  {
    num: '03',
    titre: 'Vendez et suivez',
    texte: 'Enregistrez vos ventes, gérez vos clients et consultez vos rapports depuis n’importe quel appareil.',
  },
];

const FAQ = [
  {
    q: 'MiabéStock fonctionne-t-il sans connexion internet stable ?',
    a: "L'application est conçue pour être légère et rapide, même avec une connexion limitée. Les données sont synchronisées dès que la connexion est rétablie.",
  },
  {
    q: 'Qui peut créer des comptes Gestionnaire ou Commercial ?',
    a: 'Seul le Gérant, propriétaire de la boutique, peut créer et gérer les comptes de son équipe. Chaque employé accède uniquement aux modules qui lui sont attribués.',
  },
  {
    q: 'Comment fonctionne la facturation des dettes ?',
    a: "Chaque paiement reçu génère automatiquement une facture distincte avec un numéro unique. Vous pouvez retrouver l'historique complet de chaque client en cas de litige.",
  },
  {
    q: 'Mes données sont-elles isolées des autres boutiques ?',
    a: 'Oui. Chaque boutique dispose de son espace entièrement isolé. Aucun autre utilisateur externe ne peut accéder à vos données.',
  },
];

const NAV_ITEMS = [
  { label: 'Tableau de bord', active: true },
  { label: 'Stocks' },
  { label: 'Ventes' },
  { label: 'Clients' },
  { label: 'Trésorerie' },
  { label: 'Rapports' },
];

const KPIS = [
  { label: 'Ventes du jour', val: 124500, suffix: ' F', badge: '+12%', up: true },
  { label: 'Produits en stock', val: 347, suffix: '', badge: '3 alertes', up: false },
  { label: 'Dettes clients', val: 89200, suffix: ' F', badge: '5 impayés', up: false },
  { label: 'Marge nette', val: 31, suffix: ' %', badge: '+3 pts', up: true },
];

const LEDGER_SEED = [
  { id: 1, type: 'dette', label: 'Ama Mensah', note: '2 sacs de riz, 1 bidon d’huile', montant: 3500 },
];
const PAIEMENTS_QUEUE = [1500, 1200, 800];

/* ------------------------------------------------------------------ */
/* Utilitaires                                                          */
/* ------------------------------------------------------------------ */

function Icon({ children, className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function useCountUp(target, active, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let start;
    let frame;
    const step = (ts) => {
      if (start === undefined) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return value;
}

function KpiCard({ kpi }) {
  const [ref, visible] = useReveal(0.4);
  const value = useCountUp(kpi.val, visible);
  return (
    <div ref={ref} className="rounded-xl border border-ink900/8 bg-white p-4">
      <p className="text-xs text-ink900/45">{kpi.label}</p>
      <p className="mt-1 font-mono text-lg font-medium text-ink900">
        {value.toLocaleString('fr-FR')}
        {kpi.suffix}
      </p>
      <span className={`mt-2 inline-block font-mono text-[11px] ${kpi.up ? 'text-success' : 'text-danger'}`}>
        {kpi.badge}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Le carnet — démo interactive du suivi de dettes                     */
/* ------------------------------------------------------------------ */

function LedgerDemo() {
  const [entries, setEntries] = useState(LEDGER_SEED);
  const [queue, setQueue] = useState(PAIEMENTS_QUEUE);
  const [receiptNo, setReceiptNo] = useState(0);

  const solde = entries.reduce((acc, e) => acc + (e.type === 'dette' ? e.montant : -e.montant), 0);
  const solde_zero = solde <= 0;

  const handlePayment = () => {
    if (queue.length === 0) return;
    const [montant, ...rest] = queue;
    const nextNo = receiptNo + 1;
    setEntries((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        type: 'paiement',
        label: 'Ama Mensah',
        note: `Facture N°${String(nextNo).padStart(4, '0')} générée`,
        montant,
      },
    ]);
    setReceiptNo(nextNo);
    setQueue(rest);
  };

  const handleReset = () => {
    setEntries(LEDGER_SEED);
    setQueue(PAIEMENTS_QUEUE);
    setReceiptNo(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-sm rotate-1 motion-safe:transition-transform motion-safe:hover:rotate-0 motion-safe:duration-500">
      {/* trous de reliure */}
      <div className="absolute -top-2.5 left-8 right-8 z-10 flex justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="h-3 w-3 rounded-full bg-paper ring-2 ring-ink900/15" />
        ))}
      </div>

      <div
        className="overflow-hidden rounded-lg border border-ink900/10 bg-[#FBF8F1] pt-6 shadow-[0_28px_60px_-20px_rgba(21,39,71,0.4)]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 30px, rgba(30,63,115,0.14) 31px)',
          backgroundPosition: '0 46px',
        }}
      >
        <div className="relative px-6 pb-2">
          <span className="absolute left-3 top-0 h-full w-px bg-danger/35" />
          <p className="pl-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink900/40">
            Carnet de crédit
          </p>
          <p className="pl-4 font-display text-sm font-semibold text-ink900">Cliente : Ama Mensah</p>
        </div>

        <div className="relative space-y-1 px-6 pb-3">
          <span className="absolute left-3 top-0 h-full w-px bg-danger/35" />
          {entries.map((e) => (
            <div key={e.id} className="flex items-baseline justify-between gap-3 pl-4 text-sm">
              <span className="min-w-0 text-ink900/70">
                <span className="text-ink900/40">{e.type === 'dette' ? 'Achat — ' : 'Payé — '}</span>
                {e.note}
              </span>
              <span
                className={`shrink-0 font-mono text-xs ${
                  e.type === 'dette' ? 'text-danger' : 'text-success'
                }`}
              >
                {e.type === 'dette' ? '+' : '−'}
                {e.montant.toLocaleString('fr-FR')} F
              </span>
            </div>
          ))}
        </div>

        <div className="relative border-t border-dashed border-ink900/20 px-6 py-4">
          <span className="absolute left-3 top-0 h-full w-px bg-danger/35" />
          <div className="flex items-center justify-between pl-4">
            <span className="text-xs font-medium uppercase tracking-wide text-ink900/50">
              Solde du compte
            </span>
            <span className={`font-mono text-lg font-semibold ${solde_zero ? 'text-success' : 'text-ink900'}`}>
              {solde_zero ? 'Soldé ✓' : `${solde.toLocaleString('fr-FR')} F`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <Button
          variant="boutique"
          onClick={handlePayment}
          disabled={queue.length === 0}
          className="px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {queue.length === 0 ? 'Compte soldé' : 'Enregistrer un paiement'}
        </Button>
        {queue.length === 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="font-mono text-xs text-ink900/40 underline-offset-2 hover:text-ink900/70 hover:underline"
          >
            Rejouer
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ accordéon                                                        */
/* ------------------------------------------------------------------ */

function FaqAccordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="rounded-xl border border-ink900/10 bg-paper open:bg-white">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-sm font-semibold text-ink900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
            >
              {item.q}
              <span
                className={`shrink-0 font-mono text-ochre-500 motion-safe:transition-transform motion-safe:duration-300 ${
                  isOpen ? 'rotate-45' : ''
                }`}
              >
                +
              </span>
            </button>
            <div
              className="grid motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="border-t border-ink900/8 px-5 py-4 text-sm leading-relaxed text-ink900/60">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sélecteur de plan interactif                                        */
/* ------------------------------------------------------------------ */

function PlanSlider({ count, onChange }) {
  return (
    <div className="mx-auto mb-10 max-w-md rounded-xl border border-ink900/10 bg-white p-5 text-left">
      <label htmlFor="product-count" className="flex items-center justify-between text-sm font-medium text-ink900/70">
        <span>Combien de produits gérez-vous ?</span>
        <span className="font-mono text-ink900">{count}</span>
      </label>
      <input
        id="product-count"
        type="range"
        min="10"
        max="500"
        step="10"
        value={count}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-indigo-700"
      />
      <p className="mt-3 text-xs text-ink900/50">
        {count <= 100
          ? 'Le plan Starter couvre largement votre catalogue.'
          : "Au-delà de 100 produits, le plan Pro évite de surveiller la limite."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [productCount, setProductCount] = useState(80);
  const recommended = productCount <= 100 ? 'starter' : 'pro';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper text-ink900">
      {/* Atmosphère */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-indigo-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[28%] -right-20 h-[380px] w-[380px] rounded-full bg-ochre-500/12 blur-3xl"
      />

      {/* Nav */}
      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between border-b border-dashed border-ink900/15 px-6 py-5">
        <Link
          to="/"
          className="font-display text-2xl font-semibold tracking-tight text-indigo-700 sm:text-3xl"
        >
          Miabé<span className="text-ochre-500">Stock</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/connexion">
            <Button variant="ghost" className="text-ink900/70">
              Connexion
            </Button>
          </Link>
          <Link to="/inscription">
            <Button variant="boutique">Créer ma boutique</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className={`relative z-10 mx-auto grid max-w-6xl gap-14 px-6 pb-16 pt-14 motion-safe:transition-all motion-safe:duration-700 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="text-center lg:text-left">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-ochre-600">
            Fini le cahier qui se perd
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink900 sm:text-5xl lg:text-6xl">
            Le carnet de votre boutique,
            <br />
            <em className="not-italic text-indigo-700">enfin incassable.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink900/60 sm:text-lg lg:mx-0">
            Stock, ventes, dettes clients et trésorerie — dans un carnet numérique que vous ne
            perdrez jamais, et que vous n&apos;oublierez jamais d&apos;emporter.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link to="/inscription">
              <Button variant="boutique" className="px-6 py-3 text-base">
                Commencer gratuitement
              </Button>
            </Link>
            <a href="#features">
              <Button variant="ghost" className="border-indigo-700/25 px-6 py-3 text-base text-indigo-700">
                Voir les fonctionnalités
              </Button>
            </a>
          </div>
          <p className="mt-6 text-xs text-ink900/40">
            À droite : suivez le compte-crédit d&apos;Ama en direct, comme dans le vrai cahier.
          </p>
        </div>

        <LedgerDemo />
      </section>

      {/* Trust */}
      <div className="relative z-10 border-y border-ink900/8 bg-white/40 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm font-medium text-ink900/70">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-900/5 text-indigo-700">
                <Icon className="h-4 w-4">{item.icon}</Icon>
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Preview dashboard */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ochre-600">Interface</p>
          <h2 className="font-display text-2xl font-semibold text-ink900 sm:text-3xl">
            Tout ce qu&apos;il vous faut, d&apos;un coup d&apos;œil
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink900/10 bg-white shadow-[0_24px_80px_-24px_rgba(21,39,71,0.35)]">
          <div className="flex items-center gap-2 border-b border-ink900/8 bg-paper/80 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-success/80">
              <span className="absolute inset-0 animate-ping rounded-full bg-success/60" />
            </span>
            <span className="ml-3 font-mono text-xs text-ink900/40">app.miabestock.com/dashboard</span>
          </div>

          <div className="grid lg:grid-cols-[220px_1fr]">
            <aside className="hidden border-r border-ink900/8 bg-indigo-950 p-5 text-paper lg:block">
              <div className="mb-8 font-display text-sm font-semibold tracking-tight">MiabéStock</div>
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg px-3 py-2.5 text-sm ${
                      item.active
                        ? 'bg-indigo-700/40 text-paper'
                        : 'text-indigo-500 hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </aside>

            <div className="bg-paper p-5 sm:p-6">
              <p className="mb-5 font-display text-base font-semibold text-ink900">
                Bonjour, Kofi — Voici votre journée
              </p>

              <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {KPIS.map((kpi) => (
                  <KpiCard key={kpi.label} kpi={kpi} />
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-ink900/8 bg-white p-4">
                  <p className="mb-4 text-xs font-medium text-ink900/50">Ventes — 6 derniers mois</p>
                  <div className="flex h-28 items-end gap-2">
                    {[40, 55, 45, 70, 60, 85].map((h, i) => (
                      <div
                        key={h + i}
                        className={`flex-1 rounded-t motion-safe:transition-all motion-safe:duration-700 ${
                          i === 5 ? 'bg-ochre-500' : 'bg-indigo-600/70'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-ink900/35">
                    {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-ink900/8 bg-white p-4">
                  <p className="mb-4 text-xs font-medium text-ink900/50">Top catégories</p>
                  <div className="flex items-center gap-5">
                    <svg width="80" height="80" viewBox="0 0 36 36" aria-hidden="true">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E8E4DC" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#1E3F73"
                        strokeWidth="3"
                        strokeDasharray="45 55"
                        strokeDashoffset="25"
                        transform="rotate(-90 18 18)"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#3E6BAE"
                        strokeWidth="3"
                        strokeDasharray="28 72"
                        strokeDashoffset="-20"
                        transform="rotate(-90 18 18)"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="none"
                        stroke="#C97F2E"
                        strokeWidth="3"
                        strokeDasharray="27 73"
                        strokeDashoffset="-48"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                    <div className="space-y-2 text-xs text-ink900/70">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-700" /> Alimentation 45%
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" /> Boissons 28%
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-ochre-500" /> Autres 27%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ochre-600">Fonctionnalités</p>
        <h2 className="font-display text-2xl font-semibold text-ink900 sm:text-3xl">
          Tout ce dont votre commerce a besoin
        </h2>
        <p className="mt-3 max-w-xl text-ink900/60">
          Six modules pensés pour s&apos;adapter à votre façon de travailler, pas l&apos;inverse.
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.titre} delay={i * 80} className="group">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-900 text-ochre-500 motion-safe:transition-transform motion-safe:duration-300 group-hover:-rotate-6 group-hover:scale-105">
                <Icon>{f.icon}</Icon>
              </div>
              <h3 className="font-display text-lg font-semibold text-ink900">{f.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink900/60">{f.texte}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 border-y border-ink900/8 bg-indigo-950 text-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ochre-500">
              Comment ça marche
            </p>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Opérationnel en 3 étapes
            </h2>
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.num} delay={i * 100}>
                <div className="mb-4 font-mono text-sm text-ochre-500">{s.num}</div>
                <h3 className="font-display text-lg font-semibold">{s.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-indigo-500">{s.texte}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ochre-600">Tarifs</p>
        <h2 className="font-display text-2xl font-semibold text-ink900 sm:text-3xl">
          Simple et transparent
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink900/60">
          Commencez gratuitement. Évoluez quand vous en avez besoin.
        </p>

        <PlanSlider count={productCount} onChange={setProductCount} />

        <div className="grid gap-6 text-left md:grid-cols-2">
          <div
            className={`rounded-2xl border bg-white p-8 motion-safe:transition-all motion-safe:duration-300 ${
              recommended === 'starter'
                ? 'border-ochre-500 ring-2 ring-ochre-500/60'
                : 'border-ink900/10 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold text-ink900">Starter</p>
              {recommended === 'starter' && (
                <span className="rounded-full bg-ochre-500/15 px-2.5 py-1 font-mono text-[10px] font-medium text-ochre-600">
                  Fait pour vous
                </span>
              )}
            </div>
            <p className="mt-2 font-display text-3xl font-semibold text-ink900">Gratuit</p>
            <p className="mt-2 text-sm text-ink900/55">
              Pour démarrer et tester la plateforme sans engagement.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink900/70">
              {['1 boutique', 'Jusqu’à 100 produits', 'Gestion des ventes', 'Suivi des dettes'].map(
                (item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-ochre-500">✓</span> {item}
                  </li>
                )
              )}
            </ul>
            <Link to="/inscription" className="mt-8 block">
              <Button variant="ghost" className="w-full border-ink900/15 text-ink900">
                Commencer
              </Button>
            </Link>
          </div>

          <div
            className={`relative rounded-2xl border bg-indigo-950 p-8 text-paper motion-safe:transition-all motion-safe:duration-300 ${
              recommended === 'pro'
                ? 'border-ochre-500 ring-2 ring-ochre-500/60'
                : 'border-indigo-700/30 opacity-80'
            }`}
          >
            <span className="absolute -top-3 left-8 rounded-full bg-ochre-500 px-3 py-1 font-mono text-[11px] font-medium text-white">
              {recommended === 'pro' ? 'Fait pour vous' : 'Le plus choisi'}
            </span>
            <p className="font-display text-lg font-semibold">Pro</p>
            <p className="mt-2 font-display text-3xl font-semibold">
              9 900 F<span className="text-base font-normal text-indigo-500">/mois</span>
            </p>
            <p className="mt-2 text-sm text-indigo-500">
              Pour les boutiques actives qui veulent tout contrôler.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-indigo-500">
              {[
                'Boutiques illimitées',
                'Produits illimités',
                "Gestion d'équipe complète",
                'Rapports & exports PDF',
                'Alertes automatiques',
                'Support prioritaire',
              ].map((item) => (
                <li key={item} className="flex gap-2 text-paper/85">
                  <span className="text-ochre-500">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link to="/inscription" className="mt-8 block">
              <Button variant="boutique" className="w-full">
                Essayer 14 jours gratuit
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 border-t border-ink900/8 bg-white/50">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-10 text-center">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ochre-600">FAQ</p>
            <h2 className="font-display text-2xl font-semibold text-ink900 sm:text-3xl">
              Questions fréquentes
            </h2>
          </div>
          <FaqAccordion items={FAQ} />
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 bg-indigo-900 px-6 py-20 text-center text-paper">
        <h2 className="mx-auto max-w-2xl font-display text-2xl font-semibold sm:text-3xl">
          Prenez le contrôle de votre commerce dès aujourd&apos;hui
        </h2>
        <p className="mx-auto mt-4 max-w-md text-indigo-500">
          Rejoignez les commerçants qui pilotent leur activité avec précision — sans complexité
          inutile.
        </p>
        <Link to="/inscription" className="mt-8 inline-block">
          <Button variant="boutique" className="px-6 py-3 text-base">
            Créer ma boutique gratuitement
          </Button>
        </Link>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-ink900/40">
        <span className="font-display text-lg font-semibold tracking-tight text-indigo-700">
          Miabé<span className="text-ochre-500">Stock</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden font-mono text-[11px] text-ink900/30 sm:inline" title="« Bienvenue » en langue éwé, parlée à Lomé">
            Woezor 👋
          </span>
          © {new Date().getFullYear()} MiabéStock — Tous droits réservés
        </span>
      </footer>
    </div>
  );
}
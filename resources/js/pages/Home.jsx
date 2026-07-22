import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Button from '../components/ui/Button';

/* ------------------------------------------------------------------ */
/* Données — uniquement des fonctionnalités réellement construites     */
/* ------------------------------------------------------------------ */

const TRUST = [
  {
    label: 'Données isolées par boutique',
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
    label: 'Stock mis à jour en temps réel',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  },
  {
    label: 'Rôles & permissions',
    icon: <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  },
];

const FEATURES = [
  {
    titre: 'Point de vente rapide',
    texte:
      'Ajoutez des produits au panier, calculez le total HT/TVA/TTC automatiquement, encaissez et générez la facture PDF en un clic.',
    icon: (
      <>
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </>
    ),
  },
  {
    titre: 'Import Excel du catalogue',
    texte:
      "Des centaines de produits à ajouter ? Un seul fichier Excel suffit — plus besoin de les saisir un par un, ligne par ligne.",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
      </>
    ),
  },
  {
    titre: 'Stock & alertes de seuil',
    texte:
      "Chaque vente et chaque livraison met le stock à jour automatiquement. Une alerte apparaît dès qu'un produit passe sous son seuil.",
    icon: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    titre: 'Clients & relance WhatsApp',
    texte:
      "Suivez la dette de chaque client et relancez-le directement sur WhatsApp, message pré-rempli, en un clic.",
    icon: (
      <>
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </>
    ),
  },
  {
    titre: 'Fournisseurs & livraisons',
    texte:
      'Enregistrez vos livraisons fournisseurs : le stock augmente automatiquement, et la dette fournisseur se met à jour toute seule.',
    icon: (
      <>
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </>
    ),
  },
  {
    titre: 'Équipe & rôles',
    texte:
      'Le Gérant crée les comptes Gestionnaire et Commercial. Chacun accède exactement à ce dont il a besoin, pas plus.',
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
    titre: 'Dépenses & trésorerie',
    texte:
      'Loyer, salaires, achats de stock — suivez ce qui sort de la caisse au même endroit que ce qui y entre.',
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  {
    titre: 'Rapports & export PDF',
    texte:
      "Chiffre d'affaires, résultat net, top produits : votre activité en un coup d'œil, exportable en PDF pour vos archives.",
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
];

const STEPS = [
  {
    num: '01',
    titre: 'Créez votre boutique',
    texte: 'Inscrivez-vous en tant que Gérant et configurez votre boutique en quelques minutes.',
  },
  {
    num: '02',
    titre: 'Importez votre catalogue',
    texte: 'Un fichier Excel avec vos produits, prix et quantités — ou ajoutez-les un par un si vous préférez.',
  },
  {
    num: '03',
    titre: 'Vendez et suivez',
    texte: "Encaissez, suivez vos stocks et vos dettes clients, invitez votre équipe quand vous êtes prêt.",
  },
];

const FAQ = [
  {
    q: 'Qui peut créer des comptes Gestionnaire ou Commercial ?',
    a: 'Seul le Gérant, propriétaire de la boutique, peut créer et gérer les comptes de son équipe. Chaque employé accède uniquement aux modules qui lui sont attribués.',
  },
  {
    q: 'Puis-je gérer plusieurs boutiques avec un seul compte ?',
    a: "Oui. Un Gérant peut posséder plusieurs boutiques et passer de l'une à l'autre depuis son espace.",
  },
  {
    q: 'Comment fonctionne le suivi des dettes clients ?',
    a: "Chaque vente à crédit met à jour la dette du client. Vous pouvez relancer un client directement sur WhatsApp, avec un message pré-rempli reprenant le montant dû.",
  },
  {
    q: 'Mes données sont-elles isolées des autres boutiques ?',
    a: 'Oui. Chaque boutique dispose de son espace entièrement isolé — aucun autre utilisateur externe ne peut y accéder.',
  },
  {
    q: "Dois-je saisir mon catalogue produit par produit ?",
    a: "Non, vous pouvez importer tout votre catalogue d'un coup depuis un fichier Excel — pratique si vous avez déjà une liste de produits.",
  },
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

/* ------------------------------------------------------------------ */
/* Le carnet — démo interactive du suivi de dettes (mécanique réelle)  */
/* ------------------------------------------------------------------ */

function LedgerDemo() {
  const [entries, setEntries] = useState(LEDGER_SEED);
  const [queue, setQueue] = useState(PAIEMENTS_QUEUE);
  const [receiptNo, setReceiptNo] = useState(0);

  const solde = entries.reduce((acc, e) => acc + (e.type === 'dette' ? e.montant : -e.montant), 0);
  const soldeZero = solde <= 0;

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
        note: `Paiement enregistré`,
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
            Fiche client — dette
          </p>
          <p className="pl-4 font-display text-sm font-semibold text-ink900">Ama Mensah</p>
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
              Dette restante
            </span>
            <span className={`font-mono text-lg font-semibold ${soldeZero ? 'text-success' : 'text-ink900'}`}>
              {soldeZero ? 'Soldée ✓' : `${solde.toLocaleString('fr-FR')} F`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        {/* {!soldeZero && (
          <Button
            variant="ghost"
            className="border-success/30 px-3 py-2 text-sm text-success"
            onClick={() => window.open('https://wa.me/22890000000?text=' + encodeURIComponent('Bonjour Ama, un rappel amical concernant votre dette.'), '_blank')}
          >
            Relancer sur WhatsApp
          </Button>
        )} */}
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
/* Footer                                                                */
/* ------------------------------------------------------------------ */

const FOOTER_LIENS = {
  Produit: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Comment ça marche', href: '#comment-ca-marche' },
    { label: 'Créer ma boutique', to: '/inscription' },
  ],
  Ressources: [
    { label: 'Questions fréquentes', href: '#faq' },
    { label: 'Se connecter', to: '/connexion' },
  ],
};

function PiedDePage() {
  return (
    <footer className="relative z-10 border-t border-ink900/10 bg-indigo-950 text-paper">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
              Miabé<span className="text-ochre-500">Stock</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-indigo-500">
              Le carnet de votre boutique, enfin numérique. Ventes, stock, dettes clients et
              trésorerie, pensé pour les commerçants togolais.
            </p>
            <p className="mt-6 font-mono text-xs text-indigo-700" title="« Bienvenue » en langue éwé, parlée à Lomé">
              Woezor 👋 — Lomé, Togo
            </p>
          </div>

          {Object.entries(FOOTER_LIENS).map(([titre, liens]) => (
            <div key={titre}>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-ochre-500 mb-4">
                {titre}
              </p>
              <ul className="space-y-3 text-sm">
                {liens.map((lien) => (
                  <li key={lien.label}>
                    {lien.to ? (
                      <Link to={lien.to} className="text-indigo-500 hover:text-paper transition-colors">
                        {lien.label}
                      </Link>
                    ) : (
                      <a href={lien.href} className="text-indigo-500 hover:text-paper transition-colors">
                        {lien.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-indigo-800/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-indigo-700">
            © {new Date().getFullYear()} MiabeStock — Tous droits réservés
          </p>
          <p className="font-mono text-xs text-indigo-700">
            Application de gestion commerciale multi-boutique
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [mounted, setMounted] = useState(false);

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
                Créer ma boutique
              </Button>
            </Link>
            <a href="#features">
              <Button variant="ghost" className="border-indigo-700/25 px-6 py-3 text-base text-indigo-700">
                Voir les fonctionnalités
              </Button>
            </a>
          </div>
          <p className="mt-6 text-xs text-ink900/40">
            À droite : la fiche dette d&apos;Ama Mensah, mise à jour en direct.
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

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ochre-600">Fonctionnalités</p>
        <h2 className="font-display text-2xl font-semibold text-ink900 sm:text-3xl">
          Tout ce dont votre commerce a besoin
        </h2>
        <p className="mt-3 max-w-xl text-ink900/60">
          Huit modules pensés pour s&apos;adapter à votre façon de travailler, pas l&apos;inverse.
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
      <section id="comment-ca-marche" className="relative z-10 border-y border-ink900/8 bg-indigo-950 text-paper">
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

      {/* FAQ */}
      <section id="faq" className="relative z-10 border-t border-ink900/8 bg-white/50">
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

      <PiedDePage />
    </div>
  );
}
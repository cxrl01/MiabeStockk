import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

const NOMS_MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES = Array.from({ length: 5 }, (_, i) => ANNEE_COURANTE - i);

function filtresParDefaut() {
  const maintenant = new Date();
  return {
    type: 'mois',
    mois: maintenant.getMonth() + 1,
    annee: ANNEE_COURANTE,
    debut: '',
    fin: '',
  };
}

function versParams(filtres) {
  if (filtres.type === 'annee') {
    return { type: 'annee', annee: filtres.annee };
  }
  if (filtres.type === 'periode') {
    return { type: 'periode', debut: filtres.debut, fin: filtres.fin };
  }
  return { type: 'mois', mois: filtres.mois, annee: filtres.annee };
}

// Libellés d'axe : ajoute l'année en suffixe si les données couvrent plusieurs années
// (ex. periode personnalisée juin 2025 -> mars 2026), sinon juste le mois.
function libellesMois(data) {
  const anneesDistinctes = new Set(data.map((d) => d.annee));
  return data.map((d) =>
    anneesDistinctes.size > 1
      ? `${NOMS_MOIS[d.mois - 1]} '${String(d.annee).slice(2)}`
      : NOMS_MOIS[d.mois - 1]
  );
}

// Génère un chemin SVG en courbe lissée (Catmull-Rom -> Bézier) à partir de points {x, y}
function genererCourbeLissee(points) {
  if (points.length < 2) return '';
  const d = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(' ');
}

function GraphiqueCourbe({ valeurs, labels, couleur, formatValeur, hauteur = 180 }) {
  const largeur = 600;
  const padding = 24;
  const paddingBas = 28;

  if (!valeurs.length) {
    return (
      <div className="flex items-center justify-center text-sm text-ink900/40" style={{ height: hauteur }}>
        Aucune donnée sur la période.
      </div>
    );
  }

  const max = Math.max(...valeurs, 1);
  const min = Math.min(...valeurs, 0);
  const echelle = max - min || 1;
  const step = valeurs.length > 1 ? (largeur - padding * 2) / (valeurs.length - 1) : 0;

  const points = valeurs.map((v, i) => ({
    x: padding + i * step,
    y: hauteur - paddingBas - ((v - min) / echelle) * (hauteur - paddingBas - padding),
  }));

  const cheminLigne = genererCourbeLissee(points);
  const cheminAire = `${cheminLigne} L ${points[points.length - 1].x} ${hauteur - paddingBas} L ${points[0].x} ${hauteur - paddingBas} Z`;

  return (
    <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="w-full" style={{ height: hauteur }}>
      <path d={cheminAire} fill={couleur} fillOpacity="0.08" />
      <path d={cheminLigne} fill="none" stroke={couleur} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={couleur} strokeWidth="2.5">
          <title>{formatValeur ? formatValeur(valeurs[i]) : valeurs[i]}</title>
        </circle>
      ))}
      {labels.map((label, i) => (
        <text key={i} x={points[i].x} y={hauteur - 6} textAnchor="middle" fontSize="10" fill="#9ca3af">
          {label}
        </text>
      ))}
    </svg>
  );
}

export default function RapportsStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');
  const [exportEnCours, setExportEnCours] = useState(false);

  const [filtres, setFiltres] = useState(filtresParDefaut());
  const [filtresAppliques, setFiltresAppliques] = useState(filtresParDefaut());

  // Tableau 6 du mémoire : "Générer rapports et statistiques" / "Exporter
  // rapport PDF" = Gérant uniquement.
  const estGerant = user?.role?.nom === 'gerant';

  useEffect(() => {
    if (!estGerant) return;

    const params = versParams(filtresAppliques);

    api.get('/rapports/statistiques', { params })
      .then(({ data }) => setStats(data))
      .catch(() => setErreur('Impossible de charger les statistiques.'));

    api.get('/rapports/resultat-net', { params })
      .then(({ data }) => setResultat(data))
      .catch(() => {});
  }, [estGerant, filtresAppliques]);

  const appliquerFiltres = (e) => {
    e.preventDefault();
    if (filtres.type === 'periode' && (!filtres.debut || !filtres.fin)) {
      setErreur('Sélectionne une date de début et de fin.');
      return;
    }
    setErreur('');
    setFiltresAppliques(filtres);
  };

  const exporterPdf = async () => {
    setExportEnCours(true);
    try {
      const params = versParams(filtresAppliques);
      const { data } = await api.get('/rapports/export-pdf', { params, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        const texte = await error.response.data.text();
        const json = JSON.parse(texte);
        setErreur(json.message || 'Impossible de générer le rapport PDF.');
      } else {
        setErreur('Impossible de générer le rapport PDF.');
      }
    } finally {
      setExportEnCours(false);
    }
  };

  if (!estGerant) {
    return (
      <AppShell title="Rapports & Stats">
        <p className="text-sm text-ink900/50 bg-ink900/[0.03] rounded-lg px-4 py-3">
          Cette page est réservée au Gérant.
        </p>
      </AppShell>
    );
  }

  const anneeGraphique = stats?.periode?.debut ? new Date(stats.periode.debut).getFullYear() : ANNEE_COURANTE;

  return (
    <AppShell title="Rapports & Stats">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <form onSubmit={appliquerFiltres} className="bg-surface rounded-xl border border-ink900/10 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-ink900/50 mb-1">Filtrer par</label>
            <select
              value={filtres.type}
              onChange={(e) => setFiltres((f) => ({ ...f, type: e.target.value }))}
              className="rounded-lg border border-ink900/15 text-sm px-3 py-2"
            >
              <option value="mois">Mois</option>
              <option value="annee">Année</option>
              <option value="periode">Période personnalisée</option>
            </select>
          </div>

          {filtres.type === 'mois' && (
            <>
              <div>
                <label className="block text-xs text-ink900/50 mb-1">Mois</label>
                <select
                  value={filtres.mois}
                  onChange={(e) => setFiltres((f) => ({ ...f, mois: Number(e.target.value) }))}
                  className="rounded-lg border border-ink900/15 text-sm px-3 py-2"
                >
                  {NOMS_MOIS.map((nom, i) => (
                    <option key={nom} value={i + 1}>{nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink900/50 mb-1">Année</label>
                <select
                  value={filtres.annee}
                  onChange={(e) => setFiltres((f) => ({ ...f, annee: Number(e.target.value) }))}
                  className="rounded-lg border border-ink900/15 text-sm px-3 py-2"
                >
                  {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </>
          )}

          {filtres.type === 'annee' && (
            <div>
              <label className="block text-xs text-ink900/50 mb-1">Année</label>
              <select
                value={filtres.annee}
                onChange={(e) => setFiltres((f) => ({ ...f, annee: Number(e.target.value) }))}
                className="rounded-lg border border-ink900/15 text-sm px-3 py-2"
              >
                {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}

          {filtres.type === 'periode' && (
            <>
              <div>
                <label className="block text-xs text-ink900/50 mb-1">Du</label>
                <input
                  type="date"
                  value={filtres.debut}
                  onChange={(e) => setFiltres((f) => ({ ...f, debut: e.target.value }))}
                  className="rounded-lg border border-ink900/15 text-sm px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-ink900/50 mb-1">Au</label>
                <input
                  type="date"
                  value={filtres.fin}
                  onChange={(e) => setFiltres((f) => ({ ...f, fin: e.target.value }))}
                  className="rounded-lg border border-ink900/15 text-sm px-3 py-2"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="rounded-lg bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 hover:bg-indigo-800"
          >
            Appliquer
          </button>

          <button
            type="button"
            onClick={exporterPdf}
            disabled={exportEnCours}
            className="ml-auto inline-flex items-center justify-center rounded-lg border border-indigo-700 text-indigo-700
              text-sm font-medium px-4 py-2.5 hover:bg-indigo-700/5 disabled:opacity-50"
          >
            {exportEnCours ? 'Génération…' : 'Exporter en PDF'}
          </button>
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">CA sur la période</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats ? formatMontant(stats.ca_periode) : '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Ventes (période)</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats?.ventes_periode ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Nouveaux clients (période)</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats?.nouveaux_clients_periode ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Produits vendus (période)</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats?.produits_vendus_periode ?? '—'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <h2 className="font-display font-semibold text-ink900 mb-1">Chiffre d'affaires mensuel</h2>
          <p className="text-xs text-ink900/40 mb-4">Depuis janvier {anneeGraphique}</p>
          <GraphiqueCourbe
            valeurs={(stats?.ca_mensuel ?? []).map((m) => m.total)}
            labels={libellesMois(stats?.ca_mensuel ?? [])}
            couleur="#4338ca"
            formatValeur={formatMontant}
          />
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <h2 className="font-display font-semibold text-ink900 mb-1">Nombre de ventes</h2>
          <p className="text-xs text-ink900/40 mb-4">Depuis janvier {anneeGraphique}</p>
          <GraphiqueCourbe
            valeurs={(stats?.ventes_mensuel ?? []).map((m) => m.nombre)}
            labels={libellesMois(stats?.ventes_mensuel ?? [])}
            couleur="#15803d"
            formatValeur={(v) => `${v} ventes`}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <h2 className="font-display font-semibold text-ink900 mb-4">Top 5 produits</h2>
          {stats?.top_produits?.length ? (
            <div className="space-y-3">
              {stats.top_produits.map((p) => (
                <div key={p.nom} className="flex items-center justify-between text-sm">
                  <span className="text-ink900">{p.nom}</span>
                  <div className="text-right">
                    <p className="font-mono text-ink900">{p.quantite_vendue} ventes</p>
                    <p className="text-xs text-ink900/40">{formatMontant(p.montant_total)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink900/40 py-6 text-center">Aucune vente sur la période.</p>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <h2 className="font-display font-semibold text-ink900 mb-4">Résultat net (période sélectionnée)</h2>
          {resultat ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-ink900/60">
                <span>Chiffre d'affaires</span>
                <span className="font-mono">{formatMontant(resultat.chiffre_affaires)}</span>
              </div>
              <div className="flex justify-between text-ink900/60">
                <span>Coût des livraisons</span>
                <span className="font-mono">− {formatMontant(resultat.cout_livraisons)}</span>
              </div>
              <div className="flex justify-between text-ink900/60">
                <span>Dépenses</span>
                <span className="font-mono">− {formatMontant(resultat.depenses)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-ink900/10 font-semibold">
                <span className="text-ink900">Résultat net</span>
                <span className={`font-mono ${resultat.resultat_net >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatMontant(resultat.resultat_net)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink900/40 py-6 text-center">Chargement…</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
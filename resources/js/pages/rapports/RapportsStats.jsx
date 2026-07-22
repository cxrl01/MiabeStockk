import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

const NOMS_MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function RapportsStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');
  const [exportEnCours, setExportEnCours] = useState(false);

  // Tableau 6 du mémoire : "Générer rapports et statistiques" / "Exporter
  // rapport PDF" = Gérant uniquement.
  const estGerant = user?.role?.nom === 'gerant';

  useEffect(() => {
    if (!estGerant) return;

    api.get('/rapports/statistiques')
      .then(({ data }) => setStats(data))
      .catch(() => setErreur('Impossible de charger les statistiques.'));

    api.get('/rapports/resultat-net')
      .then(({ data }) => setResultat(data))
      .catch(() => {});
  }, [estGerant]);

  const exporterPdf = async () => {
    setExportEnCours(true);
    try {
      const { data } = await api.get('/rapports/export-pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      setErreur('Impossible de générer le rapport PDF.');
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

  const maxCa = Math.max(1, ...(stats?.ca_mensuel?.map((m) => m.total) ?? [1]));
  const maxVentes = Math.max(1, ...(stats?.ventes_mensuel?.map((m) => m.nombre) ?? [1]));

  return (
    <AppShell title="Rapports & Stats">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={exporterPdf}
          disabled={exportEnCours}
          className="inline-flex items-center justify-center rounded-lg border border-indigo-700 text-indigo-700
            text-sm font-medium px-4 py-2.5 hover:bg-indigo-700/5 disabled:opacity-50"
        >
          {exportEnCours ? 'Génération…' : 'Exporter en PDF'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">CA ce mois</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats ? formatMontant(stats.ca_mois) : '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Ventes totales (année)</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats?.ventes_totales_annee ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Nouveaux clients (mois)</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats?.nouveaux_clients_mois ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Produits vendus (mois)</p>
          <p className="font-mono text-xl font-semibold text-ink900">{stats?.produits_vendus_mois ?? '—'}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <h2 className="font-display font-semibold text-ink900 mb-1">Chiffre d'affaires mensuel</h2>
          <p className="text-xs text-ink900/40 mb-4">Depuis janvier {new Date().getFullYear()}</p>
          <div className="flex gap-2 h-40">
            {(stats?.ca_mensuel ?? []).map((m) => (
              <div key={m.mois} className="flex-1 flex flex-col justify-end items-center gap-1 h-full">
                <div
                  className="w-full bg-indigo-700/15 rounded-t"
                  style={{ height: `${Math.max(4, (m.total / maxCa) * 100)}%` }}
                  title={formatMontant(m.total)}
                />
                <span className="text-[10px] text-ink900/40 shrink-0">{NOMS_MOIS[m.mois - 1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <h2 className="font-display font-semibold text-ink900 mb-1">Nombre de ventes</h2>
          <p className="text-xs text-ink900/40 mb-4">Depuis janvier {new Date().getFullYear()}</p>
          <div className="flex gap-2 h-40">
            {(stats?.ventes_mensuel ?? []).map((m) => (
              <div key={m.mois} className="flex-1 flex flex-col justify-end items-center gap-1 h-full">
                <div
                  className="w-full bg-success/15 rounded-t"
                  style={{ height: `${Math.max(4, (m.nombre / maxVentes) * 100)}%` }}
                  title={`${m.nombre} ventes`}
                />
                <span className="text-[10px] text-ink900/40 shrink-0">{NOMS_MOIS[m.mois - 1]}</span>
              </div>
            ))}
          </div>
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
          <h2 className="font-display font-semibold text-ink900 mb-4">Résultat net (mois en cours)</h2>
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
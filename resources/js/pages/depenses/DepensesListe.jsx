import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import api from '../../services/api';
import { formatMontant, formatDate } from '../../lib/format';

export default function DepensesListe() {
  const { user } = useAuth();
  const { boutiqueActiveId } = useBoutiqueActive();
  const [depenses, setDepenses] = useState(null);
  const [tresorerie, setTresorerie] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  // Tableau 6 du mémoire : "Enregistrer dépense, Consulter trésorerie" =
  // Gérant + Gestionnaire uniquement.
  const peutGererDepenses = ['gerant', 'gestionnaire'].includes(user?.role?.nom);

  const charger = () => {
    api.get('/depenses', { params: { per_page: 100 } })
      .then(({ data }) => setDepenses(data.data))
      .catch(() => setErreur('Impossible de charger les dépenses.'));

    api.get('/depenses/tresorerie')
      .then(({ data }) => setTresorerie(data))
      .catch(() => {});
  };

  // Recharge quand la boutique active change (sélecteur multi-points-de-vente).
  useEffect(charger, [boutiqueActiveId]);

  const depensesFiltrees = (depenses || []).filter((d) =>
    d.libelle.toLowerCase().includes(recherche.toLowerCase())
  );

  const supprimer = async (depense) => {
    if (!window.confirm(`Supprimer "${depense.libelle}" ?`)) return;
    try {
      await api.delete(`/depenses/${depense.id}`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  if (!peutGererDepenses) {
    return (
      <AppShell title="Dépenses & Trésorerie">
        <p className="text-sm text-ink900/50 bg-ink900/[0.03] rounded-lg px-4 py-3">
          Cette page est réservée au Gérant et au Gestionnaire.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dépenses & Trésorerie">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher dépense..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />
        <Link
          to="/depenses/nouvelle"
          className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
            text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
        >
          + Ajouter dépense
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total dépenses (mois en cours)</p>
          <p className="font-mono text-2xl font-semibold text-ink900">
            {tresorerie ? formatMontant(tresorerie.total_depenses) : '—'}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Nombre d'opérations</p>
          <p className="font-mono text-2xl font-semibold text-ink900">
            {tresorerie ? tresorerie.nombre_operations : '—'}
          </p>
        </div>
      </div>

      {tresorerie?.repartition_categorie?.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-ink900/70 mb-3">Répartition par catégorie</p>
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tresorerie.repartition_categorie.map((c) => (
              <div key={c.categorie} className="bg-surface rounded-xl border border-ink900/10 p-4">
                <p className="text-xs text-ink900/40 mb-1">{c.categorie}</p>
                <p className="font-mono text-lg font-semibold text-ink900">{formatMontant(c.total)}</p>
                <p className="text-xs text-ink900/35">{c.nombre} opération{c.nombre > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Libellé</th>
              <th className="px-5 py-3 font-medium">Catégorie</th>
              <th className="px-5 py-3 font-medium text-right">Montant</th>
              <th className="px-5 py-3 font-medium">Enregistré par</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {depensesFiltrees.map((d) => (
              <tr key={d.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                <td className="px-5 py-3.5 text-ink900/60">{formatDate(d.date_depense)}</td>
                <td className="px-5 py-3.5 text-ink900 font-medium">{d.libelle}</td>
                <td className="px-5 py-3.5 text-ink900/60">
                  {d.categorie ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-ink900/5 text-ink900/70">
                      {d.categorie}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-medium text-danger">
                  −{formatMontant(d.montant)}
                </td>
                <td className="px-5 py-3.5 text-ink900/50">{d.user?.nom}</td>
                <td className="px-5 py-3.5 text-right space-x-3 whitespace-nowrap">
                  <Link to={`/depenses/${d.id}/modifier`} className="text-indigo-700 hover:underline font-medium">
                    Modifier
                  </Link>
                  <button onClick={() => supprimer(d)} className="text-danger hover:underline font-medium">
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}

            {depenses && depensesFiltrees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink900/40">Aucune dépense.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
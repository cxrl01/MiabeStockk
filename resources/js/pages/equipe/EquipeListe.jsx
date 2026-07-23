import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import api from '../../services/api';

const LABELS_ROLE = {
  gestionnaire: 'Gestionnaire',
  commercial: 'Commercial',
};

export default function EquipeListe() {
  const { user } = useAuth();
  const { boutiqueActiveId } = useBoutiqueActive();
  const [employes, setEmployes] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  // Tableau 6 du mémoire : "Ajouter/Modifier/Supprimer compte employé" = Gérant
  // uniquement. Cette page n'est même pas censée être accessible à un autre rôle
  // (route protégée côté AppRoutes.jsx), mais on masque aussi les actions ici en
  // défense supplémentaire.
  const estGerant = user?.role?.nom === 'gerant';

  const charger = () => {
    api.get('/equipe')
      .then(({ data }) => setEmployes(data))
      .catch(() => setErreur("Impossible de charger l'équipe."));
  };

  // Recharge la liste quand la boutique active change (sélecteur multi-points-
  // de-vente) : le backend filtre desormais sur cette boutique uniquement.
  useEffect(charger, [boutiqueActiveId]);

  const employesFiltres = (employes || []).filter((e) =>
    `${e.nom} ${e.prenom ?? ''}`.toLowerCase().includes(recherche.toLowerCase())
  );

  const supprimer = async (employe) => {
    if (!window.confirm(`Supprimer "${employe.nom}" ?`)) return;
    try {
      await api.delete(`/equipe/${employe.id}`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  if (!estGerant) {
    return (
      <AppShell title="Équipe">
        <p className="text-sm text-ink900/50 bg-ink900/[0.03] rounded-lg px-4 py-3">
          Cette page est réservée au Gérant.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Équipe">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher un membre..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />
        <Link
          to="/equipe/nouveau"
          className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
            text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
        >
          + Ajouter un membre
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total membres</p>
          <p className="font-mono text-2xl font-semibold text-ink900">{employes?.length ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Actifs</p>
          <p className="font-mono text-2xl font-semibold text-success">
            {(employes || []).filter((e) => e.actif).length}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Membre</th>
              <th className="px-5 py-3 font-medium">Rôle</th>
              <th className="px-5 py-3 font-medium">Poste</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employesFiltres.map((e) => (
              <tr key={e.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-full bg-indigo-700/10 text-indigo-700 text-sm font-medium flex items-center justify-center shrink-0">
                      {e.nom.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-ink900 font-medium">{e.nom} {e.prenom}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink900/60">{LABELS_ROLE[e.role?.nom] ?? e.role?.nom}</td>
                <td className="px-5 py-3.5 text-ink900/60">{e.poste || '—'}</td>
                <td className="px-5 py-3.5 text-ink900/60">
                  <p>{e.email}</p>
                  {e.telephone && <p className="text-xs text-ink900/40">{e.telephone}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    e.actif ? 'bg-success/10 text-success' : 'bg-ink900/8 text-ink900/50'
                  }`}>
                    {e.actif ? 'Actif' : 'Suspendu'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right space-x-3 whitespace-nowrap">
                  <Link to={`/equipe/${e.id}/modifier`} className="text-indigo-700 hover:underline font-medium">
                    Modifier
                  </Link>
                  <button onClick={() => supprimer(e)} className="text-danger hover:underline font-medium">
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}

            {employes && employesFiltres.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink900/40">Aucun membre.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
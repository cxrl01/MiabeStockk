import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

export default function FournisseursListe() {
  const { user } = useAuth();
  const { boutiqueActiveId } = useBoutiqueActive();
  const [fournisseurs, setFournisseurs] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  // Tableau 6 du mémoire : "Créer fournisseur, Enregistrer livraison, Gérer dette
  // fournisseur" = Gérant + Gestionnaire uniquement.
  const peutGererFournisseurs = ['gerant', 'gestionnaire'].includes(user?.role?.nom);

  const charger = () => {
    api.get('/fournisseurs', { params: { per_page: 100 } })
      .then(({ data }) => setFournisseurs(data.data))
      .catch(() => setErreur("Impossible de charger les fournisseurs."));
  };

  // Recharge quand la boutique active change (sélecteur multi-points-de-vente).
  useEffect(charger, [boutiqueActiveId]);

  const fournisseursFiltres = (fournisseurs || []).filter((f) =>
    f.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalDettes = (fournisseurs || []).reduce((s, f) => s + Number(f.dette), 0);
  const fournisseursAvecDette = (fournisseurs || []).filter((f) => Number(f.dette) > 0).length;

  const supprimer = async (fournisseur) => {
    if (!window.confirm(`Supprimer "${fournisseur.nom}" ?`)) return;
    try {
      await api.delete(`/fournisseurs/${fournisseur.id}`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  return (
    <AppShell title="Fournisseurs">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher fournisseur..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />
        {peutGererFournisseurs && (
          <>
            <Link
              to="/fournisseurs/livraison-nouvelle"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-700 text-indigo-700
                text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap hover:bg-indigo-700/5"
            >
              + Nouvelle livraison
            </Link>
            <Link
              to="/fournisseurs/nouveau"
              className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
                text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
            >
              + Nouveau fournisseur
            </Link>
          </>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total fournisseurs</p>
          <p className="font-mono text-2xl font-semibold text-ink900">{fournisseurs?.length ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Avec dette</p>
          <p className="font-mono text-2xl font-semibold text-danger">{fournisseursAvecDette}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total dû</p>
          <p className="font-mono text-2xl font-semibold text-danger">{formatMontant(totalDettes)}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Fournisseur</th>
              <th className="px-5 py-3 font-medium">Téléphone</th>
              <th className="px-5 py-3 font-medium">Adresse</th>
              <th className="px-5 py-3 font-medium">Conditions</th>
              <th className="px-5 py-3 font-medium text-right">Solde dû</th>
              {peutGererFournisseurs && <th className="px-5 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {fournisseursFiltres.map((f) => {
              const aDette = Number(f.dette) > 0;
              return (
                <tr key={f.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                  <td className="px-5 py-3.5 text-ink900 font-medium">{f.nom}</td>
                  <td className="px-5 py-3.5 text-ink900/60">{f.telephone || '—'}</td>
                  <td className="px-5 py-3.5 text-ink900/60">{f.adresse || '—'}</td>
                  <td className="px-5 py-3.5 text-ink900/60">{f.conditions_paiement || '—'}</td>
                  <td className={`px-5 py-3.5 text-right font-mono ${aDette ? 'text-danger font-semibold' : 'text-ink900/40'}`}>
                    {formatMontant(f.dette)}
                  </td>
                  {peutGererFournisseurs && (
                    <td className="px-5 py-3.5 text-right space-x-3 whitespace-nowrap">
                      <Link to={`/fournisseurs/${f.id}/modifier`} className="text-indigo-700 hover:underline font-medium">
                        Modifier
                      </Link>
                      <button onClick={() => supprimer(f)} className="text-danger hover:underline font-medium">
                        Suppr.
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {fournisseurs && fournisseursFiltres.length === 0 && (
              <tr>
                <td colSpan={peutGererFournisseurs ? 6 : 5} className="px-5 py-10 text-center text-ink900/40">
                  Aucun fournisseur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
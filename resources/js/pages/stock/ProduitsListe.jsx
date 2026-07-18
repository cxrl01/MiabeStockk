import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

export default function ProduitsListe() {
  const { user } = useAuth();
  const [produits, setProduits] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  // Tableau 6 du mémoire : "Ajouter/Modifier/Supprimer produit" = Gérant + Gestionnaire
  // uniquement. Le Commercial a "Consulter stock" (lecture seule).
  const peutGererStock = ['gerant', 'gestionnaire'].includes(user?.role?.nom);

  const charger = () => {
    api.get('/produits', { params: { per_page: 100 } })
      .then(({ data }) => setProduits(data.data))
      .catch(() => setErreur("Impossible de charger les produits."));
  };

  useEffect(charger, []);

  const produitsFiltres = (produits || []).filter((p) => {
    const terme = recherche.toLowerCase();
    return p.nom.toLowerCase().includes(terme) || (p.reference ?? '').toLowerCase().includes(terme);
  });

  const alertes = (produits || []).filter((p) => p.quantite_stock <= p.seuil_alerte).length;
  const valeurStock = (produits || []).reduce((s, p) => s + p.quantite_stock * Number(p.prix_achat), 0);

  const supprimer = async (produit) => {
    if (!window.confirm(`Supprimer "${produit.nom}" ?`)) return;
    try {
      await api.delete(`/produits/${produit.id}`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  return (
    <AppShell title="Stock">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher produit, référence..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />
        {peutGererStock && (
          <Link
            to="/stock/nouveau"
            className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
              text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
          >
            + Ajouter produit
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total produits</p>
          <p className="font-mono text-2xl font-semibold text-ink900">{produits?.length ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Alertes stock</p>
          <p className="font-mono text-2xl font-semibold text-danger">{alertes}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Valeur stock estimée</p>
          <p className="font-mono text-2xl font-semibold text-success">{formatMontant(valeurStock)}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Produit</th>
              <th className="px-5 py-3 font-medium">Catégorie</th>
              <th className="px-5 py-3 font-medium text-right">Qté</th>
              <th className="px-5 py-3 font-medium text-right">Seuil</th>
              <th className="px-5 py-3 font-medium text-right">Prix vente</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              {peutGererStock && <th className="px-5 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {produitsFiltres.map((p) => {
              const enAlerte = p.quantite_stock <= p.seuil_alerte;
              return (
                <tr key={p.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                  <td className="px-5 py-3.5">
                    <p className="text-ink900 font-medium">{p.nom}</p>
                    {p.reference && <p className="text-xs text-ink900/40 font-mono">{p.reference}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-ink900/60">{p.categorie?.nom ?? '—'}</td>
                  <td className={`px-5 py-3.5 text-right font-mono ${enAlerte ? 'text-danger font-semibold' : 'text-ink900'}`}>
                    {p.quantite_stock}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink900/40">{p.seuil_alerte}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink900">{formatMontant(p.prix_vente)}</td>
                  <td className="px-5 py-3.5">
                    {enAlerte ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-danger/10 text-danger">
                        Bas
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-success/10 text-success">
                        OK
                      </span>
                    )}
                  </td>
                  {peutGererStock && (
                    <td className="px-5 py-3.5 text-right space-x-3">
                      <Link to={`/stock/${p.id}/modifier`} className="text-indigo-700 hover:underline font-medium">
                        Modifier
                      </Link>
                      <button onClick={() => supprimer(p)} className="text-danger hover:underline font-medium">
                        Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {produits && produitsFiltres.length === 0 && (
              <tr>
                <td colSpan={peutGererStock ? 7 : 6} className="px-5 py-10 text-center text-ink900/40">Aucun produit.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
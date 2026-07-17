import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import api, { extraireErreursValidation } from '../../services/api';
import { formatMontant } from '../../lib/format';

export default function NouvelleVente() {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [lignes, setLignes] = useState([]); // [{ produit_id, quantite }]
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    api.get('/produits', { params: { per_page: 100 } })
      .then(({ data }) => setProduits(data.data))
      .catch(() => setErreur("Impossible de charger le catalogue produits."));
  }, []);

  const produitParId = (id) => produits.find((p) => p.id === Number(id));

  const ajouterLigne = () => {
    if (!produits.length) return;
    setLignes((l) => [...l, { produit_id: produits[0].id, quantite: 1 }]);
  };

  const majLigne = (index, champ, valeur) => {
    setLignes((l) => l.map((ligne, i) => (i === index ? { ...ligne, [champ]: valeur } : ligne)));
  };

  const retirerLigne = (index) => {
    setLignes((l) => l.filter((_, i) => i !== index));
  };

  const totalTtc = lignes.reduce((somme, ligne) => {
    const produit = produitParId(ligne.produit_id);
    if (!produit) return somme;
    const ht = produit.prix_vente * ligne.quantite;
    return somme + ht * (1 + Number(produit.taux_tva) / 100);
  }, 0);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');

    if (lignes.length === 0) {
      setErreur('Ajoutez au moins un produit à la vente.');
      return;
    }

    setChargement(true);
    try {
      const { data } = await api.post('/ventes', {
        lignes: lignes.map((l) => ({ produit_id: Number(l.produit_id), quantite: Number(l.quantite) })),
      });
      navigate(`/ventes/${data.id}`);
    } catch (error) {
      const erreurs = extraireErreursValidation(error);
      setErreur(erreurs.lignes || error?.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <AppShell title="Nouvelle vente">
      <form onSubmit={soumettre} className="max-w-2xl">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink900">Articles</h2>
            <button
              type="button"
              onClick={ajouterLigne}
              className="text-sm font-medium text-indigo-700 hover:underline"
            >
              + Ajouter un produit
            </button>
          </div>

          {lignes.length === 0 && (
            <p className="text-sm text-ink900/40 py-4 text-center">Aucun article ajouté.</p>
          )}

          <div className="space-y-3">
            {lignes.map((ligne, index) => {
              const produit = produitParId(ligne.produit_id);
              return (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={ligne.produit_id}
                    onChange={(e) => majLigne(index, 'produit_id', e.target.value)}
                    className="flex-1 rounded-lg border border-ink900/15 bg-white px-3 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  >
                    {produits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} — {formatMontant(p.prix_vente)} (stock : {p.quantite_stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max={produit?.quantite_stock}
                    value={ligne.quantite}
                    onChange={(e) => majLigne(index, 'quantite', e.target.value)}
                    className="w-20 rounded-lg border border-ink900/15 bg-white px-3 py-2.5 text-sm text-center
                      focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  />
                  <span className="w-24 text-right font-mono text-sm text-ink900/70">
                    {produit ? formatMontant(produit.prix_vente * ligne.quantite * (1 + produit.taux_tva / 100)) : '—'}
                  </span>
                  <button
                    type="button"
                    onClick={() => retirerLigne(index)}
                    className="text-danger/70 hover:text-danger text-sm"
                    aria-label="Retirer"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-5 mb-6 flex items-center justify-between">
          <span className="font-display font-semibold text-ink900">Total TTC</span>
          <span className="font-mono text-2xl font-semibold text-indigo-700">{formatMontant(totalTtc)}</span>
        </div>

        {erreur && (
          <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">
            {erreur}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="boutique" loading={chargement}>
            Valider la vente
          </Button>
          <button
            type="button"
            onClick={() => navigate('/ventes')}
            className="text-sm font-medium text-ink900/60 hover:text-ink900 px-4"
          >
            Annuler
          </button>
        </div>
      </form>
    </AppShell>
  );
}
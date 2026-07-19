import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import api, { extraireErreursValidation } from '../../services/api';
import { formatMontant } from '../../lib/format';

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
];

/**
 * Contrairement a une vente (prix de vente fixe issu du produit), le prix
 * d'une livraison varie a chaque reception (negocie avec le fournisseur a
 * cette occasion precise). Chaque ligne a donc un prix_unitaire editable,
 * pre-rempli avec produit.prix_achat par defaut mais modifiable.
 */
export default function NouvelleLivraison() {
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [fournisseurId, setFournisseurId] = useState('');
  const [lignes, setLignes] = useState([]); // [{ produit_id, quantite, prix_unitaire }]
  const [modePaiement, setModePaiement] = useState('especes');
  const [payerTotalite, setPayerTotalite] = useState(false);
  const [montantPaye, setMontantPaye] = useState('0');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [modalFournisseurOuvert, setModalFournisseurOuvert] = useState(false);

  useEffect(() => {
    api.get('/produits', { params: { per_page: 200 } })
      .then(({ data }) => setProduits(data.data))
      .catch(() => setErreur('Impossible de charger le catalogue produits.'));

    api.get('/fournisseurs', { params: { per_page: 200 } })
      .then(({ data }) => setFournisseurs(data.data ?? data))
      .catch(() => {});
  }, []);

  const produitParId = (id) => produits.find((p) => p.id === Number(id));

  const total = useMemo(
    () => lignes.reduce((s, l) => s + Number(l.prix_unitaire || 0) * Number(l.quantite || 0), 0),
    [lignes]
  );

  useEffect(() => {
    if (payerTotalite) setMontantPaye(String(total));
  }, [total, payerTotalite]);

  const ajouterLigne = () => {
    if (!produits.length) return;
    const premier = produits[0];
    setLignes((l) => [...l, { produit_id: premier.id, quantite: 1, prix_unitaire: premier.prix_achat }]);
  };

  const majLigne = (index, champ, valeur) => {
    setLignes((l) => l.map((ligne, i) => {
      if (i !== index) return ligne;
      const maj = { ...ligne, [champ]: valeur };
      // Repropose le prix d'achat courant du produit quand on change de produit,
      // reste modifiable ensuite.
      if (champ === 'produit_id') {
        const p = produitParId(valeur);
        maj.prix_unitaire = p?.prix_achat ?? 0;
      }
      return maj;
    }));
  };

  const retirerLigne = (index) => {
    setLignes((l) => l.filter((_, i) => i !== index));
  };

  async function creerFournisseurRapide(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      nom: form.get('nom')?.toString().trim(),
      telephone: form.get('telephone')?.toString().trim() || null,
      adresse: form.get('adresse')?.toString().trim() || null,
    };
    if (!payload.nom) return;

    try {
      const { data } = await api.post('/fournisseurs', payload);
      setFournisseurs((f) => [...f, data]);
      setFournisseurId(String(data.id));
      setModalFournisseurOuvert(false);
      e.target.reset();
    } catch (error) {
      alert(error?.response?.data?.message || 'Erreur lors de la création du fournisseur.');
    }
  }

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');

    if (!fournisseurId) {
      setErreur('Sélectionnez un fournisseur.');
      return;
    }
    if (lignes.length === 0) {
      setErreur('Ajoutez au moins un produit à la livraison.');
      return;
    }

    setChargement(true);
    try {
      const { data } = await api.post('/livraisons', {
        fournisseur_id: Number(fournisseurId),
        mode_paiement: modePaiement,
        montant_paye: Number(montantPaye) || 0,
        lignes: lignes.map((l) => ({
          produit_id: Number(l.produit_id),
          quantite: Number(l.quantite),
          prix_unitaire: Number(l.prix_unitaire),
        })),
      });
      navigate(`/fournisseurs`);
    } catch (error) {
      const erreurs = extraireErreursValidation(error);
      setErreur(erreurs.lignes || error?.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <AppShell title="Nouvelle livraison">
      <form onSubmit={soumettre} className="max-w-2xl space-y-6">
        {erreur && (
          <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
            {erreur}
          </p>
        )}

        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <label className="block text-sm font-medium text-ink900/80 mb-1.5">Fournisseur</label>
          <div className="flex gap-2">
            <select
              value={fournisseurId}
              onChange={(e) => setFournisseurId(e.target.value)}
              className="flex-1 rounded-lg border border-ink900/15 bg-white px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              <option value="">Sélectionner un fournisseur</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setModalFournisseurOuvert(true)}
              title="Créer un nouveau fournisseur"
              className="shrink-0 rounded-lg border border-ink900/15 px-3 text-ink900/60 hover:bg-ink900/5"
            >
              +
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink900">Produits reçus</h2>
            <button
              type="button"
              onClick={ajouterLigne}
              className="text-sm font-medium text-indigo-700 hover:underline"
            >
              + Ajouter un produit
            </button>
          </div>

          {lignes.length === 0 && (
            <p className="text-sm text-ink900/40 py-4 text-center">Aucun produit ajouté.</p>
          )}

          <div className="space-y-3">
            {lignes.map((ligne, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={ligne.produit_id}
                  onChange={(e) => majLigne(index, 'produit_id', e.target.value)}
                  className="flex-1 rounded-lg border border-ink900/15 bg-white px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                >
                  {produits.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={ligne.quantite}
                  onChange={(e) => majLigne(index, 'quantite', e.target.value)}
                  placeholder="Qté"
                  className="w-20 rounded-lg border border-ink900/15 bg-white px-2 py-2.5 text-sm text-center
                    focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ligne.prix_unitaire}
                  onChange={(e) => majLigne(index, 'prix_unitaire', e.target.value)}
                  placeholder="Prix achat"
                  className="w-28 rounded-lg border border-ink900/15 bg-white px-2 py-2.5 text-sm text-right
                    focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
                <span className="w-24 text-right font-mono text-sm text-ink900/70 shrink-0">
                  {formatMontant(Number(ligne.prix_unitaire || 0) * Number(ligne.quantite || 0))}
                </span>
                <button
                  type="button"
                  onClick={() => retirerLigne(index)}
                  className="text-danger/70 hover:text-danger text-sm shrink-0"
                  aria-label="Retirer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display font-semibold text-ink900">Total</span>
            <span className="font-mono text-2xl font-semibold text-indigo-700">{formatMontant(total)}</span>
          </div>

          <label className="block text-sm font-medium text-ink900/80 mb-1.5">Mode de paiement</label>
          <select
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
            className="w-full rounded-lg border border-ink900/15 bg-white px-3 py-2.5 text-sm mb-4
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          >
            {MODES_PAIEMENT.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-ink900 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={payerTotalite}
              onChange={(e) => setPayerTotalite(e.target.checked)}
              className="h-4 w-4"
            />
            Payer la totalité maintenant
          </label>

          <label className="block text-sm font-medium text-ink900/80 mb-1.5">Montant payé au fournisseur</label>
          <input
            type="number"
            min="0"
            step="1"
            value={montantPaye}
            readOnly={payerTotalite}
            onChange={(e) => setMontantPaye(e.target.value)}
            className="w-full rounded-lg border border-ink900/15 bg-white px-3.5 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600
              read-only:bg-ink900/[0.03]"
          />
          <p className="text-xs text-ink900/40 mt-1">
            Le solde impayé sera ajouté à la dette de ce fournisseur.
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="boutique" loading={chargement}>
            Enregistrer la livraison
          </Button>
          <button
            type="button"
            onClick={() => navigate('/fournisseurs')}
            className="text-sm font-medium text-ink900/60 hover:text-ink900 px-4"
          >
            Annuler
          </button>
        </div>
      </form>

      {modalFournisseurOuvert && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-ink900 mb-4">Nouveau fournisseur</h3>
            <form onSubmit={creerFournisseurRapide} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Nom</label>
                <input name="nom" required autoFocus className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Téléphone (optionnel)</label>
                <input name="telephone" className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Adresse (optionnel)</label>
                <input name="adresse" className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="boutique">Créer</Button>
                <button
                  type="button"
                  onClick={() => setModalFournisseurOuvert(false)}
                  className="text-sm font-medium text-ink900/60 hover:text-ink900 px-3"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
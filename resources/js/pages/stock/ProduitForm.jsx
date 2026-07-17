import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import api, { extraireErreursValidation } from '../../services/api';

const CHAMPS_INITIAUX = {
  categorie_id: '',
  nom: '',
  reference: '',
  prix_achat: '',
  prix_vente: '',
  taux_tva: '18',
  quantite_stock: '0',
  seuil_alerte: '5',
};

export default function ProduitForm() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data));

    if (modeEdition) {
      api.get(`/produits/${id}`).then(({ data }) => {
        setForm({
          categorie_id: data.categorie_id ?? '',
          nom: data.nom,
          reference: data.reference ?? '',
          prix_achat: data.prix_achat,
          prix_vente: data.prix_vente,
          taux_tva: data.taux_tva,
          quantite_stock: data.quantite_stock,
          seuil_alerte: data.seuil_alerte,
        });
      });
    }
  }, [id]);

  const majChamp = (champ) => (e) => {
    setForm((f) => ({ ...f, [champ]: e.target.value }));
    setErreurs((err) => ({ ...err, [champ]: undefined }));
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurGenerale('');
    setChargement(true);

    // En modification, quantite_stock n'est volontairement pas envoyée :
    // le backend ne l'accepte pas via update() (doit passer par un mouvement tracé).
    const payload = modeEdition
      ? { ...form, quantite_stock: undefined }
      : form;

    try {
      if (modeEdition) {
        await api.put(`/produits/${id}`, payload);
      } else {
        await api.post('/produits', payload);
      }
      navigate('/stock');
    } catch (error) {
      if (error?.response?.status === 422) {
        setErreurs(extraireErreursValidation(error));
      } else if (error?.response?.status === 403) {
        setErreurGenerale("Vous n'avez pas la permission de faire cette action.");
      } else {
        setErreurGenerale('Une erreur est survenue.');
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <AppShell title={modeEdition ? 'Modifier le produit' : 'Ajouter un produit'}>
      <form onSubmit={soumettre} className="max-w-lg space-y-5">
        <TextField
          id="nom"
          label="Nom du produit"
          value={form.nom}
          onChange={majChamp('nom')}
          error={erreurs.nom}
          required
        />

        <div>
          <label htmlFor="categorie_id" className="block text-sm font-medium text-ink900/80 mb-1.5">
            Catégorie
          </label>
          <select
            id="categorie_id"
            value={form.categorie_id}
            onChange={majChamp('categorie_id')}
            className="w-full rounded-lg border border-ink900/15 bg-white px-3.5 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          >
            <option value="">Aucune</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        <TextField
          id="reference"
          label="Référence (optionnel)"
          value={form.reference}
          onChange={majChamp('reference')}
          error={erreurs.reference}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="prix_achat"
            type="number"
            step="0.01"
            label="Prix d'achat"
            value={form.prix_achat}
            onChange={majChamp('prix_achat')}
            error={erreurs.prix_achat}
            required
          />
          <TextField
            id="prix_vente"
            type="number"
            step="0.01"
            label="Prix de vente"
            value={form.prix_vente}
            onChange={majChamp('prix_vente')}
            error={erreurs.prix_vente}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="taux_tva"
            type="number"
            step="0.01"
            label="Taux TVA (%)"
            value={form.taux_tva}
            onChange={majChamp('taux_tva')}
            error={erreurs.taux_tva}
          />
          <TextField
            id="seuil_alerte"
            type="number"
            label="Seuil d'alerte"
            value={form.seuil_alerte}
            onChange={majChamp('seuil_alerte')}
            error={erreurs.seuil_alerte}
          />
        </div>

        {!modeEdition && (
          <TextField
            id="quantite_stock"
            type="number"
            label="Quantité initiale en stock"
            value={form.quantite_stock}
            onChange={majChamp('quantite_stock')}
            error={erreurs.quantite_stock}
            hint="Après création, toute variation devra passer par un ajustement tracé."
          />
        )}

        {erreurGenerale && (
          <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
            {erreurGenerale}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="boutique" loading={chargement}>
            {modeEdition ? 'Enregistrer' : 'Créer le produit'}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/stock')}
            className="text-sm font-medium text-ink900/60 hover:text-ink900 px-4"
          >
            Annuler
          </button>
        </div>
      </form>
    </AppShell>
  );
}
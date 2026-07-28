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

  // Création rapide de catégorie depuis ce formulaire.
  const [modaleCategorieOuverte, setModaleCategorieOuverte] = useState(false);
  const [nouvelleCategorieNom, setNouvelleCategorieNom] = useState('');
  const [erreurNouvelleCategorie, setErreurNouvelleCategorie] = useState('');
  const [creationCategorieEnCours, setCreationCategorieEnCours] = useState(false);

  const chargerCategories = () => {
    api.get('/categories').then(({ data }) => setCategories(data));
  };

  useEffect(() => {
    chargerCategories();

    if (modeEdition) {
      api.get(`/produits/${id}`).then(({ data }) => {
        setForm({
          categorie_id: data.categorie_id ?? '',
          nom: data.nom,
          reference: data.reference ?? '',
          prix_achat: data.prix_achat,
          prix_vente: data.prix_vente,
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

  const ouvrirModaleCategorie = () => {
    setNouvelleCategorieNom('');
    setErreurNouvelleCategorie('');
    setModaleCategorieOuverte(true);
  };

  const creerCategorie = async (e) => {
    e.preventDefault();
    setCreationCategorieEnCours(true);
    setErreurNouvelleCategorie('');

    try {
      const { data } = await api.post('/categories', { nom: nouvelleCategorieNom });
      setCategories((liste) => [...liste, data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setForm((f) => ({ ...f, categorie_id: data.id }));
      setErreurs((err) => ({ ...err, categorie_id: undefined }));
      setModaleCategorieOuverte(false);
    } catch (error) {
      setErreurNouvelleCategorie(error?.response?.data?.message || "Échec de la création de la catégorie.");
    } finally {
      setCreationCategorieEnCours(false);
    }
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
          <div className="flex gap-2">
            <select
              id="categorie_id"
              value={form.categorie_id}
              onChange={majChamp('categorie_id')}
              className="flex-1 rounded-lg border border-ink900/15 bg-white px-3.5 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              <option value="">Aucune</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={ouvrirModaleCategorie}
              title="Créer une nouvelle catégorie"
              className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg border border-ink900/15
                text-ink900/70 hover:bg-ink900/5 transition-colors"
            >
              +
            </button>
          </div>
          {erreurs.categorie_id && (
            <p className="text-sm text-danger mt-1.5">{erreurs.categorie_id}</p>
          )}
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

        {/* Pas de champ TVA ici : la TVA est configurable au niveau de la boutique
            (Administration > Informations de la boutique), pas par produit. */}
        <TextField
          id="seuil_alerte"
          type="number"
          label="Seuil d'alerte"
          value={form.seuil_alerte}
          onChange={majChamp('seuil_alerte')}
          error={erreurs.seuil_alerte}
        />

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

      {modaleCategorieOuverte && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={creerCategorie} className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-ink900 mb-4">Nouvelle catégorie</h3>

            {erreurNouvelleCategorie && (
              <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mb-4">
                {erreurNouvelleCategorie}
              </p>
            )}

            <label htmlFor="nouvelle_categorie_nom" className="block text-sm text-ink900/60 mb-1.5">
              Nom
            </label>
            <input
              id="nouvelle_categorie_nom"
              type="text"
              value={nouvelleCategorieNom}
              onChange={(e) => setNouvelleCategorieNom(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm mb-5
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModaleCategorieOuverte(false)}
                className="flex-1 rounded-lg border border-ink900/15 text-ink900/70 hover:bg-ink900/5
                  text-sm font-medium px-4 py-2.5 transition-colors"
              >
                Annuler
              </button>
              <Button
                type="submit"
                variant="boutique"
                disabled={creationCategorieEnCours}
                className="flex-1 justify-center"
              >
                {creationCategorieEnCours ? 'Création…' : 'Créer'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
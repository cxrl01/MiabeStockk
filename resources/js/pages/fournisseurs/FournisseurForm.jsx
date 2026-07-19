import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import api, { extraireErreursValidation } from '../../services/api';

const CHAMPS_INITIAUX = {
  nom: '',
  telephone: '',
  adresse: '',
  conditions_paiement: '',
};

export default function FournisseurForm() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (modeEdition) {
      api.get(`/fournisseurs/${id}`).then(({ data }) => {
        const f = data.fournisseur ?? data;
        setForm({
          nom: f.nom,
          telephone: f.telephone ?? '',
          adresse: f.adresse ?? '',
          conditions_paiement: f.conditions_paiement ?? '',
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

    try {
      if (modeEdition) {
        await api.put(`/fournisseurs/${id}`, form);
      } else {
        await api.post('/fournisseurs', form);
      }
      navigate('/fournisseurs');
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
    <AppShell title={modeEdition ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}>
      <form onSubmit={soumettre} className="max-w-lg space-y-5">
        <TextField
          id="nom"
          label="Nom du fournisseur"
          value={form.nom}
          onChange={majChamp('nom')}
          error={erreurs.nom}
          required
        />
        <TextField
          id="telephone"
          label="Téléphone (optionnel)"
          value={form.telephone}
          onChange={majChamp('telephone')}
          error={erreurs.telephone}
        />
        <TextField
          id="adresse"
          label="Adresse (optionnel)"
          value={form.adresse}
          onChange={majChamp('adresse')}
          error={erreurs.adresse}
        />
        <TextField
          id="conditions_paiement"
          label="Conditions de paiement (optionnel)"
          placeholder="Ex : 30 jours, Comptant..."
          value={form.conditions_paiement}
          onChange={majChamp('conditions_paiement')}
          error={erreurs.conditions_paiement}
        />

        {erreurGenerale && (
          <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
            {erreurGenerale}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="boutique" loading={chargement}>
            {modeEdition ? 'Enregistrer' : 'Créer le fournisseur'}
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
    </AppShell>
  );
}
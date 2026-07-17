import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import api, { extraireErreursValidation } from '../../services/api';

const CHAMPS_INITIAUX = { nom: '', telephone: '', adresse: '' };

export default function ClientForm() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (modeEdition) {
      api.get(`/clients/${id}`).then(({ data }) => {
        setForm({ nom: data.nom, telephone: data.telephone ?? '', adresse: data.adresse ?? '' });
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
        await api.put(`/clients/${id}`, form);
      } else {
        await api.post('/clients', form);
      }
      navigate('/clients');
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
    <AppShell title={modeEdition ? 'Modifier le client' : 'Nouveau client'}>
      <form onSubmit={soumettre} className="max-w-lg space-y-5">
        <TextField
          id="nom"
          label="Nom complet"
          value={form.nom}
          onChange={majChamp('nom')}
          error={erreurs.nom}
          required
        />
        <TextField
          id="telephone"
          type="tel"
          label="Téléphone"
          value={form.telephone}
          onChange={majChamp('telephone')}
          error={erreurs.telephone}
        />
        <TextField
          id="adresse"
          label="Adresse"
          value={form.adresse}
          onChange={majChamp('adresse')}
          error={erreurs.adresse}
        />

        {erreurGenerale && (
          <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
            {erreurGenerale}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="boutique" loading={chargement}>
            {modeEdition ? 'Enregistrer' : 'Créer le client'}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="text-sm font-medium text-ink900/60 hover:text-ink900 px-4"
          >
            Annuler
          </button>
        </div>
      </form>
    </AppShell>
  );
}
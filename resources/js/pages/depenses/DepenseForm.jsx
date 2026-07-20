import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import api, { extraireErreursValidation } from '../../services/api';

function dateAujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

const CHAMPS_INITIAUX = {
  libelle: '',
  montant: '',
  categorie: '',
  date_depense: dateAujourdhui(),
};

export default function DepenseForm() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (modeEdition) {
      api.get(`/depenses/${id}`).then(({ data }) => {
        setForm({
          libelle: data.libelle,
          montant: data.montant,
          categorie: data.categorie ?? '',
          date_depense: data.date_depense,
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
        await api.put(`/depenses/${id}`, form);
      } else {
        await api.post('/depenses', form);
      }
      navigate('/depenses');
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
    <AppShell title={modeEdition ? 'Modifier la dépense' : 'Ajouter une dépense'}>
      <form onSubmit={soumettre} className="max-w-lg space-y-5">
        <TextField
          id="libelle"
          label="Libellé"
          placeholder="Ex : Loyer boutique — Juillet"
          value={form.libelle}
          onChange={majChamp('libelle')}
          error={erreurs.libelle}
          required
        />

        <TextField
          id="montant"
          type="number"
          step="0.01"
          label="Montant"
          value={form.montant}
          onChange={majChamp('montant')}
          error={erreurs.montant}
          required
        />

        <TextField
          id="categorie"
          label="Catégorie (optionnel)"
          placeholder="Ex : Loyer, Salaires, Transport..."
        //   hint="Ne pas utiliser pour les achats de marchandises : ceux-ci passent par le module Fournisseurs (livraisons), déjà comptés séparément."
          value={form.categorie}
          onChange={majChamp('categorie')}
          error={erreurs.categorie}
        />

        <TextField
          id="date_depense"
          type="date"
          label="Date de la dépense"
          value={form.date_depense}
          onChange={majChamp('date_depense')}
          error={erreurs.date_depense}
          required
        />

        {erreurGenerale && (
          <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
            {erreurGenerale}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="boutique" loading={chargement}>
            {modeEdition ? 'Enregistrer' : 'Créer la dépense'}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/depenses')}
            className="text-sm font-medium text-ink900/60 hover:text-ink900 px-4"
          >
            Annuler
          </button>
        </div>
      </form>
    </AppShell>
  );
}
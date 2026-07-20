import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import api, { extraireErreursValidation } from '../../services/api';

const CHAMPS_INITIAUX = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  password: '',
  poste: '',
  role: 'commercial',
  actif: true,
};

export default function EmployeForm() {
  const { id } = useParams();
  const modeEdition = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (modeEdition) {
      api.get(`/equipe/${id}`).then(({ data }) => {
        setForm({
          nom: data.nom,
          prenom: data.prenom ?? '',
          email: data.email,
          telephone: data.telephone ?? '',
          password: '',
          poste: data.poste ?? '',
          role: data.role?.nom ?? 'commercial',
          actif: data.actif,
        });
      });
    }
  }, [id]);

  const majChamp = (champ) => (e) => {
    const valeur = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [champ]: valeur }));
    setErreurs((err) => ({ ...err, [champ]: undefined }));
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurGenerale('');
    setChargement(true);

    // En modification, ne pas envoyer un mot de passe vide (le backend le
    // laisse alors inchangé) — évite d'écraser le mot de passe existant.
    const payload = modeEdition && !form.password
      ? { ...form, password: undefined }
      : form;

    try {
      if (modeEdition) {
        await api.put(`/equipe/${id}`, payload);
      } else {
        await api.post('/equipe', payload);
      }
      navigate('/equipe');
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
    <AppShell title={modeEdition ? "Modifier l'employé" : 'Ajouter un membre'}>
      <form onSubmit={soumettre} className="max-w-lg space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <TextField id="nom" label="Nom" value={form.nom} onChange={majChamp('nom')} error={erreurs.nom} required />
          <TextField id="prenom" label="Prénom (optionnel)" value={form.prenom} onChange={majChamp('prenom')} error={erreurs.prenom} />
        </div>

        <TextField id="email" type="email" label="Adresse e-mail" value={form.email} onChange={majChamp('email')} error={erreurs.email} required />
        <TextField id="telephone" label="Téléphone (optionnel)" value={form.telephone} onChange={majChamp('telephone')} error={erreurs.telephone} />

        <TextField
          id="password"
          type="password"
          label={modeEdition ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
          value={form.password}
          onChange={majChamp('password')}
          error={erreurs.password}
          required={!modeEdition}
        />

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-ink900/80 mb-1.5">Rôle</label>
          <select
            id="role"
            value={form.role}
            onChange={majChamp('role')}
            className="w-full rounded-lg border border-ink900/15 bg-white px-3.5 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          >
            <option value="commercial">Commercial</option>
            <option value="gestionnaire">Gestionnaire</option>
          </select>
          {erreurs.role && <p className="mt-1 text-xs text-danger">{erreurs.role}</p>}
        </div>

        <TextField
          id="poste"
          label="Poste (optionnel)"
          placeholder="Ex : Caissière, Magasinier..."
          hint="Simple libellé affiché, sans impact sur les permissions (définies par le rôle ci-dessus)."
          value={form.poste}
          onChange={majChamp('poste')}
          error={erreurs.poste}
        />

        {modeEdition && (
          <label className="flex items-center gap-2 text-sm text-ink900 cursor-pointer">
            <input type="checkbox" checked={form.actif} onChange={majChamp('actif')} className="h-4 w-4" />
            Compte actif
          </label>
        )}

        {erreurGenerale && (
          <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
            {erreurGenerale}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="boutique" loading={chargement}>
            {modeEdition ? 'Enregistrer' : 'Créer le membre'}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/equipe')}
            className="text-sm font-medium text-ink900/60 hover:text-ink900 px-4"
          >
            Annuler
          </button>
        </div>
      </form>
    </AppShell>
  );
}
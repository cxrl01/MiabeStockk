import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../hooks/useAuth';
import { extraireErreursValidation } from '../../services/api';

const CHAMPS_INITIAUX = {
  nom_boutique: '',
  proprietaire: '',
  email: '',
  password: '',
  password_confirmation: '',
  multi_points_vente: null,
};

/** Découpe "Nom du propriétaire" en prenom + nom pour l'API. */
function decomposerProprietaire(valeur) {
  const parts = valeur.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: '', nom: '' };
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);

  const majChamp = (champ) => (e) => {
    setForm((f) => ({ ...f, [champ]: e.target.value }));
    setErreurs((err) => {
      const next = { ...err, [champ]: undefined };
      if (champ === 'proprietaire') {
        next.nom = undefined;
        next.prenom = undefined;
      }
      return next;
    });
  };

  const choisirMulti = (valeur) => {
    setForm((f) => ({ ...f, multi_points_vente: valeur }));
    setErreurs((err) => ({ ...err, multi_points_vente: undefined }));
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurGenerale('');

    if (form.multi_points_vente === null) {
      setErreurs((err) => ({
        ...err,
        multi_points_vente: 'Indiquez si vous avez plusieurs points de vente.',
      }));
      return;
    }

    setChargement(true);
    const { prenom, nom } = decomposerProprietaire(form.proprietaire);

    try {
      await register({
        nom_boutique: form.nom_boutique,
        prenom,
        nom,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        multi_points_vente: form.multi_points_vente,
      });
      navigate('/dashboard');
    } catch (error) {
      if (error?.response?.status === 422) {
        const apiErr = extraireErreursValidation(error);
        if (apiErr.nom || apiErr.prenom) {
          apiErr.proprietaire = apiErr.proprietaire || apiErr.nom || apiErr.prenom;
        }
        setErreurs(apiErr);
      } else {
        setErreurGenerale('Une erreur est survenue. Réessayez dans un instant.');
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Commencez à gérer votre stock"
      footer={
        <>
          Déjà un compte ?{' '}
          <Link to="/connexion" className="font-medium text-indigo-700 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={soumettre} noValidate className="space-y-4">
        <TextField
          id="nom_boutique"
          label="Nom de l'entreprise"
          placeholder="Ex : Boutique Awa"
          value={form.nom_boutique}
          onChange={majChamp('nom_boutique')}
          error={erreurs.nom_boutique}
          required
        />

        <TextField
          id="proprietaire"
          label="Nom du propriétaire"
          autoComplete="name"
          placeholder="Ex : Kofi Mensah"
          value={form.proprietaire}
          onChange={majChamp('proprietaire')}
          error={erreurs.proprietaire}
          required
        />

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-ink900/80">
            Avez-vous plusieurs points de vente ou succursales ?
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => choisirMulti(true)}
              className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                form.multi_points_vente === true
                  ? 'border-ochre-500 bg-ochre-500/10 text-ochre-600'
                  : 'border-ink900/15 bg-white text-ink900/70 hover:border-ink900/30'
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => choisirMulti(false)}
              className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                form.multi_points_vente === false
                  ? 'border-indigo-700 bg-indigo-700/5 text-indigo-700'
                  : 'border-ink900/15 bg-white text-ink900/70 hover:border-ink900/30'
              }`}
            >
              Non, un seul
            </button>
          </div>
          {form.multi_points_vente === true && (
            <p className="mt-2 text-xs leading-relaxed text-ink900/50">
              Vous pourrez ajouter et gérer plusieurs succursales depuis votre espace.
            </p>
          )}
          {form.multi_points_vente === false && (
            <p className="mt-2 text-xs leading-relaxed text-ink900/50">
              Parfait pour démarrer. Vous pourrez activer le multi-points de vente plus tard.
            </p>
          )}
          {erreurs.multi_points_vente && (
            <p className="mt-1.5 text-sm text-danger">{erreurs.multi_points_vente}</p>
          )}
        </fieldset>

        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="vous@boutique.com"
          value={form.email}
          onChange={majChamp('email')}
          error={erreurs.email}
          required
        />

        <TextField
          id="password"
          type="password"
          label="Mot de passe"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={form.password}
          onChange={majChamp('password')}
          error={erreurs.password}
          required
        />

        <TextField
          id="password_confirmation"
          type="password"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          placeholder="Retapez le mot de passe"
          value={form.password_confirmation}
          onChange={majChamp('password_confirmation')}
          error={erreurs.password_confirmation}
          required
        />

        {erreurGenerale && (
          <p
            role="alert"
            className="rounded-lg border border-danger/20 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
          >
            {erreurGenerale}
          </p>
        )}

        <Button type="submit" variant="boutique" loading={chargement} className="w-full py-3">
          Créer mon compte
        </Button>
      </form>
    </AuthLayout>
  );
}

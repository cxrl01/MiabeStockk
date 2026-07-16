import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import api, { initCsrf, extraireErreursValidation } from '../../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);
  const [reussi, setReussi] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurs({});
    setErreurGenerale('');

    if (!token || !email) {
      setErreurGenerale('Lien invalide ou expiré. Demandez un nouveau lien.');
      return;
    }

    setChargement(true);
    try {
      await initCsrf();
      await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setReussi(true);
      setTimeout(() => navigate('/connexion'), 2000);
    } catch (error) {
      const champs = extraireErreursValidation(error);
      if (Object.keys(champs).length > 0) {
        setErreurs(champs);
      } else {
        setErreurGenerale(error.response?.data?.message || 'Une erreur est survenue. Réessayez dans un instant.');
      }
    } finally {
      setChargement(false);
    }
  };

  if (reussi) {
    return (
      <AuthLayout
        title="Mot de passe réinitialisé"
        subtitle="Votre mot de passe a été mis à jour."
        footer={
          <Link to="/connexion" className="font-medium text-indigo-700 hover:underline">
            ← Retour à la connexion
          </Link>
        }
      >
        <div className="rounded-xl border border-indigo-700/15 bg-indigo-700/5 p-5 text-sm leading-relaxed text-ink900/80">
          Redirection vers la page de connexion...
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe pour votre compte."
      footer={
        <Link to="/connexion" className="font-medium text-indigo-700 hover:underline">
          ← Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={soumettre} noValidate className="space-y-4">
        <TextField
          id="password"
          type="password"
          label="Nouveau mot de passe"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={erreurs.password}
          required
        />
        <TextField
          id="password_confirmation"
          type="password"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          error={erreurs.password_confirmation}
          required
        />

        {erreurGenerale && <p className="text-sm text-red-600">{erreurGenerale}</p>}

        <Button type="submit" variant="boutique" loading={chargement} className="w-full py-3">
          Réinitialiser le mot de passe
        </Button>
      </form>
    </AuthLayout>
  );
}
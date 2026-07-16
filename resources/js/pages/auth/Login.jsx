import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../hooks/useAuth';
import { extraireErreursValidation } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [chargement, setChargement] = useState(false);

  const majChamp = (champ) => (e) => {
    setForm((f) => ({ ...f, [champ]: e.target.value }));
    setErreurs((err) => ({ ...err, [champ]: undefined }));
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurGenerale('');
    setChargement(true);

    try {
      const user = await login(form);
      navigate(user.role?.nom === 'super_admin' ? '/admin' : '/dashboard');
    } catch (error) {
      const statut = error?.response?.status;
      if (statut === 422) {
        setErreurs(extraireErreursValidation(error));
      } else if (statut === 401) {
        setErreurGenerale('Email ou mot de passe incorrect.');
      } else if (statut === 403) {
        setErreurGenerale(error.response?.data?.message || 'Accès refusé.');
      } else {
        setErreurGenerale('Une erreur est survenue. Réessayez dans un instant.');
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Connectez-vous à votre compte"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="font-medium text-indigo-700 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={soumettre} noValidate className="space-y-4">
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
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={majChamp('password')}
          error={erreurs.password}
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
          Se connecter
        </Button>

        <p className="text-center">
          <Link to="/mot-de-passe-oublie" className="text-sm text-indigo-700 hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import api, { initCsrf, extraireErreursValidation } from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    try {
      await initCsrf();
      await api.post('/auth/forgot-password', { email });
      setEnvoye(true);
    } catch (error) {
      const erreurs = extraireErreursValidation(error);
      setErreur(erreurs.email || 'Une erreur est survenue. Réessayez dans un instant.');
    } finally {
      setChargement(false);
    }
  };

  if (envoye) {
    return (
      <AuthLayout
        title="Vérifiez vos e-mails"
        subtitle="Un lien de réinitialisation a été envoyé si un compte existe."
        footer={
          <Link to="/connexion" className="font-medium text-indigo-700 hover:underline">
            ← Retour à la connexion
          </Link>
        }
      >
        <div className="rounded-xl border border-indigo-700/15 bg-indigo-700/5 p-5 text-sm leading-relaxed text-ink900/80">
          Si un compte existe pour <span className="font-medium text-ink900">{email}</span>, un lien
          vient de lui être envoyé. Pensez à vérifier vos spams.
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Indiquez l'e-mail associé à votre compte, nous vous enverrons un lien."
      footer={
        <Link to="/connexion" className="font-medium text-indigo-700 hover:underline">
          ← Retour à la connexion
        </Link>
      }
    >
      <form onSubmit={soumettre} noValidate className="space-y-4">
        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="vous@boutique.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={erreur}
          required
        />

        <Button type="submit" variant="boutique" loading={chargement} className="w-full py-3">
          Envoyer le lien
        </Button>
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import api, { extraireErreursValidation } from '../services/api';

function ChampLecture({ label, valeur }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink900/70 mb-1.5">{label}</p>
      <div className="rounded-lg bg-ink900/[0.04] border border-ink900/10 px-4 py-2.5 text-sm text-ink900">
        {valeur || <span className="text-ink900/30">—</span>}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export default function Profil() {
  const { user, setUser } = useAuth();

  const estSuperAdmin = user?.role?.nom === 'super_admin';
  const boutiqueNom = estSuperAdmin
    ? 'MiabéStock'
    : (user?.boutique?.nom || user?.boutiques_gerees?.[0]?.nom || 'Ma boutique');
  const roleLibelle = user?.role?.libelle || '';
  const nomComplet = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim();
  const initiales = `${user?.prenom?.charAt(0) ?? ''}${user?.nom?.charAt(0) ?? ''}`.toUpperCase();
  const membreDepuis = formatDate(user?.created_at);

  // --- Édition infos personnelles ---
  const [modeEdition, setModeEdition] = useState(false);
  const [form, setForm] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
  });
  const [erreursInfos, setErreursInfos] = useState({});
  const [chargementInfos, setChargementInfos] = useState(false);

  const annulerEdition = () => {
    setForm({
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
    });
    setErreursInfos({});
    setModeEdition(false);
  };

  const soumettreInfos = async (e) => {
    e.preventDefault();
    setErreursInfos({});
    setChargementInfos(true);
    try {
      const { data } = await api.put('/profil', form);
      setUser(data.user);
      setModeEdition(false);
    } catch (error) {
      setErreursInfos(extraireErreursValidation(error));
    } finally {
      setChargementInfos(false);
    }
  };

  // --- Mot de passe ---
  const [modeMdp, setModeMdp] = useState(false);
  const [motDePasse, setMotDePasse] = useState({
    mot_de_passe_actuel: '',
    password: '',
    password_confirmation: '',
  });
  const [erreursMdp, setErreursMdp] = useState({});
  const [chargementMdp, setChargementMdp] = useState(false);
  const [succesMdp, setSuccesMdp] = useState(false);

  const annulerMdp = () => {
    setMotDePasse({ mot_de_passe_actuel: '', password: '', password_confirmation: '' });
    setErreursMdp({});
    setModeMdp(false);
  };

  const soumettreMotDePasse = async (e) => {
    e.preventDefault();
    setErreursMdp({});
    setChargementMdp(true);
    try {
      await api.put('/profil/mot-de-passe', motDePasse);
      setMotDePasse({ mot_de_passe_actuel: '', password: '', password_confirmation: '' });
      setModeMdp(false);
      setSuccesMdp(true);
      setTimeout(() => setSuccesMdp(false), 4000);
    } catch (error) {
      setErreursMdp(extraireErreursValidation(error));
    } finally {
      setChargementMdp(false);
    }
  };

  return (
    <AppShell title="Profil">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="rounded-2xl border border-ink900/10 bg-surface p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-indigo-700 text-paper font-display font-semibold text-xl flex items-center justify-center">
              {initiales}
            </div>
            <div>
              <h1 className="font-display font-semibold text-xl text-ink900">{nomComplet}</h1>
              <p className="text-sm text-ink900/50">{roleLibelle} · {boutiqueNom}</p>
              {user?.actif && (
                <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-medium px-2.5 py-1">
                  Compte actif
                </span>
              )}
            </div>
          </div>

          {membreDepuis && (
            <div className="text-right">
              <p className="text-xs text-ink900/40">Membre depuis</p>
              <p className="text-sm font-medium text-ink900 capitalize">{membreDepuis}</p>
            </div>
          )}
        </div>

        {/* Informations personnelles */}
        <div className="rounded-2xl border border-ink900/10 bg-surface p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-lg text-ink900">Informations personnelles</h2>
            {!modeEdition && (
              <Button type="button" variant="ghost" onClick={() => setModeEdition(true)}>
                Modifier
              </Button>
            )}
          </div>

          {!modeEdition ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChampLecture label="Nom complet" valeur={nomComplet} />
              <ChampLecture label="Téléphone" valeur={user?.telephone} />
              <ChampLecture label="Adresse e-mail" valeur={user?.email} />
              <ChampLecture label="Poste" valeur={user?.poste || roleLibelle} />
            </div>
          ) : (
            <form onSubmit={soumettreInfos} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  id="prenom"
                  label="Prénom"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  error={erreursInfos.prenom}
                  required
                />
                <TextField
                  id="nom"
                  label="Nom"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  error={erreursInfos.nom}
                  required
                />
              </div>
              <TextField
                id="telephone"
                label="Téléphone"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                error={erreursInfos.telephone}
              />
              <TextField
                id="email"
                type="email"
                label="Adresse e-mail"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={erreursInfos.email}
                required
              />

              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" variant="boutique" loading={chargementInfos}>
                  Enregistrer
                </Button>
                <Button type="button" variant="ghost" onClick={annulerEdition}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Sécurité */}
        <div className="rounded-2xl border border-ink900/10 bg-surface p-6">
          <h2 className="font-display font-semibold text-lg text-ink900 mb-5">Sécurité</h2>

          {!modeMdp ? (
            <div className="flex items-center justify-between rounded-lg bg-ink900/[0.04] border border-ink900/10 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-ink900">Mot de passe</p>
                {succesMdp && <p className="text-xs text-emerald-600 mt-0.5">Mot de passe mis à jour.</p>}
              </div>
              <Button type="button" variant="ghost" onClick={() => setModeMdp(true)}>
                Modifier
              </Button>
            </div>
          ) : (
            <form onSubmit={soumettreMotDePasse} noValidate className="space-y-4">
              <TextField
                id="mot_de_passe_actuel"
                type="password"
                label="Mot de passe actuel"
                autoComplete="current-password"
                value={motDePasse.mot_de_passe_actuel}
                onChange={(e) => setMotDePasse({ ...motDePasse, mot_de_passe_actuel: e.target.value })}
                error={erreursMdp.mot_de_passe_actuel}
                required
              />
              <TextField
                id="nouveau_password"
                type="password"
                label="Nouveau mot de passe"
                autoComplete="new-password"
                value={motDePasse.password}
                onChange={(e) => setMotDePasse({ ...motDePasse, password: e.target.value })}
                error={erreursMdp.password}
                required
              />
              <TextField
                id="nouveau_password_confirmation"
                type="password"
                label="Confirmer le nouveau mot de passe"
                autoComplete="new-password"
                value={motDePasse.password_confirmation}
                onChange={(e) => setMotDePasse({ ...motDePasse, password_confirmation: e.target.value })}
                error={erreursMdp.password_confirmation}
                required
              />

              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" variant="boutique" loading={chargementMdp}>
                  Changer le mot de passe
                </Button>
                <Button type="button" variant="ghost" onClick={annulerMdp}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
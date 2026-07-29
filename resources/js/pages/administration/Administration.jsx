import { useEffect, useRef, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import api, { extraireErreursValidation } from '../../services/api';

const CHAMPS_INITIAUX = {
  nom: '',
  adresse: '',
  telephone: '',
  devise: 'FCFA',
  tva: '',
};

const initialesDe = (nom) => {
  if (!nom) return '?';
  const mots = nom.trim().split(/\s+/);
  const initiales = mots.slice(0, 2).map((m) => m[0]?.toUpperCase() ?? '');
  return initiales.join('') || '?';
};

// Icônes en SVG inline (pas de dépendance externe)
const IconeCamera = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconeChargement = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconeCroix = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function Administration() {
  const { user, refreshUser } = useAuth();
  const [boutiques, setBoutiques] = useState([]);
  const [boutiqueActiveId, setBoutiqueActiveId] = useState('');
  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [modalNouvelleBoutiqueOuvert, setModalNouvelleBoutiqueOuvert] = useState(false);

  // --- Logo de la boutique active ---
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoEnvoiEnCours, setLogoEnvoiEnCours] = useState(false);
  const [logoErreur, setLogoErreur] = useState('');
  const inputLogoRef = useRef(null);

  // Suppression : boutique ciblée + motif + état de la requête
  const [boutiqueASupprimer, setBoutiqueASupprimer] = useState(null);
  const [motifSuppression, setMotifSuppression] = useState('');
  const [erreurSuppression, setErreurSuppression] = useState('');
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  // Tableau 6 du mémoire : "Configurer boutique" = Gérant uniquement.
  const estGerant = user?.role?.nom === 'gerant';

  const chargerBoutiques = () => {
    return api.get('/boutiques').then(({ data }) => {
      setBoutiques(data);
      if (data.length && !boutiqueActiveId) {
        setBoutiqueActiveId(String(data[0].id));
        remplirForm(data[0]);
      }
      return data;
    });
  };

  useEffect(() => {
    chargerBoutiques();
  }, []);

  const remplirForm = (b) => {
    setForm({
      nom: b.nom,
      adresse: b.adresse ?? '',
      telephone: b.telephone ?? '',
      devise: b.devise ?? 'FCFA',
      tva: b.tva ?? '',
    });
    setLogoUrl(b.logo_url ?? null);
    setLogoErreur('');
  };

  const changerBoutiqueActive = (id) => {
    setBoutiqueActiveId(id);
    const b = boutiques.find((x) => String(x.id) === id);
    if (b) remplirForm(b);
    setSucces(false);
  };

  const majChamp = (champ) => (e) => {
    setForm((f) => ({ ...f, [champ]: e.target.value }));
    setErreurs((err) => ({ ...err, [champ]: undefined }));
    setSucces(false);
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setErreurGenerale('');
    setSucces(false);
    setChargement(true);

    try {
      await api.put(`/boutiques/${boutiqueActiveId}`, form);
      setSucces(true);
      // On rafraîchit la liste locale ET l'utilisateur (donc
      // boutiques_gerees dans AuthContext/BoutiqueActiveContext),
      // sinon la nouvelle TVA reste invisible ailleurs dans l'app
      // tant que la page n'est pas rechargée.
      await Promise.all([chargerBoutiques(), refreshUser()]);
    } catch (error) {
      if (error?.response?.status === 422) {
        setErreurs(extraireErreursValidation(error));
      } else {
        setErreurGenerale('Une erreur est survenue.');
      }
    } finally {
      setChargement(false);
    }
  };

  const creerBoutique = async (e) => {
    e.preventDefault();
    const donnees = new FormData(e.target);
    try {
      await api.post('/boutiques', {
        nom: donnees.get('nom'),
        adresse: donnees.get('adresse') || null,
        telephone: donnees.get('telephone') || null,
      });
      setModalNouvelleBoutiqueOuvert(false);
      e.target.reset();
      await Promise.all([chargerBoutiques(), refreshUser()]);
    } catch (error) {
      alert(error?.response?.data?.message || 'Erreur lors de la création de la boutique.');
    }
  };

  // --- Gestion du logo ---

  const declencherSelectionLogo = () => {
    if (logoEnvoiEnCours) return;
    inputLogoRef.current?.click();
  };

  const changerLogo = async (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    const typesAcceptes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!typesAcceptes.includes(fichier.type)) {
      setLogoErreur('Format non supporté (PNG, JPG ou WEBP uniquement).');
      e.target.value = '';
      return;
    }
    if (fichier.size > 2 * 1024 * 1024) {
      setLogoErreur('Le fichier dépasse 2 Mo.');
      e.target.value = '';
      return;
    }

    setLogoErreur('');
    setLogoEnvoiEnCours(true);

    // Aperçu immédiat, avant même la réponse serveur
    const previewLocal = URL.createObjectURL(fichier);
    setLogoUrl(previewLocal);

    const donnees = new FormData();
    donnees.append('logo', fichier);

    try {
      const { data } = await api.post(`/boutiques/${boutiqueActiveId}/logo`, donnees, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLogoUrl(data.logo_url);
      await Promise.all([chargerBoutiques(), refreshUser()]);
    } catch (error) {
      setLogoErreur(error?.response?.data?.message || "Échec de l'envoi du logo.");
      const b = boutiques.find((x) => String(x.id) === boutiqueActiveId);
      setLogoUrl(b?.logo_url ?? null);
    } finally {
      setLogoEnvoiEnCours(false);
      e.target.value = '';
    }
  };

  const supprimerLogo = async () => {
    setLogoEnvoiEnCours(true);
    setLogoErreur('');
    try {
      await api.delete(`/boutiques/${boutiqueActiveId}/logo`);
      setLogoUrl(null);
      await Promise.all([chargerBoutiques(), refreshUser()]);
    } catch (error) {
      setLogoErreur(error?.response?.data?.message || 'Échec de la suppression du logo.');
    } finally {
      setLogoEnvoiEnCours(false);
    }
  };

  const ouvrirSuppression = (boutique) => {
    setBoutiqueASupprimer(boutique);
    setMotifSuppression('');
    setErreurSuppression('');
  };

  const confirmerSuppression = async (e) => {
    e.preventDefault();
    setErreurSuppression('');
    setSuppressionEnCours(true);

    try {
      await api.delete(`/boutiques/${boutiqueASupprimer.id}`, {
        data: { motif: motifSuppression },
      });

      const idSupprime = String(boutiqueASupprimer.id);
      setBoutiqueASupprimer(null);

      if (idSupprime === boutiqueActiveId) {
        setBoutiqueActiveId('');
      }
      await Promise.all([chargerBoutiques(), refreshUser()]);
    } catch (error) {
      setErreurSuppression(
        error?.response?.data?.message || 'Une erreur est survenue lors de la suppression.'
      );
    } finally {
      setSuppressionEnCours(false);
    }
  };

  if (!estGerant) {
    return (
      <AppShell title="Administration">
        <p className="text-sm text-ink900/50 bg-ink900/[0.03] rounded-lg px-4 py-3">
          Cette page est réservée au Gérant.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell title="Administration">
      <div className="max-w-xl mx-auto space-y-6">
        {boutiques.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-ink900/80 mb-1.5">Boutique</label>
            <select
              value={boutiqueActiveId}
              onChange={(e) => changerBoutiqueActive(e.target.value)}
              className="w-full rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              {boutiques.map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-surface rounded-xl border border-ink900/10 p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl text-ink900 mb-1">Informations de la boutique</h2>
          <p className="text-sm text-ink900/50 mb-6">Configurez les informations générales</p>

          {/* --- Avatar boutique + badge upload logo --- */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-24 h-24">
              <input
                ref={inputLogoRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={changerLogo}
                className="hidden"
              />

              <div className="w-24 h-24 rounded-full border border-ink900/10 bg-indigo-50 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo de la boutique" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-display font-semibold text-indigo-700">
                    {initialesDe(form.nom)}
                  </span>
                )}

                {logoEnvoiEnCours && (
                  <div className="absolute inset-0 rounded-full bg-ink900/40 flex items-center justify-center">
                    <IconeChargement className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Badge appareil-photo, en bas à droite */}
              <button
                type="button"
                onClick={declencherSelectionLogo}
                disabled={logoEnvoiEnCours}
                title={logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-600 text-white
                  flex items-center justify-center border-2 border-surface shadow-sm
                  hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <IconeCamera className="w-4 h-4" />
              </button>

              {/* Badge suppression, en haut à droite, seulement si un logo existe */}
              {logoUrl && !logoEnvoiEnCours && (
                <button
                  type="button"
                  onClick={supprimerLogo}
                  title="Retirer le logo"
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-danger text-white
                    flex items-center justify-center border-2 border-surface shadow-sm
                    hover:bg-danger/90 transition"
                >
                  <IconeCroix className="w-3 h-3" />
                </button>
              )}
            </div>

            <p className="text-xs text-ink900/40 mt-3">PNG, JPG ou WEBP — 2 Mo max.</p>
            {logoErreur && <p className="text-xs text-danger mt-1">{logoErreur}</p>}
          </div>

          <form onSubmit={soumettre} className="space-y-5">
            <TextField id="nom" label="Nom de la boutique" value={form.nom} onChange={majChamp('nom')} error={erreurs.nom} required />
            <TextField id="adresse" label="Adresse" value={form.adresse} onChange={majChamp('adresse')} error={erreurs.adresse} />
            <TextField id="telephone" label="Téléphone" value={form.telephone} onChange={majChamp('telephone')} error={erreurs.telephone} />

            <div className="grid grid-cols-2 gap-4">
              <TextField id="devise" label="Devise" value={form.devise} onChange={majChamp('devise')} error={erreurs.devise} />
              <TextField id="tva" type="number" step="0.01" label="Taux de TVA (%)" value={form.tva} onChange={majChamp('tva')} error={erreurs.tva} />
            </div>

            {succes && (
              <p className="text-sm text-success bg-success/5 border border-success/20 rounded-lg px-4 py-3">
                Informations enregistrées.
              </p>
            )}
            {erreurGenerale && (
              <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
                {erreurGenerale}
              </p>
            )}

            <Button type="submit" variant="boutique" loading={chargement}>
              Enregistrer
            </Button>
          </form>
        </div>

        {user?.multi_points_vente && (
          <div className="bg-surface rounded-xl border border-ink900/10 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-semibold text-ink900">Mes boutiques</h2>
              <button
                type="button"
                onClick={() => setModalNouvelleBoutiqueOuvert(true)}
                className="text-sm font-medium text-indigo-700 hover:underline"
              >
                + Nouvelle boutique
              </button>
            </div>
            <p className="text-xs text-ink900/40 mb-4">
              Mode multi points de vente activé — vous pouvez gérer plusieurs boutiques.
            </p>
            <ul className="space-y-2 mb-4">
              {boutiques.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt="" className="w-7 h-7 rounded-full object-cover border border-ink900/10" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold flex items-center justify-center">
                        {initialesDe(b.nom)}
                      </span>
                    )}
                    <span className="text-ink900">{b.nom}</span>
                    <span className="text-xs text-ink900/40 ml-1">{b.adresse || '—'}</span>
                  </div>
                  {boutiques.length > 1 && (
                    <button
                      type="button"
                      onClick={() => ouvrirSuppression(b)}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {modalNouvelleBoutiqueOuvert && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-ink900 mb-4">Nouvelle boutique</h3>
            <form onSubmit={creerBoutique} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Nom</label>
                <input name="nom" required autoFocus className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Adresse (optionnel)</label>
                <input name="adresse" className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Téléphone (optionnel)</label>
                <input name="telephone" className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="boutique">Créer</Button>
                <button
                  type="button"
                  onClick={() => setModalNouvelleBoutiqueOuvert(false)}
                  className="text-sm font-medium text-ink900/60 hover:text-ink900 px-3"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {boutiqueASupprimer && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-ink900 mb-2">Supprimer « {boutiqueASupprimer.nom} »</h3>
            <p className="text-xs text-ink900/50 mb-4">
              Cette action est définitive. La boutique disparaîtra de vos listes, mais son historique (commandes, CA) reste conservé.
            </p>
            <form onSubmit={confirmerSuppression} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Motif de la suppression</label>
                <textarea
                  value={motifSuppression}
                  onChange={(e) => setMotifSuppression(e.target.value)}
                  required
                  minLength={5}
                  rows={3}
                  className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm"
                />
              </div>
              {erreurSuppression && (
                <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
                  {erreurSuppression}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="danger" loading={suppressionEnCours}>
                  Confirmer la suppression
                </Button>
                <button
                  type="button"
                  onClick={() => setBoutiqueASupprimer(null)}
                  className="text-sm font-medium text-ink900/60 hover:text-ink900 px-3"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
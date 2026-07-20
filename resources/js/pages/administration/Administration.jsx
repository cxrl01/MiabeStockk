import { useEffect, useState } from 'react';
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

export default function Administration() {
  const { user } = useAuth();
  const [boutiques, setBoutiques] = useState([]);
  const [boutiqueActiveId, setBoutiqueActiveId] = useState('');
  const [form, setForm] = useState(CHAMPS_INITIAUX);
  const [erreurs, setErreurs] = useState({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [modalNouvelleBoutiqueOuvert, setModalNouvelleBoutiqueOuvert] = useState(false);

  // Tableau 6 du mémoire : "Configurer boutique" = Gérant uniquement.
  const estGerant = user?.role?.nom === 'gerant';

  const chargerBoutiques = () => {
    api.get('/boutiques').then(({ data }) => {
      setBoutiques(data);
      if (data.length && !boutiqueActiveId) {
        setBoutiqueActiveId(String(data[0].id));
        remplirForm(data[0]);
      }
    });
  };

  useEffect(chargerBoutiques, []);

  const remplirForm = (b) => {
    setForm({
      nom: b.nom,
      adresse: b.adresse ?? '',
      telephone: b.telephone ?? '',
      devise: b.devise ?? 'FCFA',
      tva: b.tva ?? '',
    });
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
      chargerBoutiques();
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

  if (!estGerant) {
    return (
      <AppShell title="Administration">
        <p className="text-sm text-ink900/50 bg-ink900/[0.03] rounded-lg px-4 py-3">
          Cette page est réservée au Gérant.
        </p>
      </AppShell>
    );
  }

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
      chargerBoutiques();
    } catch (error) {
      alert(error?.response?.data?.message || 'Erreur lors de la création de la boutique.');
    }
  };

  return (
    <AppShell title="Administration">
      {boutiques.length > 1 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-ink900/80 mb-1.5">Boutique</label>
          <select
            value={boutiqueActiveId}
            onChange={(e) => changerBoutiqueActive(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-ink900/15 bg-white px-3.5 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          >
            {boutiques.map((b) => (
              <option key={b.id} value={b.id}>{b.nom}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-ink900/10 p-5 max-w-lg">
        <h2 className="font-display font-semibold text-ink900 mb-4">Informations de la boutique</h2>

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
        <div className="bg-surface rounded-xl border border-ink900/10 p-5 max-w-lg mt-6">
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
                <span className="text-ink900">{b.nom}</span>
                <span className="text-xs text-ink900/40">{b.adresse || '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
    </AppShell>
  );
}
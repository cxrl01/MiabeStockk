import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import api, { extraireErreursValidation } from '../../services/api';
import { formatMontant } from '../../lib/format';

const MODES_PAIEMENT = [
  { value: 'especes', label: '💵 Espèces' },
  { value: 'mobile_money', label: '📱 Mobile Money' },
  { value: 'cheque', label: '📄 Chèque' },
  { value: 'virement', label: '🏦 Virement' },
];

export default function NouvelleVente() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [panier, setPanier] = useState({}); // { [produitId]: { nom, prix_vente, quantite, quantite_stock } }
  const [clientId, setClientId] = useState('');
  const [modePaiement, setModePaiement] = useState('especes');
  const [payerTotalite, setPayerTotalite] = useState(true);
  const [montantPaye, setMontantPaye] = useState('0');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [venteReussie, setVenteReussie] = useState(null);
  const [modalClientOuvert, setModalClientOuvert] = useState(false);

  useEffect(() => {
    api.get('/produits', { params: { per_page: 200 } })
      .then(({ data }) => setProduits(data.data))
      .catch(() => setErreur('Impossible de charger le catalogue produits.'));

    api.get('/clients', { params: { per_page: 200 } })
      .then(({ data }) => setClients(data.data ?? data))
      .catch(() => {});
  }, []);

  const produitsFiltres = useMemo(() => {
    const terme = recherche.toLowerCase().trim();
    if (!terme) return produits;
    return produits.filter(
      (p) => p.nom.toLowerCase().includes(terme) || (p.reference ?? '').toLowerCase().includes(terme)
    );
  }, [produits, recherche]);

  // Taux de TVA de la boutique du Gérant/staff connecté (chargé avec la
  // session via AuthController::login/me — voir user.boutique ou
  // user.boutiques_gerees selon le rôle). Sans ça, "payer la totalité"
  // calculait un montant HT, toujours inférieur au montant_ttc réel côté
  // backend, ce qui faisait retomber systématiquement la vente en "partielle".
  const tauxTva = Number(user?.boutique?.tva ?? user?.boutiques_gerees?.[0]?.tva ?? 0);

  const totalHt = useMemo(
    () => Object.values(panier).reduce((s, item) => s + item.prix_vente * item.quantite, 0),
    [panier]
  );
  const montantTva = totalHt * (tauxTva / 100);
  const totalTtc = totalHt + montantTva;

  const reste = Math.max(totalTtc - (Number(montantPaye) || 0), 0);
  const monnaieARendre = Math.max((Number(montantPaye) || 0) - totalTtc, 0);

  // Ajuste automatiquement le montant payé (TTC) quand "payer la totalité"
  // est coché, ou quand le panier/la TVA change pendant que la case est cochée.
  useEffect(() => {
    if (payerTotalite) setMontantPaye(String(Math.round(totalTtc)));
  }, [totalTtc, payerTotalite]);

  function ajouterAuPanier(produit) {
    setPanier((p) => {
      const existant = p[produit.id];
      const quantiteActuelle = existant?.quantite ?? 0;

      if (quantiteActuelle >= produit.quantite_stock) {
        setErreur(`Stock insuffisant pour ${produit.nom}.`);
        return p;
      }

      return {
        ...p,
        [produit.id]: {
          nom: produit.nom,
          prix_vente: Number(produit.prix_vente),
          quantite: quantiteActuelle + 1,
          quantite_stock: produit.quantite_stock,
        },
      };
    });
  }

  function changerQuantite(produitId, delta) {
    setPanier((p) => {
      const item = p[produitId];
      if (!item) return p;

      const nouvelleQuantite = item.quantite + delta;

      if (nouvelleQuantite <= 0) {
        const { [produitId]: _retire, ...reste } = p;
        return reste;
      }

      if (nouvelleQuantite > item.quantite_stock) {
        setErreur(`Stock insuffisant pour ${item.nom}.`);
        return p;
      }

      return { ...p, [produitId]: { ...item, quantite: nouvelleQuantite } };
    });
  }

  async function creerClientRapide(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      nom: form.get('nom')?.toString().trim(),
      telephone: form.get('telephone')?.toString().trim() || null,
      adresse: form.get('adresse')?.toString().trim() || null,
    };

    if (!payload.nom) return;

    try {
      const { data } = await api.post('/clients', payload);
      setClients((c) => [...c, data]);
      setClientId(String(data.id));
      setModalClientOuvert(false);
      e.target.reset();
    } catch (error) {
      alert(error?.response?.data?.message || 'Erreur lors de la création du client.');
    }
  }

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');

    if (Object.keys(panier).length === 0) {
      setErreur('Ajoutez au moins un produit avant de valider.');
      return;
    }

    setChargement(true);
    try {
      const { data } = await api.post('/ventes', {
        client_id: clientId || null,
        mode_paiement: modePaiement,
        montant_paye: Number(montantPaye) || 0,
        lignes: Object.entries(panier).map(([produit_id, item]) => ({
          produit_id: Number(produit_id),
          quantite: item.quantite,
        })),
      });
      setVenteReussie(data);
    } catch (error) {
      const erreurs = extraireErreursValidation(error);
      setErreur(erreurs.lignes || error?.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setChargement(false);
    }
  }

  function nouvelleVente() {
    setPanier({});
    setClientId('');
    setModePaiement('especes');
    setPayerTotalite(true);
    setMontantPaye('0');
    setVenteReussie(null);
    setErreur('');
  }

  return (
    <AppShell title="Nouvelle vente">
      {erreur && (
        <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-4">
          {erreur}
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div>
          <input
            type="text"
            autoFocus
            placeholder="Rechercher un produit (nom ou référence)..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full rounded-lg border border-ink900/15 bg-white px-3.5 py-2.5 text-sm mb-4
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {produitsFiltres.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => ajouterAuPanier(p)}
                disabled={p.quantite_stock === 0}
                className="text-left bg-surface rounded-xl border border-ink900/10 p-3.5 hover:border-indigo-600
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <p className="text-sm font-medium text-ink900 truncate">{p.nom}</p>
                {p.reference && <p className="text-xs text-ink900/40 font-mono">{p.reference}</p>}
                <p className="font-mono text-sm font-semibold text-indigo-700 mt-2">{formatMontant(p.prix_vente)}</p>
                <p className="text-xs text-ink900/40">Stock : {p.quantite_stock}</p>
              </button>
            ))}

            {produits.length > 0 && produitsFiltres.length === 0 && (
              <p className="col-span-full text-sm text-ink900/40 py-10 text-center">Aucun produit trouvé.</p>
            )}
          </div>
        </div>

        <form onSubmit={soumettre} className="bg-surface rounded-xl border border-ink900/10 p-5 h-fit">
          <label className="block text-sm font-medium text-ink900/80 mb-1.5">Client</label>
          <div className="flex gap-2 mb-4">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1 rounded-lg border border-ink900/15 bg-white px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              <option value="">— Client anonyme —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setModalClientOuvert(true)}
              title="Créer un nouveau client"
              className="shrink-0 rounded-lg border border-ink900/15 px-3 text-ink900/60 hover:bg-ink900/5"
            >
              +
            </button>
          </div>

          <hr className="border-ink900/10 my-4" />

          {Object.keys(panier).length === 0 ? (
            <p className="text-sm text-ink900/40 text-center py-6">Aucun produit ajouté</p>
          ) : (
            <div className="space-y-3 mb-4">
              {Object.entries(panier).map(([id, item]) => (
                <div key={id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink900 truncate">{item.nom}</p>
                    <p className="text-xs text-ink900/40 font-mono">
                      {formatMontant(item.prix_vente)} × {item.quantite}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => changerQuantite(id, -1)} className="h-6 w-6 rounded border border-ink900/15 text-ink900/60 hover:bg-ink900/5">−</button>
                    <span className="w-6 text-center text-sm">{item.quantite}</span>
                    <button type="button" onClick={() => changerQuantite(id, 1)} className="h-6 w-6 rounded border border-ink900/15 text-ink900/60 hover:bg-ink900/5">+</button>
                  </div>
                  <span className="w-20 text-right font-mono text-sm text-ink900 shrink-0">
                    {formatMontant(item.prix_vente * item.quantite)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1 py-3 border-t border-ink900/10 text-sm">
            <div className="flex items-center justify-between text-ink900/60">
              <span>Sous-total HT</span>
              <span className="font-mono">{formatMontant(totalHt)}</span>
            </div>
            <div className="flex items-center justify-between text-ink900/60">
              <span>TVA ({tauxTva}%)</span>
              <span className="font-mono">{formatMontant(montantTva)}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="font-display font-semibold text-ink900">Total TTC</span>
              <span className="font-mono text-xl font-semibold text-indigo-700">{formatMontant(totalTtc)}</span>
            </div>
          </div>

          <label className="block text-sm font-medium text-ink900/80 mb-1.5 mt-4">Mode de paiement</label>
          <select
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value)}
            className="w-full rounded-lg border border-ink900/15 bg-white px-3 py-2.5 text-sm mb-4
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          >
            {MODES_PAIEMENT.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-ink900 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={payerTotalite}
              onChange={(e) => setPayerTotalite(e.target.checked)}
              className="h-4 w-4"
            />
            Le client paie la totalité maintenant
          </label>

          <label className="block text-sm font-medium text-ink900/80 mb-1.5">Montant payé</label>
          <input
            type="number"
            min="0"
            step="1"
            value={montantPaye}
            readOnly={payerTotalite}
            onChange={(e) => setMontantPaye(e.target.value)}
            className="w-full rounded-lg border border-ink900/15 bg-white px-3.5 py-2.5 text-sm mb-1
              focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600
              read-only:bg-ink900/[0.03]"
          />
          <p className="text-xs text-ink900/40 mb-1">Reste à payer : {formatMontant(reste)}</p>
          {monnaieARendre > 0 && (
            <p className="text-xs font-medium text-success mb-3">Monnaie à rendre : {formatMontant(monnaieARendre)}</p>
          )}

          <Button
            type="submit"
            variant="boutique"
            loading={chargement}
            disabled={Object.keys(panier).length === 0}
            className="w-full justify-center mt-3"
          >
            Valider la vente
          </Button>
        </form>
      </div>

      {modalClientOuvert && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-ink900 mb-4">Nouveau client</h3>
            <form onSubmit={creerClientRapide} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Nom complet</label>
                <input name="nom" required autoFocus className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Téléphone (optionnel)</label>
                <input name="telephone" className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Adresse (optionnel)</label>
                <input name="adresse" className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="boutique">Créer le client</Button>
                <button
                  type="button"
                  onClick={() => setModalClientOuvert(false)}
                  className="text-sm font-medium text-ink900/60 hover:text-ink900 px-3"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {venteReussie && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-8 max-w-sm w-full text-center">
            <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h3 className="font-display font-semibold text-lg text-ink900 mb-1">Vente enregistrée !</h3>
            <p className="text-sm text-ink900/50 mb-6">
              La transaction a été validée et les stocks ont été mis à jour automatiquement.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="boutique" onClick={() => navigate(`/ventes/${venteReussie.id}`)} className="justify-center">
                Voir la vente
              </Button>
              <button
                type="button"
                onClick={nouvelleVente}
                className="rounded-lg border border-ink900/15 text-sm font-medium text-ink900 py-2.5 hover:bg-ink900/5"
              >
                Nouvelle vente
              </button>
              <button
                type="button"
                onClick={() => navigate('/ventes')}
                className="text-sm font-medium text-ink900/50 hover:text-ink900 py-2"
              >
                Historique des ventes
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
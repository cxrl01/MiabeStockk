import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
];

export default function FournisseursDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fournisseur, setFournisseur] = useState(null);
  const [livraisons, setLivraisons] = useState([]);
  const [erreur, setErreur] = useState('');

  // Détail produits/quantités par livraison (accordéon)
  const [livraisonOuverte, setLivraisonOuverte] = useState(null);

  // Paiement d'une livraison précise
  const [livraisonAPayer, setLivraisonAPayer] = useState(null);
  const [montantPaiement, setMontantPaiement] = useState('');
  const [modePaiement, setModePaiement] = useState('especes');
  const [erreurPaiement, setErreurPaiement] = useState('');
  const [paiementEnCours, setPaiementEnCours] = useState(false);

  const charger = () => {
    api.get(`/fournisseurs/${id}`)
      .then(({ data }) => {
        setFournisseur(data.fournisseur);
        setLivraisons(data.livraisons ?? []);
      })
      .catch(() => setErreur('Impossible de charger ce fournisseur.'));
  };

  useEffect(charger, [id]);

  const basculerDetail = (livraisonId) => {
    setLivraisonOuverte((actuel) => (actuel === livraisonId ? null : livraisonId));
  };

  const ouvrirPaiement = (livraison) => {
    const solde = Number(livraison.montant_ttc) - Number(livraison.montant_paye);
    setLivraisonAPayer(livraison);
    setMontantPaiement(String(solde));
    setModePaiement('especes');
    setErreurPaiement('');
  };

  const confirmerPaiement = async (e) => {
    e.preventDefault();
    setErreurPaiement('');

    const montant = Number(montantPaiement);
    const solde = Number(livraisonAPayer.montant_ttc) - Number(livraisonAPayer.montant_paye);

    if (!montant || montant <= 0) {
      setErreurPaiement('Le montant doit être supérieur à 0.');
      return;
    }
    if (montant > solde) {
      setErreurPaiement(`Le montant dépasse le solde dû (${formatMontant(solde)}).`);
      return;
    }

    setPaiementEnCours(true);
    try {
      await api.post(`/commandes/${livraisonAPayer.id}/paiements`, {
        montant,
        mode: modePaiement,
      });
      setLivraisonAPayer(null);
      charger();
    } catch (error) {
      setErreurPaiement(error?.response?.data?.message || "Erreur lors de l'enregistrement du paiement.");
    } finally {
      setPaiementEnCours(false);
    }
  };

  if (erreur) {
    return (
      <AppShell title="Fournisseur">
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">{erreur}</p>
      </AppShell>
    );
  }

  if (!fournisseur) {
    return (
      <AppShell title="Fournisseur">
        <p className="text-sm text-ink900/40">Chargement...</p>
      </AppShell>
    );
  }

  const detteTotale = livraisons.reduce(
    (s, l) => s + (Number(l.montant_ttc) - Number(l.montant_paye)),
    0
  );

  return (
    <AppShell title={fournisseur.nom}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/fournisseurs')}
            className="text-sm font-medium text-ink900/60 hover:text-ink900"
          >
            ← Retour aux fournisseurs
          </button>
          <Link
            to={`/fournisseurs/${fournisseur.id}/modifier`}
            className="text-sm font-medium text-indigo-700 hover:underline"
          >
            Modifier
          </Link>
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-6 sm:p-8">
          <h2 className="font-display font-semibold text-xl text-ink900 mb-1">{fournisseur.nom}</h2>
          <div className="text-sm text-ink900/50 space-y-0.5 mb-6">
            {fournisseur.telephone && <p>Tél : {fournisseur.telephone}</p>}
            {fournisseur.adresse && <p>{fournisseur.adresse}</p>}
            {fournisseur.conditions_paiement && <p>Conditions : {fournisseur.conditions_paiement}</p>}
          </div>

          <div className={`rounded-lg px-4 py-3 ${detteTotale > 0 ? 'bg-danger/5 border border-danger/20' : 'bg-success/5 border border-success/20'}`}>
            <p className="text-xs uppercase tracking-wide text-ink900/40 mb-1">Dette totale</p>
            <p className={`font-mono text-2xl font-semibold ${detteTotale > 0 ? 'text-danger' : 'text-success'}`}>
              {formatMontant(detteTotale)}
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-6 sm:p-8">
          <h3 className="font-display font-semibold text-ink900 mb-4">Livraisons</h3>

          {livraisons.length === 0 && (
            <p className="text-sm text-ink900/40 py-4 text-center">Aucune livraison enregistrée.</p>
          )}

          <div className="space-y-3">
            {livraisons.map((l) => {
              const solde = Number(l.montant_ttc) - Number(l.montant_paye);
              const estOuverte = livraisonOuverte === l.id;
              const nbProduits = l.lignes?.length ?? 0;

              return (
                <div
                  key={l.id}
                  className="border border-ink900/10 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => basculerDetail(l.id)}
                        className="text-sm font-medium text-ink900 hover:text-indigo-700 text-left"
                      >
                        {l.numero} — {new Date(l.created_at).toLocaleDateString('fr-FR')}
                        <span className="text-ink900/40 font-normal ml-2">
                          ({nbProduits} produit{nbProduits > 1 ? 's' : ''})
                        </span>
                      </button>
                      <p className="text-xs text-ink900/40 mt-0.5">
                        Total {formatMontant(l.montant_ttc)} · Payé {formatMontant(l.montant_paye)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-semibold ${solde > 0 ? 'text-danger' : 'text-success'}`}>
                        {solde > 0 ? `Reste ${formatMontant(solde)}` : 'Soldé'}
                      </span>
                      {solde > 0 && (
                        <button
                          type="button"
                          onClick={() => ouvrirPaiement(l)}
                          className="text-sm font-medium text-indigo-700 hover:underline whitespace-nowrap"
                        >
                          Payer
                        </button>
                      )}
                    </div>
                  </div>

                  {estOuverte && (
                    <div className="mt-3 pt-3 border-t border-ink900/10 space-y-1.5">
                      {nbProduits === 0 ? (
                        <p className="text-xs text-ink900/40">Aucun détail de produit disponible.</p>
                      ) : (
                        l.lignes.map((ligne) => (
                          <div key={ligne.id} className="flex justify-between text-sm">
                            <span className="text-ink900/70">{ligne.produit?.nom ?? 'Produit'}</span>
                            <span className="text-ink900/50">
                              {ligne.quantite} × {formatMontant(ligne.prix_unitaire)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {livraisonAPayer && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-ink900 mb-1">Payer la livraison {livraisonAPayer.numero}</h3>
            <p className="text-xs text-ink900/50 mb-4">
              Solde dû : {formatMontant(Number(livraisonAPayer.montant_ttc) - Number(livraisonAPayer.montant_paye))}
            </p>

            <form onSubmit={confirmerPaiement} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Montant à payer</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={montantPaiement}
                  onChange={(e) => setMontantPaiement(e.target.value)}
                  required
                  className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink900/80 mb-1">Mode de paiement</label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value)}
                  className="w-full rounded-lg border border-ink900/15 px-3 py-2.5 text-sm"
                >
                  {MODES_PAIEMENT.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {erreurPaiement && (
                <p role="alert" className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">
                  {erreurPaiement}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="boutique" loading={paiementEnCours}>
                  Confirmer le paiement
                </Button>
                <button
                  type="button"
                  onClick={() => setLivraisonAPayer(null)}
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
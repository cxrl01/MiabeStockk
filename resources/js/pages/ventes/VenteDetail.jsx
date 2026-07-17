import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TearLine from '../../components/ui/TearLine';
import { useAuth } from '../../hooks/useAuth';
import api, { extraireErreursValidation } from '../../services/api';
import { formatMontant, formatDate, formatHeure } from '../../lib/format';

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
];

export default function VenteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vente, setVente] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  const [formPaiementOuvert, setFormPaiementOuvert] = useState(false);
  const [montant, setMontant] = useState('');
  const [mode, setMode] = useState('especes');
  const [reference, setReference] = useState('');
  const [erreursPaiement, setErreursPaiement] = useState({});

  const chargerVente = () => {
    api.get(`/ventes/${id}`)
      .then(({ data }) => setVente(data))
      .catch(() => setErreur("Impossible de charger cette vente."));
  };

  useEffect(chargerVente, [id]);

  const peutAnnuler = ['gerant', 'gestionnaire'].includes(user?.role?.nom);
  const solde = vente ? Number(vente.montant_ttc) - Number(vente.montant_paye) : 0;

  const annulerVente = async () => {
    if (!window.confirm('Confirmer l\'annulation de cette vente ? Le stock sera réintégré.')) return;

    setChargementAction(true);
    try {
      await api.post(`/ventes/${id}/annuler`);
      chargerVente();
    } catch (error) {
      setErreur(error?.response?.data?.message || "Impossible d'annuler cette vente.");
    } finally {
      setChargementAction(false);
    }
  };

  const enregistrerPaiement = async (e) => {
    e.preventDefault();
    setErreursPaiement({});

    try {
      await api.post(`/commandes/${id}/paiements`, { montant, mode, reference: reference || undefined });
      setFormPaiementOuvert(false);
      setMontant('');
      setReference('');
      chargerVente();
    } catch (error) {
      if (error?.response?.status === 422) {
        setErreursPaiement(extraireErreursValidation(error));
      } else {
        setErreursPaiement({ montant: error?.response?.data?.message || 'Une erreur est survenue.' });
      }
    }
  };

  if (erreur && !vente) {
    return (
      <AppShell title="Vente">
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">{erreur}</p>
      </AppShell>
    );
  }

  if (!vente) {
    return (
      <AppShell title="Vente">
        <p className="text-ink900/40">Chargement…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title={vente.numero}>
      <button onClick={() => navigate('/ventes')} className="text-sm text-indigo-700 hover:underline mb-4">
        ← Retour aux ventes
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-ink900/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-sm text-ink900/50">{vente.numero}</p>
                <p className="text-xs text-ink900/40">
                  {formatDate(vente.created_at)} à {formatHeure(vente.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                {vente.statut === 'annulee' ? (
                  <Badge statut="annulee" />
                ) : (
                  <Badge statut={vente.statut_paiement} />
                )}
              </div>
            </div>

            <TearLine className="text-ink900/10 mb-4" />

            <div className="space-y-2">
              {vente.lignes.map((ligne) => (
                <div key={ligne.id} className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-ink900/80">
                    {ligne.quantite}× {ligne.produit?.nom}
                  </span>
                  <span className="font-mono text-ink900/70">{formatMontant(ligne.montant_ttc)}</span>
                </div>
              ))}
            </div>

            <TearLine className="text-ink900/10 my-4" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink900/60">
                <span>Sous-total HT</span>
                <span className="font-mono">{formatMontant(vente.montant_ht)}</span>
              </div>
              <div className="flex justify-between text-ink900/60">
                <span>TVA</span>
                <span className="font-mono">{formatMontant(vente.montant_tva)}</span>
              </div>
              <div className="flex justify-between text-ink900 font-semibold text-base pt-1">
                <span>Total TTC</span>
                <span className="font-mono">{formatMontant(vente.montant_ttc)}</span>
              </div>
            </div>
          </div>

          {peutAnnuler && vente.statut === 'validee' && (
            <button
              onClick={annulerVente}
              disabled={chargementAction}
              className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
            >
              Annuler cette vente
            </button>
          )}
        </div>

        {/* Colonne paiements */}
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-5">
            <h2 className="font-display font-semibold text-ink900 mb-3">Paiement</h2>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-ink900/60">Payé</span>
              <span className="font-mono text-success">{formatMontant(vente.montant_paye)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-ink900/60">Restant</span>
              <span className="font-mono text-danger">{formatMontant(solde)}</span>
            </div>

            {vente.statut === 'validee' && solde > 0 && (
              <>
                {!formPaiementOuvert ? (
                  <Button variant="boutique" className="w-full text-sm" onClick={() => setFormPaiementOuvert(true)}>
                    Enregistrer un paiement
                  </Button>
                ) : (
                  <form onSubmit={enregistrerPaiement} className="space-y-3">
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Montant"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        className="w-full rounded-lg border border-ink900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                      />
                      {erreursPaiement.montant && (
                        <p className="text-xs text-danger mt-1">{erreursPaiement.montant}</p>
                      )}
                    </div>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="w-full rounded-lg border border-ink900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                    >
                      {MODES_PAIEMENT.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Référence (optionnel)"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full rounded-lg border border-ink900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" variant="boutique" className="flex-1 text-sm">Confirmer</Button>
                      <button
                        type="button"
                        onClick={() => setFormPaiementOuvert(false)}
                        className="text-sm text-ink900/50 px-2"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          {vente.paiements?.length > 0 && (
            <div className="bg-surface rounded-xl border border-ink900/10 p-5">
              <h2 className="font-display font-semibold text-ink900 mb-3 text-sm">Historique</h2>
              <div>
                {vente.paiements.map((p, i) => (
                  <div key={p.id}>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-ink900/60">{formatDate(p.created_at)}</span>
                      <span className="font-mono text-ink900">{formatMontant(p.montant)}</span>
                    </div>
                    {i < vente.paiements.length - 1 && <TearLine className="text-ink900/10" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
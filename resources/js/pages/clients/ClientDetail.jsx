import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatMontant, formatDate } from '../../lib/format';
import { lienRelanceWhatsapp } from '../../lib/whatsapp';

const LABELS_MODE = {
  especes: 'Espèces',
  mobile_money: 'Mobile Money',
  virement: 'Virement',
  cheque: 'Chèque',
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState('');
  const [onglet, setOnglet] = useState('ventes');
  const [factureEnCours, setFactureEnCours] = useState(null);

  const boutiqueNom = user?.boutique?.nom || user?.boutiques_gerees?.[0]?.nom || 'notre boutique';

  useEffect(() => {
    api.get(`/clients/${id}`)
      .then(({ data }) => setDonnees(data))
      .catch(() => setErreur("Impossible de charger ce client."));
  }, [id]);

  /**
   * Même mécanisme que VenteDetail.jsx/VentesListe.jsx : fetch authentifié via
   * l'instance axios (pas de navigation <a href> directe, dont le comportement
   * dépend d'en-têtes comme Referer que Sanctum utilise pour reconnaître une
   * requête "stateful" — cf. le bug déjà rencontré sur les autres écrans).
   */
  const imprimerFacture = async (venteId) => {
    setFactureEnCours(venteId);
    try {
      const { data } = await api.get(`/ventes/${venteId}/facture`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
      setErreur(
        error?.response?.status === 401
          ? 'Session expirée, reconnectez-vous.'
          : 'Impossible de générer la facture.'
      );
    } finally {
      setFactureEnCours(null);
    }
  };

  if (erreur && !donnees) {
    return (
      <AppShell title="Client">
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3">{erreur}</p>
      </AppShell>
    );
  }

  if (!donnees) {
    return (
      <AppShell title="Client">
        <p className="text-ink900/40">Chargement…</p>
      </AppShell>
    );
  }

  const { client, total_achete, total_paye, ventes, paiements } = donnees;
  const aDette = Number(client.dette) > 0;
  const lienWhatsapp = aDette ? lienRelanceWhatsapp(client, boutiqueNom) : null;

  return (
    <AppShell title={client.nom}>
      <button onClick={() => navigate('/clients')} className="text-sm text-indigo-700 hover:underline mb-4">
        ← Retour aux clients
      </button>

      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-4">{erreur}</p>
      )}

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-ink900/10">
            <span className="h-14 w-14 rounded-xl bg-indigo-700/10 text-indigo-700 font-display font-semibold text-xl flex items-center justify-center shrink-0">
              {client.nom.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="font-display font-semibold text-ink900">{client.nom}</p>
              <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                aDette ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
              }`}>
                {aDette ? 'Dette impayée' : 'À jour'}
              </span>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink900/40 mb-0.5">Téléphone</dt>
              <dd className="text-ink900">{client.telephone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink900/40 mb-0.5">Adresse</dt>
              <dd className="text-ink900">{client.adresse || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink900/40 mb-0.5">Client depuis</dt>
              <dd className="text-ink900">{formatDate(client.created_at)}</dd>
            </div>
          </dl>

          {lienWhatsapp && (
            <a
              href={lienWhatsapp}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-center gap-2 rounded-lg bg-success/10 hover:bg-success/15
                text-success text-sm font-medium py-2.5 mt-4 transition-colors"
            >
              Relancer sur WhatsApp
            </a>
          )}

          <Link
            to={`/clients/${client.id}/modifier`}
            className="block text-center mt-3 text-sm font-medium text-indigo-700 hover:underline"
          >
            Modifier le profil
          </Link>
        </div>

        <div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-surface rounded-xl border border-ink900/10 p-5">
              <p className="text-sm text-ink900/50 mb-2">Total acheté</p>
              <p className="font-mono text-xl font-semibold text-ink900">{formatMontant(total_achete)}</p>
            </div>
            <div className="bg-surface rounded-xl border border-ink900/10 p-5">
              <p className="text-sm text-ink900/50 mb-2">Total réglé</p>
              <p className="font-mono text-xl font-semibold text-success">{formatMontant(total_paye)}</p>
            </div>
            <div className="bg-surface rounded-xl border border-ink900/10 p-5">
              <p className="text-sm text-ink900/50 mb-2">Reste à payer</p>
              <p className="font-mono text-xl font-semibold text-danger">{formatMontant(client.dette)}</p>
            </div>
          </div>

          <div className="flex gap-1 border-b border-ink900/10">
            <button
              onClick={() => setOnglet('ventes')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                onglet === 'ventes' ? 'border-indigo-700 text-indigo-700' : 'border-transparent text-ink900/50 hover:text-ink900'
              }`}
            >
              Achats & Ventes ({ventes.length})
            </button>
            <button
              onClick={() => setOnglet('paiements')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                onglet === 'paiements' ? 'border-indigo-700 text-indigo-700' : 'border-transparent text-ink900/50 hover:text-ink900'
              }`}
            >
              Paiements ({paiements.length})
            </button>
          </div>
        </div>
      </div>

      {onglet === 'ventes' && (
        <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
          {ventes.length === 0 ? (
            <p className="text-center text-ink900/40 py-10">Aucun achat enregistré.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">N° Vente</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Payé</th>
                  <th className="px-5 py-3 font-medium text-right">Reste</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ventes.map((vente) => {
                  const reste = vente.montant_ttc - vente.montant_paye;
                  return (
                    <tr key={vente.id} className="border-b border-ink900/5 last:border-0">
                      <td className="px-5 py-3.5">
                        <Link to={`/ventes/${vente.id}`} className="font-mono text-indigo-700 hover:underline font-medium">
                          {vente.numero}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-ink900/60">{formatDate(vente.created_at)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-ink900">{formatMontant(vente.montant_ttc)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-success">{formatMontant(vente.montant_paye)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-danger">
                        {reste > 0 ? formatMontant(reste) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {vente.statut === 'annulee' ? <Badge statut="annulee" /> : <Badge statut={vente.statut_paiement} />}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-3 whitespace-nowrap">
                        <Link to={`/ventes/${vente.id}`} className="text-indigo-700 hover:underline font-medium">
                          Voir
                        </Link>
                        <button
                          type="button"
                          onClick={() => imprimerFacture(vente.id)}
                          disabled={factureEnCours === vente.id}
                          className="text-ink900/60 hover:underline font-medium disabled:opacity-50"
                        >
                          {factureEnCours === vente.id ? 'Génération…' : 'Facture'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {onglet === 'paiements' && (
        <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
          {paiements.length === 0 ? (
            <p className="text-center text-ink900/40 py-10">Aucun paiement enregistré.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 font-medium text-right">Montant</th>
                  <th className="px-5 py-3 font-medium">Vente concernée</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map((p) => (
                  <tr key={p.id} className="border-b border-ink900/5 last:border-0">
                    <td className="px-5 py-3.5 text-ink900/60">{formatDate(p.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-ink900/5 text-ink900/70">
                        {LABELS_MODE[p.mode] ?? p.mode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-success font-medium">
                      {formatMontant(p.montant)}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.commande ? (
                        <Link to={`/ventes/${p.commande.id}`} className="text-indigo-700 hover:underline font-mono">
                          {p.commande.numero}
                        </Link>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppShell>
  );
}
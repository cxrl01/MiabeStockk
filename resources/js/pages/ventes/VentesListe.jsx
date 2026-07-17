import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Badge from '../../components/ui/Badge';
import api from '../../services/api';
import { formatMontant, formatDate } from '../../lib/format';

export default function VentesListe() {
  const [ventes, setVentes] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api
      .get('/ventes')
      .then(({ data }) => setVentes(data.data))
      .catch(() => setErreur("Impossible de charger les ventes."));
  }, []);

  const ventesFiltrees = (ventes || []).filter((v) => {
    const terme = recherche.toLowerCase();
    return (
      v.numero.toLowerCase().includes(terme) ||
      (v.client?.nom ?? 'client comptant').toLowerCase().includes(terme)
    );
  });

  const totalVentes = ventes?.length ?? 0;
  const chiffreAffiche = (ventes || [])
    .filter((v) => v.statut === 'validee')
    .reduce((somme, v) => somme + Number(v.montant_ttc), 0);
  const dettesActives = (ventes || []).filter(
    (v) => v.statut === 'validee' && Number(v.montant_paye) < Number(v.montant_ttc)
  ).length;

  return (
    <AppShell title="Ventes">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">
          {erreur}
        </p>
      )}

      {/* Barre d'action */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher vente, client..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />
        <Link
          to="/ventes/nouvelle"
          className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
            text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
        >
          + Nouvelle vente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total ventes</p>
          <p className="font-mono text-2xl font-semibold text-ink900">{totalVentes}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Chiffre affiché</p>
          <p className="font-mono text-2xl font-semibold text-success">{formatMontant(chiffreAffiche)}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Dettes actives</p>
          <p className="font-mono text-2xl font-semibold text-danger">{dettesActives}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-ink900/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Réf</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Client</th>
              <th className="px-5 py-3 font-medium">Articles</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ventesFiltrees.map((vente) => (
              <tr key={vente.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                <td className="px-5 py-3.5 font-mono text-ink900/70">{vente.numero}</td>
                <td className="px-5 py-3.5 text-ink900/60">{formatDate(vente.created_at)}</td>
                <td className="px-5 py-3.5 text-ink900 font-medium">
                  {vente.client?.nom ?? 'Client comptant'}
                </td>
                <td className="px-5 py-3.5 text-ink900/60">
                  {vente.lignes?.length ?? 0} article{(vente.lignes?.length ?? 0) > 1 ? 's' : ''}
                </td>
                <td className="px-5 py-3.5 text-right font-mono font-medium text-ink900">
                  {formatMontant(vente.montant_ttc)}
                </td>
                <td className="px-5 py-3.5">
                  {vente.statut === 'annulee' ? (
                    <Badge statut="annulee" />
                  ) : (
                    <Badge statut={vente.statut_paiement} />
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link to={`/ventes/${vente.id}`} className="text-indigo-700 hover:underline font-medium">
                    Voir
                  </Link>
                </td>
              </tr>
            ))}

            {ventes && ventesFiltrees.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink900/40">
                  Aucune vente pour l'instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
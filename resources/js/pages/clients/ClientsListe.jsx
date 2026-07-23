import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../hooks/useAuth';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';
import { lienRelanceWhatsapp } from '../../lib/whatsapp';

export default function ClientsListe() {
  const { user } = useAuth();
  const { boutiqueActiveId, boutiquesGerees } = useBoutiqueActive();
  const [clients, setClients] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  // Nom de la boutique ACTIVE (pas systematiquement la premiere boutique geree)
  // pour personnaliser le message WhatsApp de relance.
  const boutiqueActiveObjet = boutiquesGerees.find((b) => b.id === boutiqueActiveId);
  const boutiqueNom = user?.boutique?.nom || boutiqueActiveObjet?.nom || 'notre boutique';

  const charger = () => {
    api.get('/clients', { params: { per_page: 100 } })
      .then(({ data }) => setClients(data.data))
      .catch(() => setErreur("Impossible de charger les clients."));
  };

  // Recharge quand la boutique active change (sélecteur multi-points-de-vente).
  useEffect(charger, [boutiqueActiveId]);

  const clientsFiltres = (clients || []).filter((c) =>
    c.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalDettes = (clients || []).reduce((s, c) => s + Number(c.dette), 0);
  const clientsAvecDette = (clients || []).filter((c) => Number(c.dette) > 0).length;

  const supprimer = async (client) => {
    if (!window.confirm(`Supprimer "${client.nom}" ?`)) return;
    try {
      await api.delete(`/clients/${client.id}`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  return (
    <AppShell title="Clients">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher client..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />
        <Link
          to="/clients/nouveau"
          className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
            text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
        >
          + Nouveau client
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total clients</p>
          <p className="font-mono text-2xl font-semibold text-ink900">{clients?.length ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Clients avec dette</p>
          <p className="font-mono text-2xl font-semibold text-danger">{clientsAvecDette}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total dettes</p>
          <p className="font-mono text-2xl font-semibold text-danger">{formatMontant(totalDettes)}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientsFiltres.map((client) => {
          const aDette = Number(client.dette) > 0;
          const lienWhatsapp = aDette ? lienRelanceWhatsapp(client, boutiqueNom) : null;

          return (
            <div
              key={client.id}
              className={`bg-surface rounded-xl border p-5 border-t-2 ${
                aDette ? 'border-t-danger border-ink900/10' : 'border-t-success border-ink900/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-full bg-indigo-700/10 text-indigo-700 font-medium flex items-center justify-center shrink-0">
                    {client.nom.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <Link
                      to={`/clients/${client.id}`}
                      className="font-medium text-ink900 hover:text-indigo-700 hover:underline"
                    >
                      {client.nom}
                    </Link>
                    {client.telephone && <p className="text-xs text-ink900/40">{client.telephone}</p>}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  aDette ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                }`}>
                  {aDette ? 'dette' : 'actif'}
                </span>
              </div>

              {client.adresse && <p className="text-sm text-ink900/50 mb-3">{client.adresse}</p>}

              <div className="flex items-center justify-between pt-3 border-t border-ink900/10 mb-3">
                <div>
                  <p className="text-xs text-ink900/40">Dette</p>
                  <p className={`font-mono font-medium ${aDette ? 'text-danger' : 'text-ink900/60'}`}>
                    {formatMontant(client.dette)}
                  </p>
                </div>
                <div className="space-x-3 text-sm">
                  <Link to={`/clients/${client.id}/modifier`} className="text-indigo-700 hover:underline font-medium">
                    Modifier
                  </Link>
                  <button onClick={() => supprimer(client)} className="text-danger hover:underline font-medium">
                    Suppr.
                  </button>
                </div>
              </div>

              {aDette && (
                lienWhatsapp ? (
                  <a
                    href={lienWhatsapp}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-center gap-2 rounded-lg bg-success/10 hover:bg-success/15
                      text-success text-sm font-medium py-2 transition-colors"
                  >
                    Relancer sur WhatsApp
                  </a>
                ) : (
                  <p className="text-xs text-ink900/35 text-center py-1">Aucun numéro pour relancer</p>
                )
              )}
            </div>
          );
        })}

        {clients && clientsFiltres.length === 0 && (
          <p className="col-span-full text-center text-ink900/40 py-10">Aucun client.</p>
        )}
      </div>
    </AppShell>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import api from '../services/api';
import { formatMontant, formatHeure } from '../lib/format';
import { IconCart, IconWallet, IconUsers, IconAlertTriangle } from '../components/layout/Icons';

/**
 * Ce fichier est aligne EXACTEMENT sur la reponse actuelle de DashboardController::index() :
 * ventes_jour, ca_jour, ca_mois, total_clients, depenses_mois, produits_en_alerte,
 * dernieres_ventes[], alertes_stock[].
 *
 * Consequence : pas de variation en % (le controleur ne les calcule pas encore), pas de
 * detail clients actifs/en alerte (seul total_clients existe), pas d'alertes de dettes
 * (seul alertes_stock existe, pas de fusion stock+dette). Des lors que le controleur sera
 * etendu, on pourra remettre ces elements (voir version precedente pour la cible maquette).
 */

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api
      .get('/rapports/dashboard')
      .then(({ data }) => setD(data))
      .catch(() => setErreur('Impossible de charger le tableau de bord.'));
  }, []);

  return (
    <AppShell title="Dashboard">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">
          {erreur}
        </p>
      )}

      {/* Cartes stats : uniquement les valeurs que le backend fournit reellement */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Ventes"
          sub="Aujourd'hui"
          value={d ? d.ventes_jour : '—'}
          trend={d ? `CA du jour : ${formatMontant(d.ca_jour)}` : ''}
          Icon={IconCart}
          tone="indigo"
        />
        <StatCard
          label="CA du mois"
          sub="Chiffre d'affaires"
          value={d ? formatMontant(d.ca_mois) : '—'}
          Icon={IconWallet}
          tone="success"
        />
        <StatCard
          label="Clients"
          sub="Total enregistrés"
          value={d ? d.total_clients : '—'}
          Icon={IconUsers}
          tone="ochre"
        />
        <StatCard
          label="Dépenses"
          sub="Ce mois"
          value={d ? formatMontant(d.depenses_mois) : '—'}
          trend={d ? `${d.produits_en_alerte} produit(s) en alerte stock` : ''}
          Icon={IconWallet}
          tone="danger"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dernieres ventes */}
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-ink900">Dernières ventes</h2>
              <p className="text-xs text-ink900/40">5 transactions les plus récentes</p>
            </div>
            <Link to="/ventes" className="text-sm font-medium text-indigo-700 hover:underline">
              Voir tout →
            </Link>
          </div>

          {d?.dernieres_ventes?.length ? (
            <div className="divide-y divide-ink900/5">
              {d.dernieres_ventes.map((vente) => {
                const reste = (vente.montant_ttc ?? 0) - (vente.montant_paye ?? 0);
                return (
                  <div key={vente.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-8 w-8 shrink-0 rounded-full bg-indigo-700/10 text-indigo-700 text-xs font-medium flex items-center justify-center">
                        {(vente.client?.nom ?? 'A').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink900 truncate">
                          {vente.client?.nom ?? 'Client comptant'}
                        </p>
                        <p className="text-xs text-ink900/40 font-mono">
                          {vente.numero} · {formatHeure(vente.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm font-semibold text-ink900">
                        {formatMontant(vente.montant_ttc)}
                      </p>
                      {vente.statut === 'annulee' ? (
                        <Badge statut="annulee" />
                      ) : vente.statut_paiement === 'payee' ? (
                        <Badge statut="payee" />
                      ) : (
                        <Badge tone="warning">{formatMontant(reste)} restant</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink900/40 py-6 text-center">
              Les dernières ventes apparaîtront ici dès vos premières transactions.
            </p>
          )}
        </div>

        {/* Alertes stock */}
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-ink900">Alertes stock</h2>
              <p className="text-xs text-ink900/40">Produits sous le seuil critique</p>
            </div>
            <Link to="/stock" className="text-sm font-medium text-indigo-700 hover:underline">
              Voir tout →
            </Link>
          </div>

          {d?.alertes_stock?.length ? (
            <div className="space-y-2">
              {d.alertes_stock.map((produit) => (
                <div key={produit.id} className="flex items-start gap-3 rounded-lg bg-warning/5 px-3.5 py-3">
                  <span className="text-warning shrink-0 mt-0.5">
                    <IconAlertTriangle />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink900">Stock critique — {produit.nom}</p>
                    <p className="text-xs text-ink900/50">
                      Reste {produit.quantite_stock} unité(s) · Seuil : {produit.seuil_alerte}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink900/40 py-6 text-center">Tous les stocks sont suffisants.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
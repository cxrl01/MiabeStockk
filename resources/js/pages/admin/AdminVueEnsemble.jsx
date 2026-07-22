import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { IconBox, IconUsers, IconWallet, IconAlertTriangle } from '../../components/layout/Icons';
import api from '../../services/api';
import { formatMontant, formatDate, formatHeure } from '../../lib/format';

const CARTES_COULEUR = {
  bleu: { bordure: 'border-t-indigo-700', icone: 'bg-indigo-700/10 text-indigo-700' },
  vert: { bordure: 'border-t-success', icone: 'bg-success/10 text-success' },
  rouge: { bordure: 'border-t-danger', icone: 'bg-danger/10 text-danger' },
};

function CarteStat({ label, sous, valeur, Icon, couleur }) {
  const c = CARTES_COULEUR[couleur];
  return (
    <div className={`bg-surface rounded-xl border border-ink900/10 border-t-[3px] ${c.bordure} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink900/50">{label}</p>
          {sous && <p className="text-xs text-ink900/35">{sous}</p>}
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${c.icone}`}>
          <Icon />
        </span>
      </div>
      <p className="font-mono text-2xl font-semibold text-ink900">{valeur}</p>
    </div>
  );
}

export default function AdminVueEnsemble() {
  const [stats, setStats] = useState(null);
  const [boutiques, setBoutiques] = useState([]);
  const [activites, setActivites] = useState([]);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get('/admin/statistiques').then(({ data }) => setStats(data)).catch(() => setErreur('Impossible de charger les statistiques.'));
    api.get('/boutiques').then(({ data }) => setBoutiques(data)).catch(() => {});
    api.get('/admin/journal', { params: { per_page: 5 } }).then(({ data }) => setActivites(data.data)).catch(() => {});
  }, []);

  const boutiquesParCa = [...boutiques].sort((a, b) => Number(b.ca_total ?? 0) - Number(a.ca_total ?? 0));

  return (
    <AppShell title="Vue d'ensemble">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CarteStat
          label="Boutiques actives"
          sous={stats ? `sur ${stats.total_boutiques} inscrites` : ''}
          valeur={stats?.boutiques_actives ?? '—'}
          Icon={IconBox}
          couleur="bleu"
        />
        <CarteStat
          label="Utilisateurs totaux"
          sous="comptes actifs"
          valeur={stats?.total_utilisateurs ?? '—'}
          Icon={IconUsers}
          couleur="bleu"
        />
        <CarteStat
          label="CA cumulé"
          sous="toutes boutiques"
          valeur={stats ? formatMontant(stats.chiffre_affaires_cumule) : '—'}
          Icon={IconWallet}
          couleur="vert"
        />
        <CarteStat
          label="Boutiques suspendues"
          sous="nécessitent attention"
          valeur={stats?.boutiques_suspendues ?? '—'}
          Icon={IconAlertTriangle}
          couleur="rouge"
        />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink900">Performance des boutiques</h2>
            <Link to="/admin/boutiques" className="text-sm font-medium text-indigo-700 hover:underline">
              Voir toutes →
            </Link>
          </div>

          {boutiquesParCa.length ? (
            <div className="space-y-1">
              {boutiquesParCa.slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-ink900/5 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-8 w-8 shrink-0 rounded-full bg-indigo-700/10 text-indigo-700 text-xs font-medium flex items-center justify-center">
                      {b.nom.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink900 truncate">{b.nom}</p>
                      <p className="text-xs text-ink900/40">{b.staff_count ?? 0} utilisateur{(b.staff_count ?? 0) > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold text-ink900">{formatMontant(b.ca_total ?? 0)}</p>
                    <span className={`text-xs font-medium ${b.statut === 'active' ? 'text-success' : 'text-danger'}`}>
                      {b.statut === 'active' ? 'Active' : 'Suspendue'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink900/40 py-6 text-center">Aucune boutique.</p>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink900 text-sm">Activité récente</h2>
            <Link to="/admin/journal" className="text-sm font-medium text-indigo-700 hover:underline">
              Tout voir
            </Link>
          </div>

          {activites.length ? (
            <div className="space-y-3">
              {activites.map((a) => (
                <div key={a.id} className="text-sm">
                  <p className="text-ink900 font-medium font-mono text-xs">{a.action}</p>
                  <p className="text-xs text-ink900/40">
                    {a.boutique?.nom ?? 'Plateforme'} · {formatDate(a.created_at)} {formatHeure(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink900/40 py-6 text-center">Aucune activité récente.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
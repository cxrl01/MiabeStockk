import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { IconChart, IconBan, IconCheck, IconTrash } from '../../components/layout/Icons';
import api from '../../services/api';
import { formatDate, formatHeure } from '../../lib/format';

// Traduit les codes d'action bruts (ex: "boutique.suspendue") en libellés
// lisibles. Fallback : capitalise le dernier segment si l'action n'est pas
// listee ici (autres modules — produits, ventes, clients, etc.).
const LIBELLES_ACTION = {
  'auth.login': 'Connexion',
  'auth.logout': 'Déconnexion',
  'auth.inscription': 'Inscription',
  'boutique.creee': 'Boutique créée',
  'boutique.configuree': 'Boutique modifiée',
  'boutique.suspendue': 'Boutique suspendue',
  'boutique.reactivee': 'Boutique réactivée',
  'boutique.supprimee': 'Boutique supprimée',
};

function libelleAction(action) {
  if (LIBELLES_ACTION[action]) return LIBELLES_ACTION[action];
  const segment = action?.split('.').pop() ?? action;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function CarteStat({ label, valeur, Icon, couleur }) {
  const styles = {
    bleu: { bordure: 'border-t-indigo-700', icone: 'bg-indigo-700/10 text-indigo-700' },
    vert: { bordure: 'border-t-success', icone: 'bg-success/10 text-success' },
    rouge: { bordure: 'border-t-danger', icone: 'bg-danger/10 text-danger' },
  }[couleur];

  return (
    <div className={`bg-surface rounded-xl border border-ink900/10 border-t-[3px] ${styles.bordure} p-5`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink900/50">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${styles.icone}`}>
          <Icon />
        </span>
      </div>
      <p className="font-mono text-2xl font-semibold text-ink900">{valeur}</p>
    </div>
  );
}

export default function AdminJournal() {
  const [entrees, setEntrees] = useState(null);
  const [filtreAction, setFiltreAction] = useState('tout');
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get('/admin/journal', { params: { per_page: 100 } })
      .then(({ data }) => setEntrees(data.data))
      .catch(() => setErreur('Impossible de charger le journal.'));
  }, []);

  const entreesFiltrees = useMemo(() => {
    return (entrees || [])
      .filter((e) => {
        if (filtreAction === 'tout') return true;
        if (filtreAction === 'suspensions') return e.action === 'boutique.suspendue';
        if (filtreAction === 'reactivations') return e.action === 'boutique.reactivee';
        if (filtreAction === 'suppressions') return e.action === 'boutique.supprimee';
        return true;
      })
      .filter((e) => {
        const cible = `${libelleAction(e.action)} ${e.user?.nom ?? ''} ${e.user?.prenom ?? ''} ${e.boutique?.nom ?? ''}`.toLowerCase();
        return cible.includes(recherche.toLowerCase());
      });
  }, [entrees, filtreAction, recherche]);

  const totalSuspensions = (entrees || []).filter((e) => e.action === 'boutique.suspendue').length;
  const totalReactivations = (entrees || []).filter((e) => e.action === 'boutique.reactivee').length;
  const totalSuppressions = (entrees || []).filter((e) => e.action === 'boutique.supprimee').length;

  return (
    <AppShell title="Journal d'activité">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CarteStat label="Total activités" valeur={entrees?.length ?? '—'} Icon={IconChart} couleur="bleu" />
        <CarteStat label="Suspensions" valeur={totalSuspensions} Icon={IconBan} couleur="rouge" />
        <CarteStat label="Réactivations" valeur={totalReactivations} Icon={IconCheck} couleur="vert" />
        <CarteStat label="Suppressions" valeur={totalSuppressions} Icon={IconTrash} couleur="rouge" />
      </div>

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-ink900/10">
          <h2 className="font-display font-semibold text-ink900">Historique des actions</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-lg border border-ink900/15 overflow-hidden text-sm">
              {[
                { valeur: 'tout', label: 'Tout' },
                { valeur: 'suspensions', label: 'Suspensions' },
                { valeur: 'reactivations', label: 'Réactivations' },
                { valeur: 'suppressions', label: 'Suppressions' },
              ].map((f) => (
                <button
                  key={f.valeur}
                  onClick={() => setFiltreAction(f.valeur)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    filtreAction === f.valeur ? 'bg-indigo-700 text-white' : 'text-ink900/60 hover:bg-ink900/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Rechercher…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="rounded-lg border border-ink900/15 bg-white px-3 py-1.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Utilisateur</th>
              <th className="px-5 py-3 font-medium">Boutique</th>
              <th className="px-5 py-3 font-medium">Détail</th>
            </tr>
          </thead>
          <tbody>
            {entreesFiltrees.map((e) => (
              <tr key={e.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                <td className="px-5 py-3.5 text-ink900/60 whitespace-nowrap">
                  {formatDate(e.created_at)} {formatHeure(e.created_at)}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-700/10 text-indigo-700">
                    {libelleAction(e.action)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-ink900/70">
                  {e.user ? `${e.user.nom} ${e.user.prenom ?? ''}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-ink900/60">{e.boutique?.nom ?? '—'}</td>
                <td className="px-5 py-3.5 text-ink900/40 text-xs max-w-xs">
                  {e.donnees?.motif ? `Motif : ${e.donnees.motif}` : (e.donnees?.nom ?? '—')}
                </td>
              </tr>
            ))}

            {entrees && entreesFiltrees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink900/40">Aucune activité enregistrée.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
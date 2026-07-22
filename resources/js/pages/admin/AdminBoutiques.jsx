import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { IconBox, IconCheck, IconAlertTriangle, IconUsers, IconEye, IconBan, IconTrash } from '../../components/layout/Icons';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

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

export default function AdminBoutiques() {
  const navigate = useNavigate();
  const [boutiques, setBoutiques] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('tout');
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');
  const [actionEnCours, setActionEnCours] = useState(null);

  const charger = () => {
    api.get('/boutiques')
      .then(({ data }) => setBoutiques(data))
      .catch(() => setErreur('Impossible de charger les boutiques.'));
  };

  useEffect(charger, []);

  const demanderMotif = (message) => {
    const motif = window.prompt(message);
    if (motif === null) return null;
    if (motif.trim().length < 5) {
      alert('Le motif doit contenir au moins 5 caractères.');
      return undefined;
    }
    return motif.trim();
  };

  const suspendre = async (boutique) => {
    const motif = demanderMotif(`Motif de la suspension de "${boutique.nom}" (envoyé par email au gérant) :`);
    if (motif === null || motif === undefined) return;

    setActionEnCours(boutique.id);
    try {
      await api.post(`/admin/boutiques/${boutique.id}/suspendre`, { motif });
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Action impossible.');
    } finally {
      setActionEnCours(null);
    }
  };

  const reactiver = async (boutique) => {
    if (!window.confirm(`Réactiver "${boutique.nom}" ? Un email sera envoyé au gérant.`)) return;

    setActionEnCours(boutique.id);
    try {
      await api.post(`/admin/boutiques/${boutique.id}/reactiver`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Action impossible.');
    } finally {
      setActionEnCours(null);
    }
  };

  const supprimer = async (boutique) => {
    const motif = demanderMotif(`Motif de suppression définitive de "${boutique.nom}" (envoyé par email au gérant) :`);
    if (motif === null || motif === undefined) return;
    if (!window.confirm(`Confirmer la suppression définitive de "${boutique.nom}" ? Cette action est irréversible.`)) return;

    setActionEnCours(boutique.id);
    try {
      await api.delete(`/admin/boutiques/${boutique.id}`, { data: { motif } });
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    } finally {
      setActionEnCours(null);
    }
  };

  const boutiquesFiltrees = useMemo(() => {
    return (boutiques || [])
      .filter((b) => filtreStatut === 'tout' || b.statut === filtreStatut)
      .filter((b) => b.nom.toLowerCase().includes(recherche.toLowerCase()));
  }, [boutiques, filtreStatut, recherche]);

  const totalActives = (boutiques || []).filter((b) => b.statut === 'active').length;
  const totalSuspendues = (boutiques || []).filter((b) => b.statut === 'suspendue').length;
  const totalUtilisateurs = (boutiques || []).reduce((s, b) => s + (b.staff_count ?? 0), 0);

  return (
    <AppShell title="Boutiques">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CarteStat label="Total boutiques" valeur={boutiques?.length ?? '—'} Icon={IconBox} couleur="bleu" />
        <CarteStat label="Actives" valeur={totalActives} Icon={IconCheck} couleur="vert" />
        <CarteStat label="Suspendues" valeur={totalSuspendues} Icon={IconAlertTriangle} couleur="rouge" />
        <CarteStat label="Utilisateurs totaux" valeur={totalUtilisateurs} Icon={IconUsers} couleur="bleu" />
      </div>

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-ink900/10">
          <h2 className="font-display font-semibold text-ink900">Gestion des boutiques</h2>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-ink900/15 overflow-hidden text-sm">
              {[
                { valeur: 'tout', label: 'Tout' },
                { valeur: 'active', label: 'Actif' },
                { valeur: 'suspendue', label: 'Suspendu' },
              ].map((f) => (
                <button
                  key={f.valeur}
                  onClick={() => setFiltreStatut(f.valeur)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    filtreStatut === f.valeur ? 'bg-indigo-700 text-white' : 'text-ink900/60 hover:bg-ink900/5'
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
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Boutique</th>
              <th className="px-5 py-3 font-medium">Gérant</th>
              <th className="px-5 py-3 font-medium text-right">Utilisateurs</th>
              <th className="px-5 py-3 font-medium text-right">CA total</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boutiquesFiltrees.map((b) => (
              <tr key={b.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                <td className="px-5 py-3.5 font-mono text-ink900/50">B-{String(b.id).padStart(3, '0')}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 shrink-0 rounded-lg bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center">
                      {b.nom.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-ink900 font-medium">{b.nom}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink900/60">
                  {b.gerant ? `${b.gerant.nom} ${b.gerant.prenom ?? ''}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-ink900/70">{b.staff_count ?? 0}</td>
                <td className="px-5 py-3.5 text-right font-mono text-ink900 font-medium">{formatMontant(b.ca_total ?? 0)}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                    b.statut === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  }`}>
                    {b.statut === 'active' ? 'Actif' : 'Suspendu'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2 text-ink900/50">
                    <button onClick={() => navigate(`/admin/boutiques/${b.id}`)} title="Voir" className="hover:text-indigo-700">
                      <IconEye />
                    </button>
                    {b.statut === 'active' ? (
                      <button onClick={() => suspendre(b)} disabled={actionEnCours === b.id} title="Suspendre" className="hover:text-danger disabled:opacity-40">
                        <IconBan />
                      </button>
                    ) : (
                      <button onClick={() => reactiver(b)} disabled={actionEnCours === b.id} title="Réactiver" className="hover:text-success disabled:opacity-40">
                        <IconCheck />
                      </button>
                    )}
                    <button onClick={() => supprimer(b)} disabled={actionEnCours === b.id} title="Supprimer" className="hover:text-danger disabled:opacity-40">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {boutiques && boutiquesFiltrees.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink900/40">Aucune boutique.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
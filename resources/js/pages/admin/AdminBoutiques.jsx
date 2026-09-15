import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { IconBox, IconCheck, IconAlertTriangle, IconUsers, IconEye, IconBan, IconTrash } from '../../components/layout/Icons';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

const TAILLE_PAGE = 10;

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

/**
 * Modale de confirmation générique pour suspendre / réactiver / supprimer une
 * boutique. Remplace window.prompt/window.confirm/alert (qui affichent la
 * bannière "localhost dit" du navigateur) par une UI cohérente avec le reste
 * de l'app. `action.type` pilote le contenu : un motif texte est demandé pour
 * suspendre/supprimer, une simple confirmation suffit pour réactiver.
 */
function ModaleConfirmation({ action, motif, onMotifChange, erreur, enCours, onAnnuler, onConfirmer }) {
  if (!action) return null;

  const config = {
    suspendre: {
      titre: `Suspendre "${action.boutique.nom}"`,
      description: 'Un email sera envoyé au gérant avec le motif ci-dessous.',
      demanderMotif: true,
      libelleBouton: 'Suspendre',
      styleBouton: 'bg-danger hover:bg-danger/90 text-white',
    },
    reactiver: {
      titre: `Réactiver "${action.boutique.nom}"`,
      description: 'Un email sera envoyé au gérant pour l\u2019informer de la réactivation.',
      demanderMotif: false,
      libelleBouton: 'Réactiver',
      styleBouton: 'bg-success hover:bg-success/90 text-white',
    },
    supprimer: {
      titre: `Supprimer définitivement "${action.boutique.nom}"`,
      description: 'Cette action est irréversible. Un email sera envoyé au gérant avec le motif ci-dessous.',
      demanderMotif: true,
      libelleBouton: 'Supprimer définitivement',
      styleBouton: 'bg-danger hover:bg-danger/90 text-white',
    },
  }[action.type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink900/40 px-4"
      onClick={onAnnuler}
    >
      <div
        className="w-full max-w-md rounded-xl bg-surface border border-ink900/10 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-semibold text-ink900 text-lg mb-1.5">{config.titre}</h3>
        <p className="text-sm text-ink900/60 mb-4">{config.description}</p>

        {config.demanderMotif && (
          <textarea
            autoFocus
            rows={3}
            placeholder="Motif (5 caractères minimum)…"
            value={motif}
            onChange={(e) => onMotifChange(e.target.value)}
            className="w-full rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm resize-none
              placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          />
        )}

        {erreur && <p className="text-sm text-danger mt-2">{erreur}</p>}

        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onAnnuler}
            disabled={enCours}
            className="text-sm font-medium text-ink900/60 hover:text-ink900 px-3 py-2 disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirmer}
            disabled={enCours}
            className={`text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 ${config.styleBouton}`}
          >
            {enCours ? 'Traitement…' : config.libelleBouton}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBoutiques() {
  const navigate = useNavigate();
  const [boutiques, setBoutiques] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState('tout');
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');
  const [pageCourante, setPageCourante] = useState(1);

  // Modale de confirmation : { type: 'suspendre'|'reactiver'|'supprimer', boutique }
  const [actionModale, setActionModale] = useState(null);
  const [motif, setMotif] = useState('');
  const [erreurModale, setErreurModale] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = () => {
    api.get('/boutiques')
      .then(({ data }) => setBoutiques(data))
      .catch(() => setErreur('Impossible de charger les boutiques.'));
  };

  useEffect(charger, []);

  const ouvrirModale = (type, boutique) => {
    setActionModale({ type, boutique });
    setMotif('');
    setErreurModale('');
  };

  const fermerModale = () => {
    if (envoiEnCours) return;
    setActionModale(null);
    setMotif('');
    setErreurModale('');
  };

  const confirmerAction = async () => {
    if (!actionModale) return;
    const { type, boutique } = actionModale;
    const motifRequis = type === 'suspendre' || type === 'supprimer';

    if (motifRequis && motif.trim().length < 5) {
      setErreurModale('Le motif doit contenir au moins 5 caractères.');
      return;
    }

    setEnvoiEnCours(true);
    setErreurModale('');
    try {
      if (type === 'suspendre') {
        await api.post(`/admin/boutiques/${boutique.id}/suspendre`, { motif: motif.trim() });
      } else if (type === 'reactiver') {
        await api.post(`/admin/boutiques/${boutique.id}/reactiver`);
      } else if (type === 'supprimer') {
        await api.delete(`/admin/boutiques/${boutique.id}`, { data: { motif: motif.trim() } });
      }
      setActionModale(null);
      setMotif('');
      charger();
    } catch (error) {
      setErreurModale(error?.response?.data?.message || 'Action impossible.');
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const boutiquesFiltrees = useMemo(() => {
    return (boutiques || [])
      .filter((b) => filtreStatut === 'tout' || b.statut === filtreStatut)
      .filter((b) => b.nom.toLowerCase().includes(recherche.toLowerCase()));
  }, [boutiques, filtreStatut, recherche]);

  // Revenir à la page 1 dès que le filtre ou la recherche change la liste,
  // sinon on peut se retrouver sur une page vide (ex: page 3 alors que le
  // nouveau filtre ne donne plus que 1 page de résultats).
  useEffect(() => {
    setPageCourante(1);
  }, [filtreStatut, recherche]);

  const totalPages = Math.max(1, Math.ceil(boutiquesFiltrees.length / TAILLE_PAGE));

  const boutiquesPage = useMemo(() => {
    const debut = (pageCourante - 1) * TAILLE_PAGE;
    return boutiquesFiltrees.slice(debut, debut + TAILLE_PAGE);
  }, [boutiquesFiltrees, pageCourante]);

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
              className="rounded-lg border border-ink900/15 bg-surface px-3 py-1.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Boutique</th>
                <th className="px-5 py-3 font-medium">Gérant</th>
                <th className="px-5 py-3 font-medium text-right">Utilisateurs</th>
                {/* <th className="px-5 py-3 font-medium text-right">CA total</th> */}
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {boutiquesPage.map((b) => (
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
                  {/* <td className="px-5 py-3.5 text-right font-mono text-ink900 font-medium">{formatMontant(b.ca_total ?? 0)}</td> */}
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
                        <button onClick={() => ouvrirModale('suspendre', b)} title="Suspendre" className="hover:text-danger">
                          <IconBan />
                        </button>
                      ) : (
                        <button onClick={() => ouvrirModale('reactiver', b)} title="Réactiver" className="hover:text-success">
                          <IconCheck />
                        </button>
                      )}
                      <button onClick={() => ouvrirModale('supprimer', b)} title="Supprimer" className="hover:text-danger">
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

        {boutiquesFiltrees.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-ink900/10 text-sm text-ink900/60">
            <p>
              {boutiquesFiltrees.length} boutique{boutiquesFiltrees.length > 1 ? 's' : ''} · page {pageCourante} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageCourante((p) => Math.max(1, p - 1))}
                disabled={pageCourante === 1}
                className="rounded-lg border border-ink900/15 px-3 py-1.5 font-medium hover:bg-ink900/5 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPageCourante((p) => Math.min(totalPages, p + 1))}
                disabled={pageCourante === totalPages}
                className="rounded-lg border border-ink900/15 px-3 py-1.5 font-medium hover:bg-ink900/5 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <ModaleConfirmation
        action={actionModale}
        motif={motif}
        onMotifChange={setMotif}
        erreur={erreurModale}
        enCours={envoiEnCours}
        onAnnuler={fermerModale}
        onConfirmer={confirmerAction}
      />
    </AppShell>
  );
}
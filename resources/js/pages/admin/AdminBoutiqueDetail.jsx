import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { IconBox, IconUser, IconWallet, IconUsers } from '../../components/layout/Icons';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

function ChampLecture({ label, valeur }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink900/50 mb-1">{label}</p>
      <p className="text-sm text-ink900">{valeur || <span className="text-ink900/30">—</span>}</p>
    </div>
  );
}

export default function AdminBoutiqueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boutique, setBoutique] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.get(`/boutiques/${id}`)
      .then(({ data }) => setBoutique(data))
      .catch(() => setErreur("Impossible de charger cette boutique."));
  }, [id]);

  return (
    <AppShell title={boutique?.nom || 'Boutique'}>
      <button
        onClick={() => navigate('/admin/boutiques')}
        className="text-sm text-indigo-700 hover:underline mb-5 inline-block"
      >
        ← Retour à la liste des boutiques
      </button>

      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      {!boutique && !erreur && <p className="text-ink900/50">Chargement…</p>}

      {boutique && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-surface rounded-2xl border border-ink900/10 p-6">
            <div className="flex items-center gap-4 mb-5">
              <span className="h-12 w-12 shrink-0 rounded-xl bg-indigo-700 text-white font-semibold flex items-center justify-center">
                <IconBox />
              </span>
              <div>
                <h1 className="font-display font-semibold text-xl text-ink900">{boutique.nom}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                  boutique.statut === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  {boutique.statut === 'active' ? 'Active' : 'Suspendue'}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <ChampLecture label="Adresse" valeur={boutique.adresse} />
              <ChampLecture label="Téléphone" valeur={boutique.telephone} />
              <ChampLecture label="Devise" valeur={boutique.devise} />
              <ChampLecture label="TVA" valeur={boutique.tva != null ? `${boutique.tva}%` : null} />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-ink900/10 p-6">
            <h2 className="font-display font-semibold text-ink900 mb-4 flex items-center gap-2">
              <IconUser /> Gérant
            </h2>
            {boutique.gerant ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <ChampLecture label="Nom complet" valeur={`${boutique.gerant.nom} ${boutique.gerant.prenom ?? ''}`} />
                <ChampLecture label="Email" valeur={boutique.gerant.email} />
              </div>
            ) : (
              <p className="text-sm text-ink900/40">Aucun gérant rattaché.</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl border border-ink900/10 p-6">
              <p className="text-xs font-medium text-ink900/50 mb-2 flex items-center gap-2"><IconUsers /> Utilisateurs</p>
              <p className="font-mono text-2xl font-semibold text-ink900">{boutique.staff_count ?? 0}</p>
            </div>
            <div className="bg-surface rounded-2xl border border-ink900/10 p-6">
              <p className="text-xs font-medium text-ink900/50 mb-2 flex items-center gap-2"><IconWallet /> Chiffre d'affaires</p>
              <p className="font-mono text-2xl font-semibold text-ink900">{formatMontant(boutique.ca_total ?? 0)}</p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
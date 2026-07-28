import { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import api from '../../services/api';

export default function CategoriesListe() {
  const { user } = useAuth();
  const { boutiqueActiveId } = useBoutiqueActive();
  const [categories, setCategories] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [categorieEnEdition, setCategorieEnEdition] = useState(null); // null = création
  const [nom, setNom] = useState('');
  const [erreurForm, setErreurForm] = useState('');
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);

  const peutGererStock = ['gerant', 'gestionnaire'].includes(user?.role?.nom);

  const charger = () => {
    api.get('/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => setErreur('Impossible de charger les catégories.'));
  };

  useEffect(charger, [boutiqueActiveId]);

  const categoriesFiltrees = (categories || []).filter((c) =>
    c.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const ouvrirCreation = () => {
    setCategorieEnEdition(null);
    setNom('');
    setErreurForm('');
    setModaleOuverte(true);
  };

  const ouvrirEdition = (categorie) => {
    setCategorieEnEdition(categorie);
    setNom(categorie.nom);
    setErreurForm('');
    setModaleOuverte(true);
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setEnregistrementEnCours(true);
    setErreurForm('');
    try {
      if (categorieEnEdition) {
        await api.put(`/categories/${categorieEnEdition.id}`, { nom });
      } else {
        await api.post('/categories', { nom });
      }
      setModaleOuverte(false);
      charger();
    } catch (error) {
      setErreurForm(error?.response?.data?.message || "Échec de l'enregistrement.");
    } finally {
      setEnregistrementEnCours(false);
    }
  };

  const supprimer = async (categorie) => {
    if (!window.confirm(`Supprimer la catégorie "${categorie.nom}" ?`)) return;
    try {
      await api.delete(`/categories/${categorie.id}`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  return (
    <AppShell title="Catégories">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher une catégorie..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />

        {peutGererStock && (
          <button
            type="button"
            onClick={ouvrirCreation}
            className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
              text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
          >
            + Ajouter catégorie
          </button>
        )}
      </div>

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Nom</th>
              <th className="px-5 py-3 font-medium text-right">Produits</th>
              {peutGererStock && <th className="px-5 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {categoriesFiltrees.map((c) => (
              <tr key={c.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                <td className="px-5 py-3.5 text-ink900 font-medium">{c.nom}</td>
                <td className="px-5 py-3.5 text-right font-mono text-ink900/60">{c.produits_count ?? 0}</td>
                {peutGererStock && (
                  <td className="px-5 py-3.5 text-right space-x-3">
                    <button onClick={() => ouvrirEdition(c)} className="text-indigo-700 hover:underline font-medium">
                      Modifier
                    </button>
                    <button onClick={() => supprimer(c)} className="text-danger hover:underline font-medium">
                      Supprimer
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {categories && categoriesFiltrees.length === 0 && (
              <tr>
                <td colSpan={peutGererStock ? 3 : 2} className="px-5 py-10 text-center text-ink900/40">
                  Aucune catégorie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modaleOuverte && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={soumettre} className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-sm w-full">
            <h3 className="font-display font-semibold text-ink900 mb-4">
              {categorieEnEdition ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h3>

            {erreurForm && (
              <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 mb-4">
                {erreurForm}
              </p>
            )}

            <label className="block text-sm text-ink900/60 mb-1.5">Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm mb-5
                focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModaleOuverte(false)}
                className="flex-1 rounded-lg border border-ink900/15 text-ink900/70 hover:bg-ink900/5
                  text-sm font-medium px-4 py-2.5 transition-colors"
              >
                Annuler
              </button>
              <Button
                type="submit"
                variant="boutique"
                disabled={enregistrementEnCours}
                className="flex-1 justify-center"
              >
                {enregistrementEnCours ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
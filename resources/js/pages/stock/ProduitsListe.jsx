import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { formatMontant } from '../../lib/format';

export default function ProduitsListe() {
  const { user } = useAuth();
  const [produits, setProduits] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');

  const inputFichierRef = useRef(null);
  const [importEnCours, setImportEnCours] = useState(false);
  const [resultatImport, setResultatImport] = useState(null);
  const [telechargementModele, setTelechargementModele] = useState(false);

  // Tableau 6 du mémoire : "Ajouter/Modifier/Supprimer produit" = Gérant + Gestionnaire
  // uniquement. Le Commercial a "Consulter stock" (lecture seule).
  const peutGererStock = ['gerant', 'gestionnaire'].includes(user?.role?.nom);

  const charger = () => {
    api.get('/produits', { params: { per_page: 100 } })
      .then(({ data }) => setProduits(data.data))
      .catch(() => setErreur("Impossible de charger les produits."));
  };

  useEffect(charger, []);

  const produitsFiltres = (produits || []).filter((p) => {
    const terme = recherche.toLowerCase();
    return p.nom.toLowerCase().includes(terme) || (p.reference ?? '').toLowerCase().includes(terme);
  });

  const alertes = (produits || []).filter((p) => p.quantite_stock <= p.seuil_alerte).length;
  const valeurStock = (produits || []).reduce((s, p) => s + p.quantite_stock * Number(p.prix_achat), 0);

  const supprimer = async (produit) => {
    if (!window.confirm(`Supprimer "${produit.nom}" ?`)) return;
    try {
      await api.delete(`/produits/${produit.id}`);
      charger();
    } catch (error) {
      alert(error?.response?.data?.message || 'Suppression impossible.');
    }
  };

  /**
   * Téléchargement du modèle Excel — même mécanisme que les factures PDF
   * (blob via l'instance Axios authentifiée, pas de <a href> direct, pour
   * éviter le souci de Referer/cookie déjà rencontré sur ces écrans).
   */
  const telechargerModele = async () => {
    setTelechargementModele(true);
    try {
      const { data } = await api.get('/produits/modele-import', { responseType: 'blob' });
      const url = URL.createObjectURL(
        new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      );
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = 'modele-import-produits.xlsx';
      lien.click();
      URL.revokeObjectURL(url);
    } catch {
      setErreur('Impossible de télécharger le modèle.');
    } finally {
      setTelechargementModele(false);
    }
  };

  const declencherSelectionFichier = () => {
    inputFichierRef.current?.click();
  };

  const importerFichier = async (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    setImportEnCours(true);
    setErreur('');
    const formData = new FormData();
    formData.append('fichier', fichier);

    try {
      const { data } = await api.post('/produits/importer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResultatImport(data);
      charger();
    } catch (error) {
      setErreur(error?.response?.data?.message || "Échec de l'import. Vérifiez le format du fichier.");
    } finally {
      setImportEnCours(false);
      e.target.value = ''; // permet de réimporter le même fichier si besoin
    }
  };

  return (
    <AppShell title="Stock">
      {erreur && (
        <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-4 py-3 mb-6">{erreur}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Rechercher produit, référence..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 rounded-lg border border-ink900/15 bg-surface px-3.5 py-2.5 text-sm
            placeholder:text-ink900/35 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
        />

        {peutGererStock && (
          <>
            <input
              ref={inputFichierRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={importerFichier}
              className="hidden"
            />
            <button
              type="button"
              onClick={declencherSelectionFichier}
              disabled={importEnCours}
              className="inline-flex items-center justify-center rounded-lg border border-ink900/15
                text-ink900/70 hover:bg-ink900/5 text-sm font-medium px-4 py-2.5 transition-colors
                whitespace-nowrap disabled:opacity-50"
            >
              {importEnCours ? 'Import en cours…' : 'Importer depuis Excel'}
            </button>
            <Link
              to="/stock/nouveau"
              className="inline-flex items-center justify-center rounded-lg bg-ochre-500 hover:bg-ochre-600
                text-white text-sm font-medium px-4 py-2.5 transition-colors whitespace-nowrap"
            >
              + Ajouter produit
            </Link>
          </>
        )}
      </div>

      {peutGererStock && (
        <button
          type="button"
          onClick={telechargerModele}
          disabled={telechargementModele}
          className="text-sm text-indigo-700 hover:underline mb-6 disabled:opacity-50"
        >
          {telechargementModele ? 'Préparation…' : 'Télécharger le modèle Excel'}
        </button>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Total produits</p>
          <p className="font-mono text-2xl font-semibold text-ink900">{produits?.length ?? '—'}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Alertes stock</p>
          <p className="font-mono text-2xl font-semibold text-danger">{alertes}</p>
        </div>
        <div className="bg-surface rounded-xl border border-ink900/10 p-5">
          <p className="text-sm text-ink900/50 mb-2">Valeur stock estimée</p>
          <p className="font-mono text-2xl font-semibold text-success">{formatMontant(valeurStock)}</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-ink900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink900/10 text-left text-ink900/40 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Produit</th>
              <th className="px-5 py-3 font-medium">Catégorie</th>
              <th className="px-5 py-3 font-medium text-right">Qté</th>
              <th className="px-5 py-3 font-medium text-right">Seuil</th>
              <th className="px-5 py-3 font-medium text-right">Prix vente</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              {peutGererStock && <th className="px-5 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {produitsFiltres.map((p) => {
              const enAlerte = p.quantite_stock <= p.seuil_alerte;
              return (
                <tr key={p.id} className="border-b border-ink900/5 last:border-0 hover:bg-ink900/[0.02]">
                  <td className="px-5 py-3.5">
                    <p className="text-ink900 font-medium">{p.nom}</p>
                    {p.reference && <p className="text-xs text-ink900/40 font-mono">{p.reference}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-ink900/60">{p.categorie?.nom ?? '—'}</td>
                  <td className={`px-5 py-3.5 text-right font-mono ${enAlerte ? 'text-danger font-semibold' : 'text-ink900'}`}>
                    {p.quantite_stock}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink900/40">{p.seuil_alerte}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-ink900">{formatMontant(p.prix_vente)}</td>
                  <td className="px-5 py-3.5">
                    {enAlerte ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-danger/10 text-danger">
                        Bas
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-success/10 text-success">
                        OK
                      </span>
                    )}
                  </td>
                  {peutGererStock && (
                    <td className="px-5 py-3.5 text-right space-x-3">
                      <Link to={`/stock/${p.id}/modifier`} className="text-indigo-700 hover:underline font-medium">
                        Modifier
                      </Link>
                      <button onClick={() => supprimer(p)} className="text-danger hover:underline font-medium">
                        Supprimer
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}

            {produits && produitsFiltres.length === 0 && (
              <tr>
                <td colSpan={peutGererStock ? 7 : 6} className="px-5 py-10 text-center text-ink900/40">Aucun produit.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Résultat de l'import */}
      {resultatImport && (
        <div className="fixed inset-0 bg-ink900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-ink900/10 p-6 max-w-md w-full">
            <h3 className="font-display font-semibold text-ink900 mb-1">Import terminé</h3>
            <p className="text-sm text-success mb-4">
              {resultatImport.nombre_importes} produit{resultatImport.nombre_importes > 1 ? 's' : ''} importé
              {resultatImport.nombre_importes > 1 ? 's' : ''} avec succès.
            </p>

            {resultatImport.erreurs?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-danger mb-2">
                  {resultatImport.erreurs.length} ligne{resultatImport.erreurs.length > 1 ? 's' : ''} en erreur :
                </p>
                <ul className="text-xs text-ink900/60 space-y-1 max-h-40 overflow-y-auto bg-danger/5 rounded-lg p-3">
                  {resultatImport.erreurs.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button variant="boutique" className="w-full justify-center" onClick={() => setResultatImport(null)}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
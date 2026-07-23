import { createContext, useCallback, useEffect, useState } from 'react';

export const BoutiqueActiveContext = createContext(null);

const CLE_STORAGE = 'boutiqueActiveId';

/**
 * Contexte de la "boutique active" pour un Gerant multi-points-de-vente.
 * Imbrique a l'interieur d'AuthProvider (voir AuthContext.jsx) plutot qu'au
 * point d'entree de l'app : evite de devoir localiser/modifier ce fichier,
 * et garantit que ce contexte est toujours synchronise avec `user`.
 */
export function BoutiqueActiveProvider({ user, children }) {
  const boutiquesGerees = user?.boutiques_gerees ?? [];
  const estGerantMulti = user?.role?.nom === 'gerant' && boutiquesGerees.length > 1;

  const [boutiqueActiveId, setBoutiqueActiveIdState] = useState(null);

  // Recalcule/valide la boutique active a chaque changement d'utilisateur
  // (login, logout, refresh de /auth/me) — evite de rester bloque sur une
  // boutique qui n'appartient plus (ou plus) a l'utilisateur courant.
  useEffect(() => {
    if (!user || boutiquesGerees.length === 0) {
      setBoutiqueActiveIdState(null);
      return;
    }

    const stockee = localStorage.getItem(CLE_STORAGE);
    const stockeeValide = stockee && boutiquesGerees.some((b) => String(b.id) === stockee);
    const idInitial = stockeeValide ? Number(stockee) : boutiquesGerees[0].id;

    setBoutiqueActiveIdState(idInitial);
    localStorage.setItem(CLE_STORAGE, String(idInitial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, boutiquesGerees.map((b) => b.id).join(',')]);

  const setBoutiqueActiveId = useCallback((id) => {
    setBoutiqueActiveIdState(id);
    localStorage.setItem(CLE_STORAGE, String(id));
  }, []);

  return (
    <BoutiqueActiveContext.Provider
      value={{ boutiqueActiveId, setBoutiqueActiveId, boutiquesGerees, estGerantMulti }}
    >
      {children}
    </BoutiqueActiveContext.Provider>
  );
}
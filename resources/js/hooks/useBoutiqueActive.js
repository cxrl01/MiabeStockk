import { useContext } from 'react';
import { BoutiqueActiveContext } from '../context/BoutiqueActiveContext';

export function useBoutiqueActive() {
  const contexte = useContext(BoutiqueActiveContext);
  if (!contexte) {
    throw new Error('useBoutiqueActive doit être utilisé à l\'intérieur de <AuthProvider>.');
  }
  return contexte;
}
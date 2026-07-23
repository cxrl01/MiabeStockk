import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { Accept: 'application/json' },
});

// Sanctum SPA : avant tout login/register, il faut récupérer le cookie
// CSRF sur le domaine racine (pas /api/v1) pour que Laravel accepte
// ensuite les requêtes POST protégées.
export async function initCsrf() {
  await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
}

api.defaults.withCredentials = true;

// Ajoute la boutique active (choisie par un Gerant multi-points-de-vente,
// voir BoutiqueActiveContext) a chaque requete sortante. Lu depuis
// localStorage plutot que le contexte React, car ce fichier est hors de
// l'arbre de composants et ne peut pas utiliser useContext.
api.interceptors.request.use((config) => {
  const boutiqueId = localStorage.getItem('boutiqueActiveId');
  if (boutiqueId) {
    config.headers['X-Boutique-Id'] = boutiqueId;
  }
  return config;
});

// Normalise les erreurs de validation Laravel (422) pour un usage direct
// dans les formulaires : { champ: 'message' }.
export function extraireErreursValidation(error) {
  const erreurs = error?.response?.data?.errors;
  if (!erreurs) return {};

  return Object.fromEntries(
    Object.entries(erreurs).map(([champ, messages]) => [champ, messages[0]])
  );
}

export default api;
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
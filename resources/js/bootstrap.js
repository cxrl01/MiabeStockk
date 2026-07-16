import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// Indispensable pour Sanctum SPA : envoie le cookie de session sur chaque requête.
window.axios.defaults.withCredentials = true;
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Bloque l'accès aux routes internes tant que la session n'est pas
 * confirmée, et redirige vers /connexion si aucun utilisateur n'est
 * authentifié. rolesAutorises permet de restreindre une route à
 * certains rôles (ex: Super Admin uniquement).
 */
export default function ProtectedRoute({ children, rolesAutorises = null }) {
  const { user, chargementInitial } = useAuth();

  if (chargementInitial) {
    return <div className="p-10 text-ink900/50">Chargement…</div>;
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (rolesAutorises && !rolesAutorises.includes(user.role?.nom)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
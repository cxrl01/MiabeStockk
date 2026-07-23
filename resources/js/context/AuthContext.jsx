import { createContext, useEffect, useState } from 'react';
import api, { initCsrf } from '../services/api';
import { BoutiqueActiveProvider } from './BoutiqueActiveContext';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Au premier chargement, on vérifie si une session existe déjà
  // (cookie encore valide) pour éviter de renvoyer un utilisateur
  // connecté vers l'écran de login.
  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setChargementInitial(false));
  }, []);

  const login = async (identifiants) => {
    await initCsrf();
    const { data } = await api.post('/auth/login', identifiants);
    setUser(data.user);
    return data.user;
  };

  const register = async (donnees) => {
    await initCsrf();
    const { data } = await api.post('/auth/register', donnees);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, chargementInitial, login, register, logout }}>
      <BoutiqueActiveProvider user={user}>
        {children}
      </BoutiqueActiveProvider>
    </AuthContext.Provider>
  );
}
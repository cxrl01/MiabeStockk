import { createContext, useEffect, useRef, useState } from 'react';
import api, { initCsrf } from '../services/api';
import { BoutiqueActiveProvider } from './BoutiqueActiveContext';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Empêche la vérification initiale (/auth/me au montage) d'écraser
  // un login/register qui aurait eu lieu entre-temps : si l'utilisateur
  // se connecte avant que cette requête initiale ait répondu, sa réponse
  // (potentiellement un 401 obsolète) ne doit plus être appliquée.
  const dejaAuthentifieViaLogin = useRef(false);

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!dejaAuthentifieViaLogin.current) {
          setUser(data);
        }
      })
      .catch(() => {
        if (!dejaAuthentifieViaLogin.current) {
          setUser(null);
        }
      })
      .finally(() => setChargementInitial(false));
  }, []);

  const login = async (identifiants) => {
    await initCsrf();
    const { data } = await api.post('/auth/login', identifiants);
    dejaAuthentifieViaLogin.current = true;
    setUser(data.user);
    return data.user;
  };

  const register = async (donnees) => {
    await initCsrf();
    const { data } = await api.post('/auth/register', donnees);
    dejaAuthentifieViaLogin.current = true;
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    dejaAuthentifieViaLogin.current = false;
    setUser(null);
  };

  // Recharge l'utilisateur courant depuis le serveur (ex : après modification
  // d'une boutique gérée, pour que boutiques_gerees reflète la nouvelle TVA
  // partout où elle est utilisée via BoutiqueActiveContext).
  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, chargementInitial, login, register, logout, refreshUser }}
    >
      <BoutiqueActiveProvider user={user}>
        {children}
      </BoutiqueActiveProvider>
    </AuthContext.Provider>
  );
}
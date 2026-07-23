import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import { IconMenu, IconSun, IconMoon, IconLogout, IconBox } from './Icons';

export default function Topbar({ title, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { boutiqueActiveId, setBoutiqueActiveId, boutiquesGerees, estGerantMulti } = useBoutiqueActive();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuRef = useRef(null);

  const aujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    const fermerSiExterieur = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(false);
    };
    document.addEventListener('mousedown', fermerSiExterieur);
    return () => document.removeEventListener('mousedown', fermerSiExterieur);
  }, []);

  const seDeconnecter = async () => {
    await logout();
    navigate('/connexion');
  };

  const initiales = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-ink900/10 bg-paper/90 backdrop-blur px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden lg:flex text-ink900/50 hover:text-ink900 transition-colors"
          aria-label="Afficher/Masquer le menu"
        >
          <IconMenu />
        </button>

        <div>
          <h1 className="font-display text-lg font-semibold text-ink900">{title}</h1>
          <p className="text-xs text-ink900/40 capitalize">
            Accueil / <span className="text-ink900/60">{title}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {estGerantMulti && (
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-ink900/15 bg-white px-2.5 py-1.5">
            <span className="text-ink900/40">
              <IconBox />
            </span>
            <select
              value={boutiqueActiveId ?? ''}
              onChange={(e) => setBoutiqueActiveId(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-ink900 focus:outline-none cursor-pointer"
              aria-label="Boutique active"
            >
              {boutiquesGerees.map((b) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          </div>
        )}

        <span className="hidden sm:block font-mono text-xs text-ink900/40 capitalize">{aujourdhui}</span>

        <button
          type="button"
          onClick={toggleTheme}
          className="text-ink900/50 hover:text-ink900 transition-colors"
          aria-label="Changer le thème"
        >
          {theme === 'light' ? <IconMoon /> : <IconSun />}
        </button>

        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOuvert((v) => !v)} className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-full bg-indigo-700 text-paper text-sm font-medium flex items-center justify-center">
              {initiales || '?'}
            </span>
          </button>

          {menuOuvert && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-ink900/10 bg-surface shadow-lg py-1.5">
              <div className="px-3.5 py-2 border-b border-ink900/10">
                <p className="text-sm font-medium text-ink900 truncate">{user?.prenom} {user?.nom}</p>
                <p className="text-xs text-ink900/50 capitalize">{user?.role?.libelle}</p>
              </div>
              <button
                type="button"
                onClick={seDeconnecter}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
              >
                <IconLogout />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
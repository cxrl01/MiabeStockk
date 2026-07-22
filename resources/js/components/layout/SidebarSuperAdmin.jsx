import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IconDashboard, IconBox, IconChart, IconUser, IconLogout } from './Icons';

/**
 * Sidebar dediee au Super Admin. Contrairement a Sidebar.jsx (espace boutique),
 * pas de filtrage par role a faire ici : si ce composant est monte, c'est deja
 * que l'utilisateur est super_admin (AppShell.jsx choisit le bon composant).
 * Tableau 6 du memoire : Super Admin n'a que Boutiques + Journal d'activite +
 * statistiques globales (Vue d'ensemble) — pas de gestion d'utilisateurs, pas
 * de parametres plateforme (hors perimetre du cahier des charges).
 */
export default function SidebarSuperAdmin({ collapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const nomComplet = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Super Admin';
  const initiales = `${user?.prenom?.charAt(0) ?? ''}${user?.nom?.charAt(0) ?? ''}`.toUpperCase() || 'SA';

  const handleDeconnexion = async () => {
    await logout();
    navigate('/connexion');
  };

  const NAV = [
    { to: '/admin', label: "Vue d'ensemble", Icon: IconDashboard },
    { to: '/admin/boutiques', label: 'Boutiques', Icon: IconBox },
    { to: '/admin/journal', label: "Journal d'activité", Icon: IconChart },
  ];

  const renderLien = ({ to, label, Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/admin'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-indigo-700/8 text-indigo-700'
            : 'text-ink900/60 hover:bg-ink900/5 hover:text-ink900'
        }`
      }
    >
      <Icon />
      {!collapsed && label}
    </NavLink>
  );

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-ink900/10 bg-surface h-screen sticky top-0 transition-[width] duration-200 ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-ink900 text-paper font-display font-semibold flex items-center justify-center">
          SA
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink900 text-sm truncate">MiabéStock</p>
            <p className="text-xs text-ink900/40">Super Administration</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink900/35">
            Administration
          </p>
        )}
        {NAV.map(renderLien)}

        <div className="pt-3 mt-3 border-t border-ink900/10 space-y-0.5">
          {renderLien({ to: '/profil', label: 'Profil', Icon: IconUser })}

          <button
            onClick={handleDeconnexion}
            title={collapsed ? 'Déconnexion' : undefined}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-ink900/60 hover:bg-ink900/5 hover:text-ink900 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <IconLogout />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </nav>

      <div className="border-t border-ink900/10 px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-ink900 text-paper font-display font-semibold text-sm flex items-center justify-center">
          {initiales}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink900 text-sm truncate">{nomComplet}</p>
            <p className="text-xs text-ink900/40">Super Admin</p>
          </div>
        )}
      </div>
    </aside>
  );
}
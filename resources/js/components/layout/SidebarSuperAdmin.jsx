import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { IconDashboard, IconBox, IconChart, IconUser, IconLogout } from './Icons';

export default function SidebarSuperAdmin({ collapsed, mobileOpen, onCloseMobile }) {
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
      onClick={onCloseMobile}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-700/8 text-indigo-700'
            : 'text-ink900/60 hover:bg-ink900/5 hover:text-ink900'
        }`
      }
    >
      <Icon />
      <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
    </NavLink>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col shrink-0 border-r border-ink900/10 bg-surface h-screen w-64
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:sticky lg:top-0 lg:translate-x-0 lg:transition-[width]
          ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}
        `}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-ink900 text-paper font-display font-semibold flex items-center justify-center">
            SA
          </div>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="font-display font-semibold text-ink900 text-sm truncate">MiabéStock</p>
            <p className="text-xs text-ink900/40">Super Administration</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <p className={`px-3 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink900/35 ${collapsed ? 'lg:hidden' : ''}`}>
            Administration
          </p>
          {NAV.map(renderLien)}

          <div className="pt-3 mt-3 border-t border-ink900/10 space-y-0.5">
            {renderLien({ to: '/profil', label: 'Profil', Icon: IconUser })}

            <button
              onClick={handleDeconnexion}
              title={collapsed ? 'Déconnexion' : undefined}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-ink900/60 hover:bg-ink900/5 hover:text-ink900"
            >
              <IconLogout />
              <span className={collapsed ? 'lg:hidden' : ''}>Déconnexion</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-ink900/10 px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-ink900 text-paper font-display font-semibold text-sm flex items-center justify-center">
            {initiales}
          </div>
          <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}>
            <p className="font-display font-semibold text-ink900 text-sm truncate">{nomComplet}</p>
            <p className="text-xs text-ink900/40">Super Admin</p>
          </div>
        </div>
      </aside>
    </>
  );
}
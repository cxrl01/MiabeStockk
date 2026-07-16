import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  IconDashboard, IconCart, IconBox, IconUsers, IconTruck, IconChart,
  IconWallet, IconUser, IconGear, IconLogout,
} from './Icons';

export default function Sidebar({ collapsed, stockAlertesCount, ventesAlertesCount }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role?.nom;
  const estGerant = role === 'gerant';
  const estGestionnaire = role === 'gestionnaire';
  const estCommercial = role === 'commercial';

  const boutiqueNom = user?.boutique?.nom || user?.boutiques_gerees?.[0]?.nom || 'Ma boutique';
  const nomComplet = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Utilisateur';
  const initiales = `${user?.prenom?.charAt(0) ?? ''}${user?.nom?.charAt(0) ?? ''}`.toUpperCase() || 'U';
  const posteAffiche = user?.poste || (estGerant ? 'Gérant' : estGestionnaire ? 'Gestionnaire' : 'Commercial');

  const handleDeconnexion = async () => {
    await logout();
    navigate('/connexion');
  };

  const NAV_PRINCIPAL = [
    { to: '/dashboard', label: 'Dashboard', Icon: IconDashboard, visible: true },
    { to: '/ventes', label: 'Ventes & Produits', Icon: IconCart, visible: true, badge: ventesAlertesCount },
    { to: '/stock', label: 'Stocks', Icon: IconBox, visible: true, badge: stockAlertesCount },
    { to: '/clients', label: 'Clients', Icon: IconUsers, visible: estGerant || estCommercial },
    { to: '/fournisseurs', label: 'Fournisseurs', Icon: IconTruck, visible: estGerant || estGestionnaire },
    { to: '/equipe', label: 'Équipe', Icon: IconUsers, visible: estGerant },
  ];

  const NAV_ANALYSE = [
    { to: '/rapports', label: 'Rapports & Stats', Icon: IconChart, visible: true },
    { to: '/depenses', label: 'Dépenses & Trésorerie', Icon: IconWallet, visible: estGerant || estGestionnaire },
  ];

  const NAV_COMPTE = [
    { to: '/administration', label: 'Administration', Icon: IconGear, visible: estGerant },
    { to: '/profil', label: 'Profil', Icon: IconUser, visible: true },
  ];

  const renderLien = ({ to, label, Icon, badge }) => (
    <NavLink
      key={to}
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          collapsed ? 'justify-center' : 'justify-between'
        } ${
          isActive
            ? 'bg-indigo-700/8 text-indigo-700'
            : 'text-ink900/60 hover:bg-ink900/5 hover:text-ink900'
        }`
      }
    >
      <span className="flex items-center gap-3">
        <Icon />
        {!collapsed && label}
      </span>
      {!collapsed && !!badge && (
        <span className="flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-paper text-[11px] font-semibold">
          {badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-ink900/10 bg-surface h-screen sticky top-0 transition-[width] duration-200 ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-700 text-paper font-display font-semibold flex items-center justify-center">
          {boutiqueNom.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink900 text-sm truncate">{boutiqueNom}</p>
            <p className="text-xs text-ink900/40">Gestion commerciale</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink900/35">
            Menu principal
          </p>
        )}
        {NAV_PRINCIPAL.filter((item) => item.visible).map(renderLien)}

        <div className="pt-3 mt-3 border-t border-ink900/10 space-y-0.5">
          {NAV_ANALYSE.filter((item) => item.visible).map(renderLien)}
        </div>

        <div className="pt-3 mt-3 border-t border-ink900/10 space-y-0.5">
          {NAV_COMPTE.filter((item) => item.visible).map(renderLien)}

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
        <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-700 text-paper font-display font-semibold text-sm flex items-center justify-center">
          {initiales}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink900 text-sm truncate">{nomComplet}</p>
            <p className="text-xs text-ink900/40">{posteAffiche}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
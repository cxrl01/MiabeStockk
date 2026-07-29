import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import {
  IconDashboard, IconCart, IconBox, IconUsers, IconTruck, IconChart,
  IconWallet, IconUser, IconGear, IconLogout,
} from './Icons';

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, stockAlertesCount, ventesAlertesCount }) {
  const { user, logout } = useAuth();
  const { boutiqueActiveId, boutiquesGerees, estGerantMulti } = useBoutiqueActive();
  const navigate = useNavigate();

  const role = user?.role?.nom;
  const estGerant = role === 'gerant';
  const estGestionnaire = role === 'gestionnaire';
  const estCommercial = role === 'commercial';

  const boutiqueActive = estGerantMulti
    ? boutiquesGerees?.find((b) => b.id === boutiqueActiveId)
    : null;

  const boutiqueCourante = boutiqueActive || user?.boutique || user?.boutiques_gerees?.[0] || null;
  const boutiqueNom = boutiqueCourante?.nom || 'Ma boutique';
  const boutiqueLogoUrl = boutiqueCourante?.logo_url || null;
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
    { to: '/rapports', label: 'Rapports & Stats', Icon: IconChart, visible: estGerant },
    { to: '/depenses', label: 'Dépenses & Trésorerie', Icon: IconWallet, visible: estGerant || estGestionnaire },
  ];

  const NAV_COMPTE = [
    { to: '/administration', label: 'Administration', Icon: IconGear, visible: estGerant },
    { to: '/profil', label: 'Profil', Icon: IconUser, visible: true },
  ];

  // Sur mobile le panneau est toujours en mode "étendu" (jamais collapsed
  // à la Android, ça n'a pas de sens sur un écran déjà étroit)
  const collapsedEffectif = collapsed;

  const renderLien = ({ to, label, Icon, badge }) => (
    <NavLink
      key={to}
      to={to}
      onClick={onCloseMobile}
      title={collapsedEffectif ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors justify-between lg:${
          collapsedEffectif ? 'justify-center' : 'justify-between'
        } ${
          isActive
            ? 'bg-indigo-700/8 text-indigo-700'
            : 'text-ink900/60 hover:bg-ink900/5 hover:text-ink900'
        }`
      }
    >
      <span className="flex items-center gap-3">
        <Icon />
        <span className={collapsedEffectif ? 'lg:hidden' : ''}>{label}</span>
      </span>
      {!!badge && (
        <span className={`flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-paper text-[11px] font-semibold ${collapsedEffectif ? 'lg:hidden' : ''}`}>
          {badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Overlay mobile : ferme le panneau au clic à l'extérieur */}
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
          ${collapsedEffectif ? 'lg:w-[76px]' : 'lg:w-64'}
        `}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-indigo-700 text-paper font-display font-semibold flex items-center justify-center overflow-hidden">
            {boutiqueLogoUrl ? (
              <img src={boutiqueLogoUrl} alt={boutiqueNom} className="h-full w-full object-cover" />
            ) : (
              boutiqueNom.charAt(0).toUpperCase()
            )}
          </div>
          <div className={`min-w-0 ${collapsedEffectif ? 'lg:hidden' : ''}`}>
            <p className="font-display font-semibold text-ink900 text-sm truncate">{boutiqueNom}</p>
            <p className="text-xs text-ink900/40">Gestion commerciale</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <p className={`px-3 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink900/35 ${collapsedEffectif ? 'lg:hidden' : ''}`}>
            Menu principal
          </p>
          {NAV_PRINCIPAL.filter((item) => item.visible).map(renderLien)}

          <div className="pt-3 mt-3 border-t border-ink900/10 space-y-0.5">
            {NAV_ANALYSE.filter((item) => item.visible).map(renderLien)}
          </div>

          <div className="pt-3 mt-3 border-t border-ink900/10 space-y-0.5">
            {NAV_COMPTE.filter((item) => item.visible).map(renderLien)}

            <button
              onClick={handleDeconnexion}
              title={collapsedEffectif ? 'Déconnexion' : undefined}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-ink900/60 hover:bg-ink900/5 hover:text-ink900 ${collapsedEffectif ? 'lg:justify-center' : ''}`}
            >
              <IconLogout />
              <span className={collapsedEffectif ? 'lg:hidden' : ''}>Déconnexion</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-ink900/10 px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-700 text-paper font-display font-semibold text-sm flex items-center justify-center">
            {initiales}
          </div>
          <div className={`min-w-0 ${collapsedEffectif ? 'lg:hidden' : ''}`}>
            <p className="font-display font-semibold text-ink900 text-sm truncate">{nomComplet}</p>
            <p className="text-xs text-ink900/40">{posteAffiche}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
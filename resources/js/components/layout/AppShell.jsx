import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SidebarSuperAdmin from './SidebarSuperAdmin';
import Topbar from './Topbar';
import { useAuth } from '../../hooks/useAuth';
import { useBoutiqueActive } from '../../hooks/useBoutiqueActive';
import api from '../../services/api';

export default function AppShell({ title, children }) {
  const { user } = useAuth();
  const { boutiqueActiveId } = useBoutiqueActive();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertes, setAlertes] = useState({ stock: 0, ventes: 0 });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  // Ferme le panneau mobile automatiquement si on repasse en desktop
  useEffect(() => {
    const fermerSiDesktop = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', fermerSiDesktop);
    return () => window.removeEventListener('resize', fermerSiDesktop);
  }, []);

  useEffect(() => {
    if (user?.role?.nom === 'super_admin') return;

    api.get('/produits/alertes')
      .then(({ data }) => setAlertes((a) => ({ ...a, stock: data.length })))
      .catch(() => {});

    api.get('/ventes', { params: { statut_paiement: 'non_payee,partielle', per_page: 1 } })
      .then(({ data }) => setAlertes((a) => ({ ...a, ventes: data.total ?? 0 })))
      .catch(() => {});
  }, [user?.role?.nom, boutiqueActiveId]);

  const estSuperAdmin = user?.role?.nom === 'super_admin';

  return (
    <div className="flex min-h-screen bg-paper">
      {estSuperAdmin ? (
        <SidebarSuperAdmin
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      ) : (
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          stockAlertesCount={alertes.stock}
          ventesAlertesCount={alertes.ventes}
        />
      )}
      <div className="flex-1 min-w-0">
        <Topbar
          title={title}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onToggleMobileSidebar={() => setMobileOpen((v) => !v)}
        />
        <main className="px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
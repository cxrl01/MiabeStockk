import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SidebarSuperAdmin from './SidebarSuperAdmin';
import Topbar from './Topbar';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function AppShell({ title, children }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [alertes, setAlertes] = useState({ stock: 0, ventes: 0 });

  const isSuperAdmin = user?.role?.nom === 'super_admin';

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    // Les alertes stock/ventes n'ont de sens que pour les rôles boutique.
    // On évite l'appel pour le super_admin (dashboard global différent).
    if (isSuperAdmin) return;

    api
      .get('/rapports/dashboard')
      .then(({ data }) => {
        setAlertes({ stock: data.produits_en_alerte ?? 0, ventes: data.ventes_impayees ?? 0 });
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  const SidebarComponent = isSuperAdmin ? SidebarSuperAdmin : Sidebar;

  return (
    <div className="flex min-h-screen bg-paper">
      <SidebarComponent
        collapsed={collapsed}
        stockAlertesCount={alertes.stock}
        ventesAlertesCount={alertes.ventes}
      />
      <div className="flex-1 min-w-0">
        <Topbar title={title} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
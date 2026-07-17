import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import api from '../../services/api';

export default function AppShell({ title, children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [alertes, setAlertes] = useState({ stock: 0, ventes: 0 });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    api
      .get('/rapports/dashboard')
      .then(({ data }) => {
        setAlertes({ stock: data.produits_en_alerte ?? 0, ventes: data.ventes_impayees ?? 0 });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar
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
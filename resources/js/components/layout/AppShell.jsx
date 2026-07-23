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
  const [alertes, setAlertes] = useState({ stock: 0, ventes: 0 });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  /**
   * Badges de la sidebar : doivent suivre la boutique ACTIVE (comme les
   * écrans /stock et /ventes vers lesquels ils pointent), pas l'agrégat
   * consolidé de /rapports/dashboard (volontairement toutes-boutiques,
   * cf. Dashboard.jsx). Utilise donc /produits/alertes (deja scope via
   * ResolveBoutiqueActive) et /ventes?statut_paiement=... (meme mecanisme)
   * plutot que le dashboard.
   *
   * Pas de fetch pour le Super Admin : il n'a pas de boutique active, ces
   * badges n'ont pas de sens pour lui (sa sidebar est SidebarSuperAdmin,
   * qui n'affiche de toute facon pas ces liens).
   */
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
        <SidebarSuperAdmin collapsed={collapsed} />
      ) : (
        <Sidebar
          collapsed={collapsed}
          stockAlertesCount={alertes.stock}
          ventesAlertesCount={alertes.ventes}
        />
      )}
      <div className="flex-1 min-w-0">
        <Topbar title={title} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
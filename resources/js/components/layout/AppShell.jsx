import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ title, children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
  }, [collapsed]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 min-w-0">
        <Topbar title={title} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import Dashboard from '../pages/Dashboard';
import PageAVenir from '../components/layout/PageAVenir';
import ProtectedRoute from './ProtectedRoute';
import ResetPassword from '../pages/auth/ResetPassword';
import Profil from '../pages/Profil';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
      <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
      <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>}/>

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/ventes" element={<ProtectedRoute><PageAVenir title="Ventes" /></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><PageAVenir title="Stock" /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><PageAVenir title="Clients" /></ProtectedRoute>} />
      <Route path="/fournisseurs" element={<ProtectedRoute><PageAVenir title="Fournisseurs" /></ProtectedRoute>} />
      <Route path="/equipe" element={<ProtectedRoute><PageAVenir title="Équipe" /></ProtectedRoute>} />
      <Route path="/depenses" element={<ProtectedRoute><PageAVenir title="Dépenses" /></ProtectedRoute>} />
      <Route path="/rapports" element={<ProtectedRoute><PageAVenir title="Rapports" /></ProtectedRoute>} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute rolesAutorises={['super_admin']}>
            <div className="p-10">Dashboard Super Admin (à venir)</div>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
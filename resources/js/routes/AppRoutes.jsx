import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Dashboard from '../pages/Dashboard';
import Profil from '../pages/Profil';
import VentesListe from '../pages/ventes/VentesListe';
import NouvelleVente from '../pages/ventes/NouvelleVente';
import VenteDetail from '../pages/ventes/VenteDetail';
import ProduitsListe from '../pages/stock/ProduitsListe';
import ProduitForm from '../pages/stock/ProduitForm';
import ClientsListe from '../pages/clients/ClientsListe';
import ClientForm from '../pages/clients/ClientForm';
import ClientDetail from '../pages/clients/ClientDetail';
import FournisseursListe from '../pages/fournisseurs/FournisseursListe';
import FournisseurForm from '../pages/fournisseurs/FournisseurForm';
import NouvelleLivraison from '../pages/fournisseurs/NouvelleLivraison';
import EquipeListe from '../pages/equipe/EquipeListe';
import EmployeForm from '../pages/equipe/EmployeForm';
import DepensesListe from '../pages/depenses/DepensesListe';
import DepenseForm from '../pages/depenses/DepenseForm';
import RapportsStats from '../pages/rapports/RapportsStats';
import PageAVenir from '../components/layout/PageAVenir';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
      <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
      <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/ventes" element={<ProtectedRoute><VentesListe /></ProtectedRoute>} />
      <Route
        path="/ventes/nouvelle"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'commercial']}>
            <NouvelleVente />
          </ProtectedRoute>
        }
      />
      <Route path="/ventes/:id" element={<ProtectedRoute><VenteDetail /></ProtectedRoute>} />

      <Route path="/stock" element={<ProtectedRoute><ProduitsListe /></ProtectedRoute>} />
      <Route
        path="/stock/nouveau"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <ProduitForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock/:id/modifier"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <ProduitForm />
          </ProtectedRoute>
        }
      />

      <Route path="/clients" element={<ProtectedRoute><ClientsListe /></ProtectedRoute>} />
      <Route path="/clients/nouveau" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
      <Route path="/clients/:id/modifier" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />

      <Route path="/fournisseurs" element={<ProtectedRoute><FournisseursListe /></ProtectedRoute>} />
      <Route
        path="/fournisseurs/nouveau"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <FournisseurForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fournisseurs/:id/modifier"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <FournisseurForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fournisseurs/livraison-nouvelle"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <NouvelleLivraison />
          </ProtectedRoute>
        }
      />

      <Route
        path="/equipe"
        element={
          <ProtectedRoute rolesAutorises={['gerant']}>
            <EquipeListe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipe/nouveau"
        element={
          <ProtectedRoute rolesAutorises={['gerant']}>
            <EmployeForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipe/:id/modifier"
        element={
          <ProtectedRoute rolesAutorises={['gerant']}>
            <EmployeForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/depenses"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <DepensesListe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depenses/nouvelle"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <DepenseForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depenses/:id/modifier"
        element={
          <ProtectedRoute rolesAutorises={['gerant', 'gestionnaire']}>
            <DepenseForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rapports"
        element={
          <ProtectedRoute rolesAutorises={['gerant']}>
            <RapportsStats />
          </ProtectedRoute>
        }
      />

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
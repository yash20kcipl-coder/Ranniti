import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { Routes, Route, Navigate } from 'react-router-dom';

// Modular Page Imports
import {
  VotersPage,
  VoterDetailPage,
  VoterFormPage
} from '@/pages/voters';
import {
  ReligionsPage,
  CastesPage,
  DistrictsPage,
  PcsPage,
  AcsPage,
  PartiesPage,
  BoothsPage,
  OrganizationsPage,
} from '@/pages/master';
import LoginPage from '@/pages/login';

// Layouts & Guards
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export const AppRoutes: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return (
    <Routes>
      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Protected Layout Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="voters" element={<VotersPage />} />
          <Route path="voters/new" element={<VoterFormPage />} />
          <Route path="voters/:id" element={<VoterDetailPage />} />
          <Route path="voters/:id/edit" element={<VoterFormPage />} />
          <Route path="master" element={<Navigate to="/dashboard/master/religions" replace />} />
          <Route path="master/religions" element={<ReligionsPage />} />
          <Route path="master/castes" element={<CastesPage />} />
          <Route path="master/districts" element={<DistrictsPage />} />
          <Route path="master/pcs" element={<PcsPage />} />
          <Route path="master/acs" element={<AcsPage />} />
          <Route path="master/parties" element={<PartiesPage />} />
          <Route path="master/booths" element={<BoothsPage />} />
          <Route path="master/organizations" element={<OrganizationsPage />} />
          <Route path="StateAssembly/*" element={<Navigate to="/dashboard/master/acs" replace />} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
};

export default AppRoutes;


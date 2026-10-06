import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  /** Whitelist of role values allowed. Omit to allow any authenticated user. */
  allowedRoles?: string[];
}

/**
 * Two website user types:
 *  - Super Admin:  role === 'super_admin' | 'admin'
 *  - Tenant:       role === 'tenant_admin'
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);


  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to voter directory — safe landing page for both user types
      return <Navigate to="/dashboard/voters" replace />;
    }
  }

  return <Outlet />;
};

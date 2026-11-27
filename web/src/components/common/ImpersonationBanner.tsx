import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeftCircle, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { exitTenantImpersonation } from '@/redux/actions/tenant';

export const ImpersonationBanner: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  const isImpersonating =
    Boolean(localStorage.getItem('super_admin_impersonator_token')) ||
    Boolean(user?.isImpersonated);

  if (!isImpersonating) {
    return null;
  }

  const handleExit = async () => {
    setIsExiting(true);
    try {
      await dispatch(exitTenantImpersonation());
      navigate('/dashboard/tenants');
    } catch {
      // Handled by Redux errorHandler
    } finally {
      setIsExiting(false);
    }
  };

  const displayName = user?.organizationName || user?.name || 'Tenant Account';

  return (
    <div
      role="alert"
      className="sticky top-0 z-40 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 shadow-md flex items-center justify-between text-xs font-medium border-b border-amber-500/30 backdrop-blur-sm select-none"
    >
      <div className="flex items-center gap-2.5 truncate pr-2">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
        <ShieldAlert size={16} className="text-amber-200 shrink-0" />
        <span className="truncate">
          Super Admin Mode &mdash; Currently logged into{' '}
          <strong className="font-bold underline decoration-amber-300 underline-offset-2">
            {displayName}
          </strong>{' '}
          as Tenant Administrator
        </span>
      </div>

      <button
        type="button"
        onClick={handleExit}
        disabled={isExiting}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-amber-50 active:scale-95 text-amber-900 font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isExiting ? (
          <Loader2 size={13} className="animate-spin text-amber-700" />
        ) : (
          <ArrowLeftCircle size={14} className="text-amber-700" />
        )}
        <span>{isExiting ? 'Returning...' : 'Return to Super Admin'}</span>
      </button>
    </div>
  );
};

export default ImpersonationBanner;

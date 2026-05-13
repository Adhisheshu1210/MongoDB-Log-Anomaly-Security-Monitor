import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  normalizeRole,
  getRoleHomePage
} from '../utils/permissions';

const useRBAC = () => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  return useMemo(() => ({
    role,
    homePage: getRoleHomePage(role),
    can: (permission) => hasPermission(role, permission),
    canAny: (permissions) => hasAnyPermission(role, permissions),
    canAll: (permissions) => hasAllPermissions(role, permissions)
  }), [role]);
};

export default useRBAC;

import React from 'react';
import useRBAC from '../../hooks/useRBAC';

const PermissionGate = ({
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
  children
}) => {
  const { can, canAny, canAll } = useRBAC();

  if (permission && !can(permission)) return fallback;
  if (Array.isArray(anyPermissions) && anyPermissions.length && !canAny(anyPermissions)) return fallback;
  if (Array.isArray(allPermissions) && allPermissions.length && !canAll(allPermissions)) return fallback;

  return children;
};

export default PermissionGate;

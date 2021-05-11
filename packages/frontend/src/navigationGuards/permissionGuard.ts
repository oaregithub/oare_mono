import { Route, NavigationGuardNext } from 'vue-router';
import { PermissionName } from '@oare/types';
import sl from '@/serviceLocator';

const permissionGuard = (permission: PermissionName) => (
  _to: Route,
  _from: Route,
  next: NavigationGuardNext
) => {
  const store = sl.get('store');

  const userPermissions = store.getters.permissions.map(perm => perm.name);
  if (userPermissions.includes(permission)) {
    next();
  } else {
    next('/');
  }
};

export default permissionGuard;

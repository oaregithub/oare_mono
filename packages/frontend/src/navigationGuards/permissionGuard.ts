import { Route, NavigationGuardNext } from 'vue-router';
import { PermissionName } from '@oare/types';
import sl from '@/serviceLocator';

const permissionGuard = (permission: PermissionName) => (
  _to: Route,
  _from: Route,
  next: NavigationGuardNext
) => {
  const store = sl.get('store');

  if (store.hasPermission(permission)) {
    next();
  } else {
    next('/403');
  }
};

export default permissionGuard;

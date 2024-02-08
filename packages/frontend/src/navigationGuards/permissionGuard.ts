import { Route, NavigationGuardNext } from 'vue-router';
import { PermissionName } from '@oare/types';
import sl from '@/serviceLocator';

/**
 * Redirects the user to the 403 page if they do not have the required permission for the route.
 * @param permission The permission required for the route.
 */
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

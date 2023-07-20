import { Route, NavigationGuardNext } from 'vue-router';
import { PermissionName } from '@oare/types';
import sl from '@/serviceLocator';

/**
 * Navigation guard that checks if the user has a required permission.
 * It allows the user to continue if they have the required permission, otherwise it redirects them to the 403 Forbidden page.
 * @param permission The permission to check.
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

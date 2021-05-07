import { Route, NavigationGuardNext } from 'vue-router';
import { PermissionName } from '@oare/types';
import guardRoute from '@/navigationGuards/guardRoute';
import sl from '@/serviceLocator';

const permissionGuard = (permission: PermissionName) => (
  _to: Route,
  _from: Route,
  next: NavigationGuardNext
) => {
  const store = sl.get('store');

  const navigate = () => {
    const userPermissions = store.getters.permissions.map(perm => perm.name);
    if (userPermissions.includes(permission)) {
      next();
    } else {
      next('/');
    }
  };

  guardRoute(navigate);
};

export default permissionGuard;

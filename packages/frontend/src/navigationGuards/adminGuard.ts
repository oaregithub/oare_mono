import { NavigationGuard } from 'vue-router';
import sl from '@/serviceLocator';

/**
 * Redirects the user to the 403 page if they are not an admin.
 */
const adminGuard: NavigationGuard = (_to, _from, next) => {
  const store = sl.get('store');

  if (store.getters.isAdmin) {
    next();
  } else {
    next('/403');
  }
};

export default adminGuard;

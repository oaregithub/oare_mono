import { NavigationGuard } from 'vue-router';
import sl from '@/serviceLocator';

/**
 * Navigation guard that checks if the user is an admin.
 * It allows the user to continue if they are an admin, otherwise it redirects them to the 403 Forbidden page.
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

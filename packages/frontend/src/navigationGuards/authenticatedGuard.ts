import { NavigationGuard } from 'vue-router';
import sl from '@/serviceLocator';

/**
 * Navigation guard that checks if the user is authenticated.
 * It allows the user to continue if they are authenticated, otherwise it redirects them to the 401 Unauthorized page.
 */
const authenticatedGuard: NavigationGuard = (_to, _from, next) => {
  const store = sl.get('store');

  if (store.getters.isAuthenticated) {
    next();
  } else {
    next('/401');
  }
};

export default authenticatedGuard;

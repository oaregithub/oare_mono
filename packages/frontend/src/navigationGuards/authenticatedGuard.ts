import { NavigationGuard } from 'vue-router';
import sl from '@/serviceLocator';

const authenticatedGuard: NavigationGuard = (_to, _from, next) => {
  const store = sl.get('store');

  if (store.getters.isAuthenticated) {
    next();
  } else {
    next('/401');
  }
};

export default authenticatedGuard;

import { NavigationGuard } from 'vue-router';
import sl from '@/serviceLocator';

const adminGuard: NavigationGuard = (_to, _from, next) => {
  const store = sl.get('store');
  if (!store.getters.isAdmin) {
    next('/');
  } else {
    next();
  }
};

export default adminGuard;

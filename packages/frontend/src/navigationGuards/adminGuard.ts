import { NavigationGuard } from 'vue-router';
import guardRoute from '@/navigationGuards/guardRoute';
import sl from '@/serviceLocator';

const adminGuard: NavigationGuard = (_to, _from, next) => {
  const store = sl.get('store');

  const navigate = () => {
    if (!store.getters.isAdmin) {
      next('/');
    } else {
      next();
    }
  };

  guardRoute(navigate);
};

export default adminGuard;

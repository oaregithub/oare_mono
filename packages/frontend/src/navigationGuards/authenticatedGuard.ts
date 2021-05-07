import { NavigationGuard } from 'vue-router';
import guardRoute from '@/navigationGuards/guardRoute';
import sl from '@/serviceLocator';

const authenticatedGuard: NavigationGuard = (_to, _from, next) => {
  const store = sl.get('store');

  const navigate = () => {
    if (!store.getters.isAuthenticated) {
      next('/login');
    } else {
      next();
    }
  };

  guardRoute(navigate);
};

export default authenticatedGuard;

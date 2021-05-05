import sl from '@/serviceLocator';
import EventBus, { ACTIONS } from '@/EventBus';

const guardRoute = (callback: Function) => {
  const store = sl.get('store');
  if (!store.getters.authComplete) {
    EventBus.$on(ACTIONS.REFRESH, callback);
  } else {
    callback();
  }
};

export default guardRoute;

import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import App from './App.vue';
import router from './router';
import store from './store';
import 'vuetify/dist/vuetify.min.css';
import './styles/base.css';
import vuetify from './plugins/vuetify';
import loadBases from './loadBases';
import axiosInstance from './axiosInstance';
import { NavigationGuard, Route, NavigationGuardNext } from 'vue-router';
import i18n from './i18n';
import EventBus, { ACTIONS } from '@/EventBus';
import 'flag-icon-css/css/flag-icon.css';

loadBases();

Vue.use(Vuetify);
Vue.use(VueCompositionApi);
Vue.config.productionTip = false;
Vue.prototype.$axios = axiosInstance;

const guardRoute = (
  routes: string[],
  to: Route,
  callback: Function,
  next: NavigationGuardNext
) => {
  if (to.name && routes.includes(to.name)) {
    if (!store.getters.authComplete) {
      EventBus.$on(ACTIONS.REFRESH, callback);
    } else {
      callback();
    }
  } else {
    next();
  }
};

// Guard admin routes
const adminRoutes = ['admin', 'groups'];
const adminGuard: NavigationGuard = (to, _from, next) => {
  const navigate = () => {
    if (!store.getters.isAdmin) {
      next(false);
    } else {
      next();
    }
  };

  guardRoute(adminRoutes, to, navigate, next);
};

// Non-admin routes where we must first determine auth status before
// navigating to the route
const authFirstRoutes = ['epigraphies', 'dashboardDrafts'];
const authFirstGuard: NavigationGuard = (to, _from, next) => {
  guardRoute(authFirstRoutes, to, next, next);
};

router.beforeEach(authFirstGuard);
router.beforeEach(adminGuard);

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: h => h(App),
}).$mount('#app');

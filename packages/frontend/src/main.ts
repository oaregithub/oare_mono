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
import { NavigationGuard } from 'vue-router';
import i18n from './i18n';
import 'flag-icon-css/css/flag-icon.css';

loadBases();

Vue.use(Vuetify);
Vue.use(VueCompositionApi);
Vue.config.productionTip = false;
Vue.prototype.$axios = axiosInstance;

// Guard admin routes
const adminRoutes = ['admin', 'groups'];
const adminGuard: NavigationGuard = (to, _from, next) => {
  if (to.name && adminRoutes.includes(to.name)) {
    if (!store.getters.isAdmin) {
      next(false);
    } else {
      next();
    }
  } else {
    next();
  }
};

router.beforeEach(adminGuard);

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: (h) => h(App),
}).$mount('#app');

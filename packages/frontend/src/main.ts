import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import serverProxy from '@/serverProxy';
import globalActions from '@/globalActions';
import sl from '@/serviceLocator';
import store from '@/ts-store';
import _ from 'lodash';
import { resetAdminBadge } from '@/utils';
import App from './App.vue';
import router from './router';
import 'vuetify/dist/vuetify.min.css';
import './styles/base.css';
import vuetify from './plugins/vuetify';
import loadBases from './loadBases';
import i18n from './i18n';
import 'flag-icon-css/css/flag-icon.css';
import firebase from './firebase';

sl.set('serverProxy', serverProxy);
sl.set('globalActions', globalActions);
sl.set('store', store);
sl.set('lodash', _);
sl.set('router', router);

loadBases();

Vue.use(Vuetify);
Vue.config.productionTip = false;

let app: Vue;

const setupAdminBadge = async () => {
  await resetAdminBadge();

  setInterval(async () => {
    await resetAdminBadge();
  }, 1000 * 60 * 5);
};

firebase.auth().onIdTokenChanged(async user => {
  const { currentUser } = firebase.auth();
  if (currentUser && user && user.email && user.displayName) {
    const idTokenResult = await currentUser.getIdTokenResult();
    store.setIdToken(idTokenResult.token);

    const [oareUser, permissions] = await Promise.all([
      serverProxy.getUser(currentUser.uid),
      serverProxy.getUserPermissions(),
    ]);
    store.setPermissions(permissions);
    store.setUser(oareUser);
    if (store.getters.isAdmin) {
      await setupAdminBadge();
    }
  }
  if (!app) {
    app = new Vue({
      router,
      vuetify,
      i18n,
      render: h => h(App),
    }).$mount('#app');
  }
});

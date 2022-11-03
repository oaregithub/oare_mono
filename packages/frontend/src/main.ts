import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import server from '@/serverProxy';
import globalActions from '@/globalActions';
import sl from '@/serviceLocator';
import store from '@/ts-store';
import _ from 'lodash';
import { resetAdminBadge } from '@/utils';
import VueGtag from 'vue-gtag';
import App from './App.vue';
import router from './router';
import 'vuetify/dist/vuetify.min.css';
import './styles/base.css';
import vuetify from './plugins/vuetify';
import loadBases from './loadBases';
import i18n from './i18n';
import firebase from './firebase';
import 'vue-inner-image-zoom/lib/vue-inner-image-zoom.css';

sl.set('serverProxy', server);
sl.set('globalActions', globalActions);
sl.set('store', store);
sl.set('lodash', _);
sl.set('router', router);

loadBases();

Vue.use(Vuetify);
if (process.env.NODE_ENV === 'production') {
  Vue.use(
    VueGtag,
    {
      config: { id: process.env.VUE_APP_GOOGLE_ANALYTICS_KEY },
      globalObjectName: 'googleAnalytics',
    },
    router
  );
}
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
    store.setToken(idTokenResult);

    try {
      const [oareUser, permissions] = await Promise.all([
        server.getUser(currentUser.uid),
        server.getUserPermissions(),
      ]);
      store.setPermissions(permissions);
      store.setUser(oareUser);
      if (store.getters.isAdmin) {
        await setupAdminBadge();
      }
    } catch (err) {
      await server.logError({
        description: 'Error initializing site',
        stacktrace: (err as Error).stack || null,
        status: 'New',
      });
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

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

// Instantiates all the singletons and sets them in the service locator at runtime. Should be set alphabetically.
sl.set('globalActions', globalActions);
sl.set('lodash', _);
sl.set('router', router);
sl.set('serverProxy', server);
sl.set('store', store);

// Loads all base OARE Components.
loadBases();

// Initializes Google Analytics if in production mode.
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

// Disables the production tip.
Vue.config.productionTip = false;

// Sets up the Vue app.
let app: Vue;

/**
 * Sets up the admin badge to be reset every 5 minutes.
 */
const setupAdminBadge = async () => {
  await resetAdminBadge();

  setInterval(async () => {
    await resetAdminBadge();
  }, 1000 * 60 * 5);
};

/**
 * Initializes the authenticated user and initializes the Vue app, if not already initialized.
 * This is called whenever the user's authentication state changes.
 */
firebase.auth().onIdTokenChanged(async user => {
  const { currentUser } = firebase.auth();
  // If the user is authenticated, the user's token is set and the user's permissions are fetched.
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

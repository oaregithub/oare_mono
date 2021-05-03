import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import serverProxy from '@/serverProxy';
import globalActions from '@/globalActions';
import sl from '@/serviceLocator';
import store from '@/ts-store';
import _ from 'lodash';
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

router.beforeEach((to, _from, next) => {
  if (to.meta && to.meta.admin && !store.getters.isAdmin) {
    next('/');
  } else if (
    to.meta &&
    to.meta.requiresAuth &&
    !store.getters.isAuthenticated
  ) {
    next('/login');
  } else {
    next();
  }
});

let app: Vue;

firebase.auth().onAuthStateChanged(async user => {
  const { currentUser } = firebase.auth();
  if (currentUser && user && user.email && user.displayName) {
    const idTokenResult = await currentUser.getIdTokenResult();
    const { isAdmin } = idTokenResult.claims;
    const [firstName, lastName] = user.displayName.split(' ');
    const { email, uid: uuid } = user;

    store.setUser({
      firstName,
      lastName,
      email,
      uuid,
      isAdmin,
    });

    store.setIdToken(idTokenResult.token);

    const permissions = await serverProxy.getUserPermissions();
    store.setPermissions(permissions);
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

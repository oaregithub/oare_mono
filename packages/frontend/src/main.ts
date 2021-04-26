import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import serverProxy from '@/serverProxy';
import globalActions from '@/globalActions';
import sl from '@/serviceLocator';
import store from '@/ts-store';
import _ from 'lodash';
import { NavigationGuard, Route, NavigationGuardNext } from 'vue-router';
import EventBus, { ACTIONS } from '@/EventBus';
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
const adminRoutes = [
  'adminGroups',
  'adminTexts',
  'groups',
  'editDictionaryWord',
];
const adminGuard: NavigationGuard = (to, _from, next) => {
  const navigate = () => {
    if (!store.getters.isAdmin) {
      next('/');
    } else {
      next();
    }
  };

  guardRoute(adminRoutes, to, navigate, next);
};

// Non-admin routes where we must first determine auth status before
// navigating to the route
const authFirstRoutes = [
  'epigraphies',
  'dashboardDrafts',
  'words',
  'dashboardProfile',
  'login',
  'collections',
  'collectionTexts',
];
const authFirstGuard: NavigationGuard = (to, _from, next) => {
  guardRoute(authFirstRoutes, to, next, next);
};

router.beforeEach(authFirstGuard);
router.beforeEach(adminGuard);

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

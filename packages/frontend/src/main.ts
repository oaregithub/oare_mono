import 'babel-polyfill';
import Vue from 'vue';
import Vuetify from 'vuetify';
import serverProxy from '@/serverProxy';
import globalActions from '@/globalActions';
import sl from '@/serviceLocator';
import tsStore from '@/ts-store';
import _ from 'lodash';
import App from './App.vue';
import router from './router';
import 'vuetify/dist/vuetify.min.css';
import './styles/base.css';
import vuetify from './plugins/vuetify';
import loadBases from './loadBases';
import i18n from './i18n';
import 'flag-icon-css/css/flag-icon.css';

sl.set('serverProxy', serverProxy);
sl.set('globalActions', globalActions);
sl.set('store', tsStore);
sl.set('lodash', _);
sl.set('router', router);

loadBases();

Vue.use(Vuetify);
Vue.config.productionTip = false;

new Vue({
  router,
  vuetify,
  i18n,
  render: h => h(App),
}).$mount('#app');

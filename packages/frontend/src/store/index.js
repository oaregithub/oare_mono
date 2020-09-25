import Vue from 'vue';
import Vuex from 'vuex';
import Cookies from 'js-cookie';
import mutations from './mutations';
import actions from './actions';
import getters from './getters';
import { isValidJwt } from '../utils/index';

Vue.use(Vuex);

let store = new Vuex.Store({
  state: {
    landed: false,
    user: null,
    markups: {},
    epigraphies: {},
  },
  mutations,
  actions,
  getters,
});

export default store;

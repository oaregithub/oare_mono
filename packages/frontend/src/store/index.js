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

const jwt = Cookies.get('jwt');
const user = JSON.parse(localStorage.getItem('user'));
if (jwt && isValidJwt(jwt) && user) {
  store.commit('setUser', user);
}

export default store;

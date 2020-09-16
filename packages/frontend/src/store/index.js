import Vue from 'vue';
import Vuex from 'vuex';
import { isValidJwt } from '../utils/index';
import mutations from './mutations';
import actions from './actions';
import getters from './getters';

Vue.use(Vuex);

let store = new Vuex.Store({
  state: {
    landed: false,
    user: {},
    jwt: '',
    markups: {},
    epigraphies: {},
  },
  mutations,
  actions,
  getters,
});

const jwt = localStorage.getItem('jwt');
const user = JSON.parse(localStorage.getItem('user'));
if (jwt && isValidJwt(jwt) && user) {
  store.commit('setJwt', jwt);
  store.commit('setUser', user);
}

export default store;

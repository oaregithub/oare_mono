import Vue from 'vue';
import Vuex from 'vuex';
import mutations from './mutations';
import actions from './actions';
import getters from './getters';

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

const user = JSON.parse(localStorage.getItem('user'));
if (user) {
  store.commit('setUser', user);
}

export default store;

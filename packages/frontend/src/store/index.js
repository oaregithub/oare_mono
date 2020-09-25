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
    authComplete: false,
  },
  mutations,
  actions,
  getters,
});

export default store;

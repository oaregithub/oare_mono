import axiosInstance from '../axiosInstance';
import serverProxy from '../serverProxy';

export default {
  logout({ commit }) {
    commit('logout');
  },

  async register({ commit }, userData) {
    try {
      let { data } = await serverProxy.registerUser(userData);
      commit('setUser', data);
    } catch (err) {
      throw err.response.data.message;
    }
  },

  async login({ commit }, userData) {
    try {
      let response = await serverProxy.loginUser(userData);
      commit('setUser', response.data);
    } catch (err) {
      throw err.response.data.message;
    }
  },

  async getMarkups({ state, commit }, textUuid) {
    let markups;
    if (state.markups[textUuid]) {
      markups = state.markups[textUuid];
    } else {
      let { data } = await axiosInstance.get('/markups/' + textUuid);
      markups = data;
      commit('setMarkup', { textUuid, markups });
    }
    return markups;
  },

  async getEpigraphies({ state, commit }, textUuid) {
    let epigraphies;
    if (state.epigraphies[textUuid]) {
      epigraphies = state.epigraphies[textUuid];
    } else {
      let { data } = await axiosInstance.get(`/text_epigraphies/${textUuid}`);
      epigraphies = data;
      commit('setEpigraphy', { textUuid, epigraphies });
    }
    return epigraphies;
  },
};

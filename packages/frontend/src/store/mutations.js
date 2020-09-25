import axiosInstance from '../axiosInstance';

export default {
  setLanded(state) {
    state.landed = true;
  },

  setUser(state, user) {
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  },

  setMarkup(state, payload) {
    state.markups[payload.textUuid] = payload.markups;
  },

  setEpigraphy(state, payload) {
    state.epigraphies[payload.textUuid] = payload.epigraphies;
  },

  logout(state) {
    state.user = null;
    state.epigraphies = {};
    state.markups = {};
    localStorage.clear();
  },

  setAuthComplete(state) {
    state.authComplete = true;
  },
};

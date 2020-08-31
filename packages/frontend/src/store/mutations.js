import axiosInstance from "../axiosInstance";

export default {
  setLanded(state) {
    state.landed = true;
  },

  setUser(state, user) {
    state.user = user;
    localStorage.setItem("user", JSON.stringify(user));
  },

  setJwt(state, token) {
    state.jwt = token;
    localStorage.setItem("jwt", token);
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer: ${token}`;
    state.landed = true;
  },

  setMarkup(state, payload) {
    state.markups[payload.textUuid] = payload.markups;
  },

  setEpigraphy(state, payload) {
    state.epigraphies[payload.textUuid] = payload.epigraphies;
  },

  logout(state) {
    state.user = {};
    state.jwt = "";
    state.epigraphies = {};
    state.markups = {};
    localStorage.clear();
    delete axiosInstance.defaults.headers.common["Authorization"];
  },
};

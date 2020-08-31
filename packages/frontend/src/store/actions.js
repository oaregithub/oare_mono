import { EventBus } from "../utils/index";
import axiosInstance from "../axiosInstance";
import serverProxy from "../serverProxy";

export default {
  logout({ commit }) {
    commit("logout");
  },

  async register({ commit }, userData) {
    try {
      let { data } = await axiosInstance.post("/register", userData);
      commit("setUser", data.data);
      commit("setJwt", data.token);
      return true;
    } catch (err) {
      EventBus.$emit("registerFailure", err.response.data.message);
      return false;
    }
  },

  async login({ commit }, userData) {
    try {
      let response = await serverProxy.loginUser(userData);
      commit("setUser", response.data);
      commit("setJwt", response.token);
      return true;
    } catch (err) {
      EventBus.$emit("loginFailure", err.response.data.message);
      return false;
    }
  },

  async getMarkups({ state, commit }, textUuid) {
    let markups;
    if (state.markups[textUuid]) {
      markups = state.markups[textUuid];
    } else {
      let { data } = await axiosInstance.get("/markups/" + textUuid);
      markups = data;
      commit("setMarkup", { textUuid, markups });
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
      commit("setEpigraphy", { textUuid, epigraphies });
    }
    return epigraphies;
  },
};

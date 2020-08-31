import store from "../store";

export default {
  async isLoginValid(userData) {
    return await store.dispatch("login", userData);
  }
};

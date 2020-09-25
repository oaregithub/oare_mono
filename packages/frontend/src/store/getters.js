export default {
  landed(state) {
    return state.landed;
  },

  isAuthenticated(state) {
    return !!state.user;
  },

  isAdmin(state) {
    return state.user && state.user.is_admin;
  },

  user(state) {
    return state.user;
  },

  authComplete(state) {
    return state.authComplete;
  },
};

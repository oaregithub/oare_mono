export default {
  landed(state) {
    return state.landed;
  },

  isAuthenticated(state) {
    return !!state.user;
  },

  isAdmin(state) {
    return state.user && state.user.isAdmin;
  },

  user(state) {
    return state.user;
  },

  authComplete(state) {
    return state.authComplete;
  },

  permissions(state) {
    return state.permissions;
  },
};

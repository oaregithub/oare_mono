import { isValidJwt } from '../utils/index';

export default {
  landed(state) {
    return state.landed;
  },

  isAuthenticated(state) {
    return isValidJwt(state.jwt);
  },

  isAdmin(state) {
    return state.user.is_admin;
  },

  user(state) {
    return state.user;
  },

  jwt(state) {
    return state.jwt;
  }
};

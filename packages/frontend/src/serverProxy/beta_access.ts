import axios from '@/axiosInstance';

async function allowBetaAccess() {
  await axios.patch('/beta_access/allow');
}

async function revokeBetaAccess() {
  await axios.patch('/beta_access/revoke');
}

export default {
  allowBetaAccess,
  revokeBetaAccess,
};

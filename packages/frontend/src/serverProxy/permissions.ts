import axios from '@/axiosInstance';
import { PermissionResponse } from '@oare/types';

const getPermissions = async (): Promise<PermissionResponse> => {
  const { data } = await axios.get('/permissions');
  return data;
};

export default {
  getPermissions,
};

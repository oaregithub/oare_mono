import axios from '@/axiosInstance';
import { UpdateProfilePayload } from '@oare/types';

const updateProfile = async (payload: UpdateProfilePayload): Promise<void> => {
  await axios.patch('/profile', payload);
};

export default {
  updateProfile,
};

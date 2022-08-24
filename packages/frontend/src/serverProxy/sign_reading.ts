import axios from '@/axiosInstance';
import { SignCode, SignListResponse } from '@oare/types';

async function getSignCode(sign: string, post: string): Promise<SignCode> {
  const { data } = await axios.get(
    `/sign_reading/code/${encodeURIComponent(sign)}/${post}`
  );
  return data;
}

async function getFormattedSign(text: string): Promise<string[]> {
  const { data } = await axios.get(
    `/sign_reading/format/${encodeURIComponent(text)}`
  );
  return data;
}

async function getSignList(sortBy: string): Promise<SignListResponse> {
  const { data } = await axios.get(`/signList/${sortBy}`);
  return data;
}

export default {
  getSignCode,
  getFormattedSign,
  getSignList,
};

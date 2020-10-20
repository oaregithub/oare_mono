import axios from '../axiosInstance';
import {
  Text,
  AddTextPayload,
  RemoveTextsPayload,
  UpdateTextPermissionPayload,
} from '@oare/types';

async function addTextGroups(
  groupId: number,
  payload: AddTextPayload
): Promise<void> {
  await axios.post(`/text_groups/${groupId}`, payload);
}

async function getTextGroups(groupId: number): Promise<Text[]> {
  let { data } = await axios.get(`/text_groups/${groupId}`);
  return data;
}

async function removeTextsFromGroup(
  groupId: number,
  payload: RemoveTextsPayload
): Promise<void> {
  await axios.delete(`/text_groups/${groupId}`, {
    params: payload,
  });
}

async function updateText(
  groupId: number,
  payload: UpdateTextPermissionPayload
) {
  await axios.patch(`/text_groups/${groupId}`, payload);
}

export default {
  addTextGroups,
  getTextGroups,
  removeTextsFromGroup,
  updateText,
};

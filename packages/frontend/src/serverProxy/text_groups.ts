import axios from '../axiosInstance';
import {
  Text,
  AddTextCollectionPayload,
  UpdateTextCollectionListPayload,
} from '@oare/types';

async function addTextGroups(
  payload: AddTextCollectionPayload,
  groupId: number
): Promise<void> {
  await axios.post(`/text_groups/${groupId}`, payload);
}

async function getTextGroups(groupId: number): Promise<Text[]> {
  let { data } = await axios.get(`/text_groups/${groupId}`);
  return data;
}

async function removeTextsFromGroup(
  uuids: string[],
  groupId: number
): Promise<void> {
  await Promise.all(
    uuids.map(uuid => axios.delete(`/text_groups/${groupId}/${uuid}`))
  );
}

async function updateText(
  groupId: number,
  payload: UpdateTextCollectionListPayload
) {
  await axios.patch(`/text_groups/${groupId}`, payload);
}

export default {
  addTextGroups,
  getTextGroups,
  removeTextsFromGroup,
  updateText,
};

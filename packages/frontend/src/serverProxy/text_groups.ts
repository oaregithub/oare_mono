import axios from '../axiosInstance';
import { Text, AddTextPayload } from '@oare/types';

async function addTextGroups(payload: AddTextPayload): Promise<void> {
  await axios.post('/text_groups', payload);
}

async function getTextGroups(groupId: number): Promise<Text[]> {
  let { data } = await axios.get('/text_groups', {
    params: {
      group_id: groupId,
    },
  });
  return data;
}

async function removeTextsFromGroup(
  groupId: number,
  texts: string[]
): Promise<void> {
  await axios.delete('/text_groups', {
    params: {
      group_id: groupId,
      texts,
    },
  });
}

async function updateText(
  groupId: number,
  textUuid: string,
  canRead: boolean,
  canWrite: boolean
) {
  await axios.patch('/text_groups', {
    group_id: groupId,
    text_uuid: textUuid,
    can_read: canRead,
    can_write: canWrite,
  });
}

export default {
  addTextGroups,
  getTextGroups,
  removeTextsFromGroup,
  updateText,
};

import axios from '../axiosInstance';
import {
  CollectionPermissionsItem,
  AddCollectionsPayload,
  UpdateCollectionPermissionPayload,
} from '@oare/types';

async function getGroupCollections(
  groupId: number
): Promise<CollectionPermissionsItem[]> {
  let { data } = await axios.get(`/collection_groups/${groupId}`);
  return data;
}

async function addGroupCollections(
  groupId: number,
  payload: AddCollectionsPayload
): Promise<void> {
  await axios.post(`/collection_groups/${groupId}`, payload);
}

async function updateCollectionPermissions(
  groupId: number,
  payload: UpdateCollectionPermissionPayload
): Promise<void> {
  await axios.patch(`/collection_groups/${groupId}`, payload);
}

async function removeGroupCollections(
  uuids: string[],
  groupId: number
): Promise<void> {
  await Promise.all(
    uuids.map(uuid => axios.delete(`/collection_groups/${groupId}/${uuid}`))
  );
}

export default {
  getGroupCollections,
  addGroupCollections,
  updateCollectionPermissions,
  removeGroupCollections,
};

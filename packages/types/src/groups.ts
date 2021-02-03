import { CollectionListItem } from './collection';

export interface Group {
  id: number;
  name: string;
  created_on: Date;
  num_users: number;
}

export interface CreateGroupPayload {
  groupName: string;
}

export interface DeleteGroupPayload {
  groupIds: number[];
}

export interface AddUsersToGroupPayload {
  userIds: number[];
}

export interface RemoveUsersFromGroupPayload {
  userIds: number[];
}

export interface TextCollectionGroup {
  uuid: string;
  canWrite: boolean;
  canRead: boolean;
}

export interface AddTextCollectionPayload {
  items: TextCollectionGroup[];
}

export interface UpdateTextCollectionListPayload {
  uuid: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface Text {
  canRead: boolean;
  canWrite: boolean;
  name: string;
  uuid: string;
}

export interface CollectionPermissionsItem extends CollectionListItem {
  canRead: boolean;
  canWrite: boolean;
}

import { Collection } from './collection';

export interface Group {
  id: number;
  name: string;
  created_on: Date;
  num_users: number;
  description: string | null;
}

export interface CreateGroupPayload {
  groupName: string;
  description: string;
}

export interface UpdateGroupDescriptionPayload {
  description: string;
}

export interface AddUsersToGroupPayload {
  userUuids: string[];
}

export interface RemoveUsersFromGroupPayload {
  userUuids: string[];
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

export interface CollectionPermissionsItem extends Collection {
  canRead: boolean;
  canWrite: boolean;
}

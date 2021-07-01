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

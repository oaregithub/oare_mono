// COMPLETE

export interface GroupRow {
  id: number;
  name: string;
  createdOn: Date;
  description: string | null;
}

export interface Group extends GroupRow {
  numUsers: number;
}

export interface CreateGroupPayload {
  name: string;
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

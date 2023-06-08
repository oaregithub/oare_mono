import { User } from './login';

export type ThreadStatus =
  | 'All'
  | 'New'
  | 'Pending'
  | 'In Progress'
  | 'Completed';

export interface ThreadsRow {
  uuid: string;
  referenceUuid: string;
  status: ThreadStatus;
  tableReference: string;
  name: string;
}

export interface CommentsRow {
  uuid: string;
  threadUuid: string;
  userUuid: string;
  createdAt: Date;
  deleted: boolean;
  comment: string;
}

export interface Comment extends CommentsRow {
  user: User;
}

export interface Thread extends ThreadsRow {
  comments: Comment[];
}

export type ThreadsSortType = 'status' | 'name';

export interface UpdateThreadStatusPayload {
  status: ThreadStatus;
}

export interface UpdateThreadNamePayload {
  name: string;
}

export interface CreateThreadPayload {
  referenceUuid: string;
  name: string;
  tableReference: string;
}

export interface CreateCommentPayload {
  threadUuid: string;
  comment: string;
}

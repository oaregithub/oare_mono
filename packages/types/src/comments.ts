import { DictionaryForm, FormSpelling } from './dictionary';

export interface CommentRequest {
  comment: CommentInsert;
  thread: Thread;
}

export interface CommentResponse {
  commentUuid: string | null;
  threadUuid: string | null;
}

export interface CommentInsert {
  uuid: string | null;
  threadUuid: string | null;
  userUuid: string | null;
  createdAt: Date | null;
  deleted: boolean;
  text: string;
}

export interface Comment {
  uuid: string;
  threadUuid: string;
  userUuid: string;
  createdAt: Date;
  deleted: boolean;
  text: string;
}

export interface CommentDisplay extends Comment {
  userFirstName: string;
  userLastName: string;
}

export type ThreadStatus = 'New' | 'Pending' | 'In Progress' | 'Completed';

export interface Thread {
  uuid: string | null;
  referenceUuid: string;
  status: ThreadStatus;
  route: string;
}

export interface ThreadWithComments {
  thread: Thread;
  comments: CommentDisplay[];
}

export interface ThreadDisplay {
  uuid: string,
  word: string,
  status: ThreadStatus,
  route: string,
  latestComment: string,
}

// Util List (Commenting, Editing and Deleting popup)

export type UtilListType =
  | 'WORD'
  | 'FORM'
  | 'SPELLING'
  | 'EPIGRAPHY'
  | 'DISCOURSE'
  | 'NONE';

export interface UtilListDisplay {
  comment: boolean;
  edit: boolean;
  delete: boolean;
  word: string;
  uuid: string;
  route: string;
  type: UtilListType;
  form?: DictionaryForm;
  formSpelling?: FormSpelling;
}

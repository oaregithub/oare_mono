import { DictionaryForm, FormSpelling, Pagination } from './dictionary';

export interface Comment {
  uuid: string;
  threadUuid: string;
  userUuid: string;
  createdAt: Date;
  deleted: boolean;
  text: string;
}

export type CreateCommentPayload = Pick<Comment, 'threadUuid' | 'text'>;

export interface CommentDisplay extends Comment {
  userFirstName: string;
  userLastName: string;
}

export type ThreadStatus = 'New' | 'Pending' | 'In Progress' | 'Completed';

export interface Thread {
  uuid: string;
  name: string | null;
  referenceUuid: string;
  status: ThreadStatus;
  route: string;
}

export type CreateThreadPayload = Pick<Thread, 'referenceUuid' | 'route'>;

export interface UpdateThreadNameRequest {
  threadUuid: string;
  newName: string;
}

export interface ThreadWithComments {
  thread: Thread;
  comments: CommentDisplay[];
}

export interface ThreadDisplay {
  thread: Thread;
  word: string;
  latestCommentDate: Date;
  comments: Comment[];
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

export type CommentSortType = 'status' | 'thread' | 'item' | 'timestamp';

export interface AllCommentsRequest {
  filters: {
    status: ThreadStatus[];
    thread: string;
    item: string;
    comment: string;
  };
  sort: {
    type: CommentSortType;
    desc: boolean;
  };
  pagination: Pagination;
  isUserComments: boolean;
}

export interface AllCommentsResponse {
  threads: ThreadDisplay[];
  count: number;
}

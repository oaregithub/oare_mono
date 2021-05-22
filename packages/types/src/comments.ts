import { Pagination } from './dictionary';

export interface CommentRequest {
  comment: CommentInsert;
  thread: Thread;
}

export interface CommentResponse {
  commentUuid: string;
  threadUuid: string;
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

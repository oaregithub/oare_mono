import { Pagination } from './dictionary';

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

export type ThreadStatus =
  | 'All'
  | 'New'
  | 'Pending'
  | 'In Progress'
  | 'Completed';

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

export interface ThreadWithComments extends Thread {
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
    status: ThreadStatus;
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

export interface AllThreadRow extends Thread {
  comment: string;
  userUuid: string;
  timestamp: string;
  item: string | null;
}

export interface AllThreadResponse {
  threads: AllThreadRow[];
  count: number;
}

export interface AllThreadRowUndeterminedItem extends Thread {
  comment: string;
  userUuid: string;
  timestamp: string;
  word: string | null;
  form: string | null;
  spelling: string | null;
  definition: string | null;
  collectionName: string | null;
  bibliography: string | null;
  epigraphyReading: string | null;
  discourseSpelling: string | null;
}

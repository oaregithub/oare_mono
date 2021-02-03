export interface CommentRequest {
  comment: Comment;
  thread: Thread;
}

export interface CommentResponse {
  commentUuid: string | null;
  threadUuid: string | null;
}

export interface Comment {
  uuid: string | null;
  threadUuid: string | null;
  userUuid: string | null;
  createdAt: Date | null;
  deleted: boolean;
  text: string;
}

export interface Thread {
  uuid: string | null;
  referenceUuid: string;
  status: "New" | "Pending" | "In Progress" | "Completed";
  route: string;
}

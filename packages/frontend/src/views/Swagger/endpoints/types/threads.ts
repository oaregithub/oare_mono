import {
  Comment,
  CommentSortType,
  Thread,
  ThreadDisplay,
  ThreadStatus,
} from '@oare/types/build/src/comments';
import { Pagination } from '@oare/types/build/src/dictionary';

export const threadStatus = ['New', 'Pending', 'In Progress', 'Completed'];

export const commentSortType = ['status', 'thread', 'item', 'timestamp'];

export const comment = {
  uuid: {
    type: 'string',
  },
  threadUuid: {
    type: 'string',
  },
  userUuid: {
    type: 'string',
  },
  createdAt: {
    type: 'string',
  },
  deleted: {
    type: 'boolean',
  },
  text: {
    type: 'string',
  },
};

export const commentDisplay = {
  ...comment,
  userFirstName: {
    type: 'string',
  },
  userLastName: {
    type: 'string',
  },
};

export const thread = {
  uuid: {
    type: 'string',
  },
  name: {
    nullable: true,
    type: 'string',
  },
  referenceUuid: {
    type: 'string',
  },
  status: {
    type: 'string',
    enum: threadStatus,
  },
  route: {
    type: 'string',
  },
};

export const threadWithComments = {
  ...thread,
  comments: {
    type: 'array',
    items: {
      type: 'object',
      properties: commentDisplay,
    },
  },
};

export const threadDisplay = {
  thread: {
    type: 'object',
    properties: thread,
  },
  word: {
    type: 'string',
  },
  latestCommentDate: {
    type: 'string',
  },
  comments: {
    type: 'array',
    items: {
      type: 'object',
      properties: comment,
    },
  },
};

export const allCommentsRequest = {
  filters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: threadStatus,
      },
      thread: {
        type: 'string',
      },
      item: {
        type: 'string',
      },
      comment: {
        type: 'string',
      },
    },
  },
  sort: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: commentSortType,
      },
      desc: {
        type: 'boolean',
      },
    },
  },
  pagination: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
      },
      limit: {
        type: 'number',
      },
      filter: {
        required: false,
        type: 'string',
      },
    },
  },
};

export const allCommentsResponse = {
  threads: {
    type: 'array',
    items: {
      type: 'object',
      properties: threadDisplay,
    },
  },
  count: {
    type: 'number',
  },
};

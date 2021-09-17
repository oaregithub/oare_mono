import { user } from '@/views/Swagger/endpoints/types/user';

export const epigraphicUnitSide = [
  'obv.',
  'lo.e.',
  'rev.',
  'u.e.',
  'le.e.',
  'r.e.',
  'mirror text',
  'legend',
  'suppl. tablet',
  'vs.!',
  'near hilt',
  'obv. col. i',
  'obv. col. ii',
  'le.e. col. i',
  'le.e. col. ii',
  'le.e. col. iii',
  'col. i',
  'col. ii',
  'col. iii',
  'col. iv',
  'col. v',
  'col. vi',
  "col. i'",
  "col. ii'",
  "col. iii'",
  "col. iv'",
  0,
  '',
];

export const textDraftSideContent = {
  side: {
    type: 'string',
    enum: epigraphicUnitSide,
  },
  text: {
    type: 'string',
  },
};

export const textDraft = {
  createdAt: {
    type: 'string',
  },
  textName: {
    type: 'string',
  },
  textUuid: {
    type: 'string',
  },
  updatedAt: {
    type: 'string',
  },
  uuid: {
    type: 'string',
  },
  content: {
    type: 'array',
    items: {
      type: 'object',
      properties: textDraftSideContent,
    },
  },
  notes: {
    type: 'string',
  },
  userUuid: {
    type: 'string',
  },
  originalText: {
    type: 'string',
  },
};

export const draftPayload = {
  ...textDraft,
  content: {
    type: 'string',
  },
};

export const textDraftWithUser = {
  ...textDraft,
  user: {
    type: 'object',
    properties: user,
  },
};

export const textDraftsResponse = {
  totalDrafts: {
    type: 'number',
  },
  drafts: {
    type: 'array',
    items: {
      type: 'object',
      properties: textDraftWithUser,
    },
  },
};

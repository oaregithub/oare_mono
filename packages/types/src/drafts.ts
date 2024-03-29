import { EpigraphicUnitSide } from './epigraphies';
import { User } from './login';
import { SortOrder } from './utils';
import { Pagination } from './dictionary';

export interface TextDraftSideContent {
  side: EpigraphicUnitSide | '';
  text: string;
}

export interface TextDraft {
  createdAt: Date;
  textName: string;
  textUuid: string;
  updatedAt: Date;
  uuid: string;
  content: TextDraftSideContent[];
  notes: string;
  userUuid: string;
  originalText: string;
}

export interface TextDraftWithUser extends Omit<TextDraft, 'userUuid'> {
  user: Pick<User, 'firstName' | 'lastName' | 'uuid'>;
}

export interface TextDraftsResponse {
  totalDrafts: number;
  drafts: TextDraftWithUser[];
}

export interface DraftPayload extends Pick<TextDraft, 'notes' | 'textUuid'> {
  content: string;
}

export interface CreateDraftResponse {
  draftUuid: string;
}

export type GetDraftsSortType = 'text' | 'author' | 'updatedAt';

export interface DraftQueryOptions extends Pagination {
  sortBy?: GetDraftsSortType;
  sortOrder?: SortOrder;
  textFilter?: string;
  authorFilter?: string;
}

export type RowTypes =
  | 'Line'
  | 'Broken Line(s)'
  | 'Ruling(s)'
  | 'Seal Impression'
  | 'Broken Area'
  | 'Uninscribed Line(s)';

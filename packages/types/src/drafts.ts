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
}

export interface TextDraftWithUser extends Omit<TextDraft, 'userUuid'> {
  user: Pick<User, 'firstName' | 'lastName' | 'uuid'>;
  originalText: string;
}

export interface TextDraftsResponse {
  totalDrafts: number;
  drafts: TextDraftWithUser[];
}

export interface DraftPayload {
  content: string;
  notes: string;
}

export interface CreateDraftPayload extends DraftPayload {
  textUuid: string;
}

export type GetDraftsSortType = 'text' | 'author' | 'updatedAt';

export interface DraftQueryOptions extends Pagination {
  sortBy?: GetDraftsSortType;
  sortOrder?: SortOrder;
  textFilter?: string;
  authorFilter?: string;
}

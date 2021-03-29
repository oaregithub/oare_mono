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
}

export interface AddTextDraftPayload {
  content: string;
  notes: string;
}

export type GetDraftsSortType = 'text' | 'author' | 'updated';

export interface DraftQueryOptions extends Pagination {
  sortBy?: GetDraftsSortType;
  sortOrder?: SortOrder;
}

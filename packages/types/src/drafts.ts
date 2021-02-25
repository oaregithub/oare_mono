import { EpigraphicUnitSide } from './epigraphies';

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
}

export interface AddTextDraftPayload {
  content: string;
  notes: string;
}

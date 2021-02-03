import {
  EpigraphicUnit,
  MarkupUnit,
  DiscourseUnit,
} from "@oare/oare";
import { TextDraft } from './drafts';

export interface TextInfoResponse {
  name: string;
}

export interface EpigraphyResponse {
  canWrite: boolean;
  textName: string;
  collection: {
    uuid: string;
    name: string;
  };
  cdliNum: string | null;
  units: EpigraphicUnit[];
  color: string;
  colorMeaning: string;
  markups: MarkupUnit[];
  discourseUnits: DiscourseUnit[];
  draft?: TextDraft;
}

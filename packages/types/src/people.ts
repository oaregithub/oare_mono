import { DisplayableWord } from './dictionary';
import { EpigraphicTextWithReadings } from './epigraphies';

export interface PersonDisplay extends DisplayableWord {
  person: string;
  relation: string;
  relationPerson: string;
  roles: string[];
  totalReferenceCount: number;
  references: EpigraphicTextWithReadings[];
}

import { DisplayableWord } from './dictionary';
import { EpigraphicTextWithReadings } from './epigraphies';

export interface PersonDisplay extends DisplayableWord {
  //uuid: 'something', (dictionaryWord's uuid (in order to be able to comment on it))
  //word: 'Ali-abum' (same as person)
  person: string;
  relation: string;
  relationPerson: string;
  roles: string[];
  totalReferenceCount: number;
  references: EpigraphicTextWithReadings[];
}

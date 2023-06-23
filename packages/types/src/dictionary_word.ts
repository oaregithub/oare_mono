import { FieldRow } from './field';
import { AppliedProperty, ItemProperty } from './properties';
import { DictionaryForm } from './dictionary_form';

// COMPLETE

export type DictionaryWordType = 'word' | 'GN' | 'PN';

export interface DictionaryWordRow {
  uuid: string;
  type: DictionaryWordType;
  word: string;
  mash: string | null;
}

export interface DictionaryWord extends DictionaryWordRow {
  properties: ItemProperty[];
  definitions: FieldRow[];
  discussionLemmas: FieldRow[];
  occurrences: number;
  forms: DictionaryForm[];
}

export interface UpdateWordSpellingPayload {
  word: string;
}

export interface AddWordPayload {
  wordSpelling: string;
  properties: AppliedProperty[];
  type: DictionaryWordType;
}

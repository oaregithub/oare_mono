import { ItemProperty, AppliedProperty } from './properties';
import { DictionarySpelling } from './dictionary_spelling';

// COMPLETE

export interface DictionaryFormRow {
  uuid: string;
  referenceUuid: string;
  form: string;
  mash: string | null;
}

export interface DictionaryForm extends DictionaryFormRow {
  properties: ItemProperty[];
  spellings: DictionarySpelling[];
}

export interface AddFormPayload {
  wordUuid: string;
  formSpelling: string;
  properties: AppliedProperty[];
}

export interface UpdateFormSpellingPayload {
  form: string;
}

export interface DictionaryFormGrammar {
  stems: string[];
  tenses: string[];
  persons: string[];
  genders: string[];
  grammaticalNumbers: string[];
  cases: string[];
  states: string[];
  moods: string[];
  clitics: string[];
  morphologicalForms: string[];
  suffix: {
    persons: string[];
    genders: string[];
    grammaticalNumbers: string[];
    cases: string[];
  } | null;
}

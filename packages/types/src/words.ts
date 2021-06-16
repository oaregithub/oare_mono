import { DictionaryForm } from './dictionary';

export interface ItemProperty {
  uuid: string;
  name: string;
}

export interface ItemPropertyRow extends ItemProperty {
  referenceUuid: string;
  valueUuid: string;
}

export interface DictionaryWordTranslation {
  uuid: string;
  translation: string;
}

export interface DictionaryWordParseInfo {
  partsOfSpeech: ItemPropertyRow[];
  specialClassifications: ItemPropertyRow[];
  translations: DictionaryWordTranslation[];
  verbalThematicVowelTypes: ItemPropertyRow[];
}

export interface Word extends DictionaryWordParseInfo {
  uuid: string;
  word: string;
  forms: DictionaryForm[];
}

export interface DictionaryWord extends DictionaryWordParseInfo {
  uuid: string;
  word: string;
}

export interface WordsResponse {
  words: DictionaryWord[];
}

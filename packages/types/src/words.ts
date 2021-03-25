import { DictionaryForm } from './dictionary';

export interface ItemProperty {
  uuid: string;
  name: string;
}

export interface DictionaryWordTranslation {
  uuid: string;
  translation: string;
}

export interface DictionaryWordParseInfo {
  partsOfSpeech: ItemProperty[];
  specialClassifications: ItemProperty[];
  translations: DictionaryWordTranslation[];
  verbalThematicVowelTypes: ItemProperty[];
}

export interface DictionaryWordResponse extends DictionaryWordParseInfo {
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

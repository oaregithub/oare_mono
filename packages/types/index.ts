import { EpigraphicUnitSide } from "@oare/oare";
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

// Dictionary

export interface DictionaryWordTranslation {
  uuid: string;
  translation: string;
}

export interface DictionaryWordResponse {
  word: string;
  forms: DictionaryForm[];
  partsOfSpeech: string[];
  verbalThematicVowelTypes: string[];
  specialClassifications: string[];
  translations: DictionaryWordTranslation[];
}

export interface DictionaryForm {
  uuid: string;
  form: string;
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

export interface UpdateDictionaryPayload {
  word: string;
  translations: DictionaryWordTranslation[];
}

export interface UpdateDictionaryResponse {
  translations: DictionaryWordTranslation[];
}

export interface WordWithForms {
  word: string;
  forms: DictionaryForm[];
  partsOfSpeech: string[];
  verbalThematicVowelTypes: string[];
  specialClassifications: string[];
  translations: DictionaryWordTranslation[];
}

// Collections / Texts

export interface CollectionListItem {
  uuid: string;
  name: string;
}

export interface CollectionText {
  id: number;
  uuid: string;
  type: string;
  hasEpigraphy: boolean;
  name: string;
}
export interface CollectionResponse {
  totalTexts: number;
  texts: CollectionText[];
}

export interface CollectionInfo {
  name: string;
}

// Words

export interface DictionaryWord {
  uuid: string;
  word: string;
  partsOfSpeech: string[];
  specialClassifications: string[];
  translations: DictionaryWordTranslation[];
  verbalThematicVowelTypes: string[];
}

export interface WordsResponse {
  words: DictionaryWord[];
}

// Groups

export interface Group {
  id: number;
  name: string;
  created_on: Date;
  num_users: number;
}

// Names and Places

export interface OnomasticonForm {
  uuid: string;
  form: string;
  spellings: string[];
  cases: string | null;
}
export interface NameOrPlace {
  uuid: string;
  word: string;
  translation: string;
  forms: OnomasticonForm[];
}

// Search

export interface SearchResultRow {
  uuid: string;
  name: string;
  matches: string[];
}

export interface SearchResult {
  totalRows: number;
  results: SearchResultRow[];
}

// Dictionary Search

export interface DictionarySearchRow extends SearchResultRow {
  type: "word" | "PN" | "GN";
  translations: string[];
}

export interface DictionarySearchResult {
  totalRows: number;
  results: DictionarySearchRow[];
}

// Text Groups

export interface TextGroup {
  uuid: string;
  can_write: boolean;
  can_read: boolean;
}

export interface Text {
  can_read: boolean;
  can_write: boolean;
  name: string;
  text_uuid: string;
}

export interface AddTextPayload {
  groupId: number;
  texts: TextGroup[];
}

// Text Drafts
export interface TextDraftSideContent {
  side: EpigraphicUnitSide;
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
  textUuid: string;
  content: string;
  notes: string;
}

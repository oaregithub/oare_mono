import { EpigraphicUnitSide } from "@oare/oare";
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  groups: number[];
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

export interface SpellingText {
  uuid: string;
  text: string;
}

export interface FormSpelling {
  uuid: string;
  spelling: string;
  texts: SpellingText[];
}

export interface DictionaryFormInfo {
  uuid: string;
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

export interface DictionaryForm
  extends DictionaryFormInfo,
    DictionaryFormGrammar {
  spellings: FormSpelling[];
}

export interface UpdateDictionaryTranslationPayload {
  translations: DictionaryWordTranslation[];
}

export interface UpdateFormSpellingPayload {
  spelling: string;
}

export interface UpdateDictionaryWordPayload {
  word: string;
}

export interface UpdateDictionaryResponse {
  word: string;
}

export interface UpdateDictionaryTranslationsResponse {
  translations: DictionaryWordTranslation[];
}

export interface AddFormSpellingPayload {
  formUuid: string;
  spelling: string;
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

export interface CreateGroupPayload {
  groupName: string;
}

export interface DeleteGroupPayload {
  groupIds: number[];
}

// Group Users

export interface AddUsersToGroupPayload {
  userIds: number[];
}

export interface RemoveUsersFromGroupPayload {
  userIds: number[];
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

export interface SearchTextsResultRow {
  uuid: string;
  name: string;
  matches: string[];
}

export interface SearchTextsPayload {
  characters?: string[];
  textTitle: string;
  page: number;
  rows: number;
}

export interface SearchTextsResponse {
  totalRows: number;
  results: SearchTextsResultRow[];
}

// Search Text Names

export interface SearchTextNamesResultRow {
  uuid: string;
  name: string;
}

export interface SearchTextNamesPayload {
  search: string;
}

// Search spellings

export interface SearchSpellingResultRow {
  wordUuid: string;
  word: string;
  form: Omit<DictionaryForm, "spellings">;
}

export interface SearchSpellingPayload {
  spelling: string;
}

// Dictionary Search

export interface DictionarySearchRow extends SearchTextsResultRow {
  type: "word" | "PN" | "GN";
  translations: string[];
}

export interface DictionarySearchResult {
  totalRows: number;
  results: DictionarySearchRow[];
}

export interface DictionarySearchPayload {
  search: string;
  page: number;
  rows: number;
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
  texts: TextGroup[];
}

export interface RemoveTextsPayload {
  textUuids: string[];
}

export interface UpdateTextPermissionPayload {
  textUuid: string;
  canRead: boolean;
  canWrite: boolean;
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
  content: string;
  notes: string;
}

// Login / Register

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  password: string;
  email: string;
}

export interface LoginRegisterResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
}

// Permissions

export type DictionaryPermission =
  | "UPDATE_WORD_SPELLING"
  | "ADD_TRANSLATION"
  | "DELETE_TRANSLATION"
  | "UPDATE_TRANSLATION"
  | "UPDATE_TRANSLATION_ORDER"
  | "UPDATE_FORM"
  | "ADD_SPELLING";

export interface PermissionResponse {
  dictionary: DictionaryPermission[];
}

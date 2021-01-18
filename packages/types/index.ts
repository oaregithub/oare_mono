import { EpigraphicUnitSide } from "@oare/oare";
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface GetUserResponse extends User {
  groups: number[];
  isAdmin: boolean;
}

// Dictionary

export interface SpellingText {
  uuid: string;
  text: string;
}

export interface FormSpelling {
  uuid: string;
  spelling: string;
  totalOccurrences: number;
}

export interface CheckSpellingResponse {
  errors: string[];
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
  discourseUuids: string[];
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
  discourseUuids: string[];
}

export interface AddFormSpellingResponse {
  uuid: string;
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

// Public Blacklist

export interface PublicBlacklistPayloadItem {
  uuid: string;
  type: string;
}

export interface AddPublicBlacklistPayload {
  texts: PublicBlacklistPayloadItem[];
}

export interface Blacklists {
  blacklist: string[];
  whitelist: string[];
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
  hasEpigraphy: boolean;
}

export interface SearchTextNamesPayload {
  page: number;
  rows: number;
  search: string;
  groupId?: string;
}

export interface SearchTextNamesResponse {
  texts: SearchTextNamesResultRow[];
  count: number;
}

//Search Collection Names

export interface SearchCollectionNamesResultRow {
  uuid: string;
  name: string;
}

export interface SearchCollectionNamesPayload {
  page: number;
  rows: number;
  search: string;
  groupId?: string;
}

export interface SearchCollectionNamesResponse {
  collections: SearchCollectionNamesResultRow[];
  count: number;
}

// Search spelling discourse

export interface DiscourseLineSpelling {
  wordOnTablet: number;
  spelling: string;
}

export interface SearchDiscourseSpellingRow {
  uuid: string;
  line: number;
  wordOnTablet: number;
  textUuid: string;
  textName: string;
  readings: DiscourseLineSpelling[];
}

export interface SearchDiscourseSpellingResponse {
  totalResults: number;
  rows: SearchDiscourseSpellingRow[];
}

// Search spellings

export interface SearchSpellingResultRow {
  wordUuid: string;
  word: string;
  form: Omit<DictionaryForm, "spellings">;
}

export interface SearchSpellingPayload {
  spelling: string;
  page?: string;
  limit?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  filter?: string;
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

export interface SpellingOccurrenceRow {
  discourseUuid: string;
  textName: string;
  textUuid: string;
  line: number;
  wordOnTablet: number;
}

export interface SpellingOccurrenceResponseRow extends SpellingOccurrenceRow {
  readings: string[];
}

export interface SpellingOccurrencesResponse {
  totalResults: number;
  rows: SpellingOccurrenceResponseRow[];
}

// Text Groups

export interface TextGroup {
  uuid: string;
  canWrite: boolean;
  canRead: boolean;
}

export interface Text {
  canRead: boolean;
  canWrite: boolean;
  name: string;
  uuid: string;
}

export interface AddTextPayload {
  texts: TextGroup[];
}

export interface UpdateTextPermissionPayload {
  uuid: string;
  canRead: boolean;
  canWrite: boolean;
}

// Collection Groups

export interface CollectionGroup {
  uuid: string;
  canWrite: boolean;
  canRead: boolean;
}

export interface CollectionPermissionsItem extends CollectionListItem {
  canRead: boolean;
  canWrite: boolean;
}

export interface AddCollectionsPayload {
  collections: CollectionGroup[];
}

export interface UpdateCollectionPermissionPayload {
  uuid: string;
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
  uuid: string;
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

export interface DictionaryPermissionRow {
  permission: DictionaryPermission;
}
export type PagesPermission = "WORDS" | "NAMES" | "PLACES";

export interface PagesPermissionRow {
  permission: PagesPermission;
}

export interface PermissionResponse {
  dictionary: DictionaryPermission[];
  pages: PagesPermission[];
}

export type PermissionsListType = 'Text' | 'Collection';

// Text Info

export interface TextInfoResponse {
  name: string;
}

// Reset Password

export interface ResetPasswordPayload {
  resetUuid: string;
  newPassword: string;
}

//CopyWithPartial

export type CopyWithPartial<T, K extends keyof T> = Omit<T, K> & Partial<T>;

// Comment Request

export interface CommentRequest {
  comment: Comment,
  thread: Thread
}

export interface Comment {
  uuid?: string | null,
  threadUuid?: string | null,
  userUuid: string,
  createdAt: string,
  deleted: boolean,
  text: string,
}

export interface Thread {
  uuid?: string | null,
  referenceUuid: string,
  status: "Untouched" | "Pending" | "In Progress" | "Completed",
  route: string,
}

export interface DictionaryWord {
  uuid: string;
  word: string;
  partsOfSpeech: string[];
  specialClassifications: string[];
  translations: string[];
  verbalThematicVowelTypes: string[];
}

export interface WordsResponse {
  words: DictionaryWord[];
  canEdit: boolean;
}

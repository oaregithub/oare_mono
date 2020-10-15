export interface DictionaryWord {
  uuid: string;
  word: string;
  partsOfSpeech: string[];
  specialClassifications: string[];
  translations: {
    uuid: string;
    translation: string;
  }[];
  verbalThematicVowelTypes: string[];
}

export interface WordsResponse {
  words: DictionaryWord[];
}

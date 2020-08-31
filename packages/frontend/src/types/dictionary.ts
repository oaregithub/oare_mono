export interface WordWithForms {
  word: string;
  forms: DictionaryForm[];
  partsOfSpeech: string[];
  verbalThematicVowelTypes: string[];
  specialClassifications: string[];
  translations: string[];
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

export interface DictionarySpelling {
  uuid: string;
  spelling: string;
}

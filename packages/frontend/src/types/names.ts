export interface OnomasticonForm {
  form: string;
  spellings: string[];
}
export interface NamesOrPlaces {
  uuid: string;
  word: string;
  translation: string;
  forms: OnomasticonForm[];
}

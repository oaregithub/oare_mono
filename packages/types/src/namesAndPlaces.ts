export interface ExplicitSpelling {
  uuid: string;
  explicitSpelling: string;
}

export interface OnomasticonForm {
  uuid: string;
  form: string;
  spellings: ExplicitSpelling[];
  cases: string | null;
}
export interface NameOrPlace {
  uuid: string;
  word: string;
  translation: string;
  forms: OnomasticonForm[];
}

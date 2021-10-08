export type SignCodeType = 'image' | 'utf8';

export interface SignCode {
  type: SignCodeType | null;
  code: string | null;
  post?: string;
  sign?: string;
}

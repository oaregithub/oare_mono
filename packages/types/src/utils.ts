export type CopyWithPartial<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export interface UuidRow {
  uuid: string;
}

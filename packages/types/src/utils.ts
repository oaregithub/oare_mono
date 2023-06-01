export type CopyWithPartial<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type SortOrder = 'asc' | 'desc';

export interface AdminBadgeOptions {
  error: boolean;
  comments: boolean;
}

export interface EnvironmentInfo {
  elasticBeanstalkRegion: string;
  databaseReadRegion: string;
  databaseWriteRegion: string;
  databaseReadOnly: boolean;
}

export interface Locale {
  label: string;
  value: LocaleCode;
}

export type LocaleCode = 'en' | 'tr';

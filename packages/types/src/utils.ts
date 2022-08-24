export type CopyWithPartial<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export interface UuidRow {
  uuid: string;
}

export type SortOrder = 'asc' | 'desc';

export interface AdminBadgeOptions {
  error: boolean;
  comments: boolean;
}

export interface EnvironmentInfo {
  elasticBeanstalkRegion?: string;
  databaseReadRegion?: string;
  databaseWriteRegion?: string;
}

export interface GoogleAnalyticsInfo {
  src?: string;
  href?: string;
}

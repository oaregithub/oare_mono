export interface Week {
  uuid: string;
  name: string;
}

export interface Month {
  uuid: string;
  abbreviation: string | null;
  name: string;
  weeks: Week[];
}

export interface Year {
  uuid: string;
  number: string;
  name: string;
  occurrences: number;
  months: Month[];
}

export interface PeriodResponse {
  years: Year[];
}

export interface PeriodRow {
  uuid: string;
  type: string | null;
  treeUuid: string | null;
  parentUuid: string | null;
  name: string;
  abbreviation: string | null;
  official1Uuid: string | null;
  official2Uuid: string | null;
  official1Name: string | null;
  official2Name: string | null;
  official1NameUuid: string | null;
  official2NameUuid: string | null;
  official1Father: string | null;
  official2Father: string | null;
  official1FatherNameUuid: string | null;
  official2FatherNameUuid: string | null;
  official1FatherUuid: string | null;
  official2FatherUuid: string | null;
  periodType: string | null;
  order: number | null;
}

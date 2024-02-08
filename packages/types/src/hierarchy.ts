export interface HierarchyRow {
  uuid: string;
  parentUuid: string | null;
  type: string;
  role: string | null;
  objectUuid: string;
  objectParentUuid: string | null;
  published: number;
  custom: null;
}

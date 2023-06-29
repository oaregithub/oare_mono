import { HierarchyRow } from './hierarchy';
import { Text } from './text';

// COMPLETE

export interface Collection extends CollectionRow {
  hierarchy: HierarchyRow;
  texts: Text[];
}

export interface CollectionRow {
  uuid: string;
  name: string;
}

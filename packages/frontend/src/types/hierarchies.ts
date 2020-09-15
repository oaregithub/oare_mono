export type HierarchyType =
  | 'hierarchy'
  | 'text'
  | 'concept'
  | 'dictionaryUnit'
  | 'spatialUnit'
  | 'period'
  | 'person'
  | 'value'
  | 'variable'
  | 'taxonomy'
  | 'collection'
  | 'dictionaryWord'
  | 'textText';

export interface Hierarchy {
  id: number;
  uuid: string;
  type: HierarchyType;
  name: string;
  numChildren: number;
  children?: Hierarchy[];
  onomasticon?: boolean;
  textId?: string;
}

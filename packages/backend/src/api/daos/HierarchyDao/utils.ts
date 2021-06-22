import knex from '@/connection';

export const getTreeNodeQuery = () =>
  knex('hierarchy')
    .select(
      'hierarchy.uuid',
      'hierarchy.type',
      'hierarchy.parent_uuid as parentUuid',
      'hierarchy.hierarchy_uuid as hierarchyUuid',
      'hierarchy.hierarchy_parent_uuid as hierarchyParentUuid',
      'variable.name as variableName',
      'value.name as valueName',
      'variable.abbreviation as varAbbreviation',
      'value.abbreviation as valAbbreviation',
      'variable.uuid as variableUuid',
      'value.uuid as valueUuid'
    )
    .leftJoin('variable', 'variable.uuid', 'hierarchy.uuid')
    .leftJoin('value', 'value.uuid', 'hierarchy.uuid');

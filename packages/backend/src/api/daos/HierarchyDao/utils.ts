import knex from '@/connection';

export const getTreeNodeQuery = () =>
  knex('hierarchy')
    .select(
      'hierarchy.uuid',
      'hierarchy.parent_uuid as parentUuid',
      'hierarchy.type',
      'hierarchy.object_uuid as objectUuid',
      'hierarchy.obj_parent_uuid as objParentUuid',
      'hierarchy.custom',
      'variable.name as variableName',
      'value.name as valueName',
      'variable.abbreviation as varAbbreviation',
      'value.abbreviation as valAbbreviation',
      'variable.uuid as variableUuid',
      'value.uuid as valueUuid'
    )
    .leftJoin('variable', 'variable.uuid', 'hierarchy.object_uuid')
    .leftJoin('value', 'value.uuid', 'hierarchy.object_uuid');

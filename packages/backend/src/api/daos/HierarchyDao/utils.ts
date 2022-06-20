import { knexRead } from '@/connection';
import { Knex } from 'knex';

export const getTreeNodeQuery = (trx?: Knex.Transaction) => {
  const k = trx || knexRead();
  return k('hierarchy')
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
      'value.uuid as valueUuid',
      'hierarchy.role'
    )
    .leftJoin('variable', 'variable.uuid', 'hierarchy.object_uuid')
    .leftJoin('value', 'value.uuid', 'hierarchy.object_uuid');
};

import knex from '@/connection';
import { Knex } from 'knex';

export const getHierarchyRowQuery = (trx?: Knex.Transaction) => {
  const k = trx || knex;
  return k('hierarchy')
    .select(
      'hierarchy.uuid',
      'hierarchy.parent_uuid as parentUuid',
      'hierarchy.type',
      'hierarchy.role',
      'hierarchy.object_uuid as objectUuid',
      'hierarchy.obj_parent_uuid as objectParentUuid',
      'hierarchy.custom',
      'h2.obj_parent_uuid as objectGrandparentUuid'
    )
    .leftJoin('hierarchy as h2', 'hierarchy.parent_uuid', 'h2.uuid');
};

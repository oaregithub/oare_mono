import {
  HierarchyRow,
  TaxonomyPropertyTree,
  HierarchyData,
  HierarchyTopNode,
  PropertyVariable,
  VariableRow,
  PropertyValue,
  ValueRow,
  TextTransliterationStatus,
} from '@oare/types';
import knex from '@/connection';
import sl from '@/serviceLocator';
import { Knex } from 'knex';

// COMPLETE

class HierarchyDao {
  /**
   * Base query for retrieving hierarchy rows for building a tree.
   * @param trx Knex Transaction. Optional.
   * @returns Knex query builder.
   */
  private getHierarchyRowQuery = (
    trx?: Knex.Transaction
  ): Knex.QueryBuilder => {
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

  /**
   * Checks if a hierarchy node has children.
   * @param hierarchyUuid The UUID of the hierarchy node
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the hierarchy node has children.
   */
  private async hasChild(hierarchyUuid: string, trx?: Knex.Transaction) {
    const k = trx || knex;

    const rows = await k('hierarchy').where('parent_uuid', hierarchyUuid);

    if (rows && rows.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Constructs a taxonomy property tree.
   * @param trx Knex Transaction. Optional.
   * @returns Complete taxonomy property tree.
   */
  public async createPropertiesTaxonomyTree(
    trx?: Knex.Transaction
  ): Promise<TaxonomyPropertyTree> {
    const AliasDao = sl.get('AliasDao');
    const FieldDao = sl.get('FieldDao');

    const topNodeHierarchy: HierarchyData = await this.getHierarchyRowQuery(trx)
      .where('hierarchy.type', 'taxonomy')
      .where('hierarchy.role', 'tree')
      .first();

    const names = await AliasDao.getAliasNamesByReferenceUuid(
      topNodeHierarchy.objectUuid,
      trx
    );

    const fieldRows = await FieldDao.getFieldRowsByReferenceUuidAndType(
      topNodeHierarchy.objectUuid,
      'description',
      trx
    );

    const topNode: HierarchyTopNode = {
      hierarchy: topNodeHierarchy,
      name: names[0] ?? null,
      fieldInfo: fieldRows[0] ?? null,
      variables: await this.getVariablesByParent(
        topNodeHierarchy.uuid,
        null,
        trx
      ),
    };

    return {
      tree: topNode,
    };
  }

  /**
   * Constructs variable child objects for a given hierarchy node.
   * @param hierarchyUuid The UUID of the parent hierarchy node.
   * @param level The level of the parent hierarchy node.
   * @param trx Knex Transaction. Optional.
   * @returns Array of variable child objects.
   * @throws Error if one or more child variable rows are not found.
   */
  public async getVariablesByParent(
    hierarchyUuid: string,
    level: number | null,
    trx?: Knex.Transaction
  ): Promise<PropertyVariable[]> {
    const FieldDao = sl.get('FieldDao');

    const hasChild = await this.hasChild(hierarchyUuid, trx);

    if (hasChild) {
      const hierarchyRows: HierarchyData[] = await this.getHierarchyRowQuery(
        trx
      ).where('hierarchy.parent_uuid', hierarchyUuid);

      const variableRows = await Promise.all(
        hierarchyRows.map(row => this.getVariableRowByUuid(row.objectUuid, trx))
      );

      const fieldRows = await Promise.all(
        hierarchyRows.map(row =>
          FieldDao.getFieldRowsByReferenceUuidAndType(
            row.objectUuid,
            'description',
            trx
          )
        )
      );

      const propertyVariables: PropertyVariable[] = await Promise.all(
        variableRows.map(async (row, idx) => ({
          ...row,
          hierarchy: hierarchyRows[idx],
          level,
          fieldInfo: fieldRows[idx][0] ?? null,
          values: await this.getValuesByParent(
            hierarchyRows[idx].uuid,
            level === null ? 1 : level + 1,
            trx
          ),
        }))
      );

      return propertyVariables;
    }
    return [];
  }

  /**
   * Retrieves a variable row by UUID.
   * @param uuid The UUID of the variable row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single variable row.
   * @throws Error if variable row is not found.
   */
  private async getVariableRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<VariableRow> {
    const k = trx || knex;

    const variableRow: VariableRow | undefined = await k('variable')
      .select(
        'uuid',
        'name',
        'abbreviation',
        'type',
        'table_reference as tableReference'
      )
      .where({ uuid })
      .first();

    if (!variableRow) {
      throw new Error(`Variable with uuid ${uuid} not found`);
    }

    return variableRow;
  }

  /**
   * Constructs value child objects for a given hierarchy node.
   * @param hierarchyUuid The UUID of the parent hierarchy node.
   * @param level The level of the parent hierarchy node.
   * @param trx Knex Transaction. Optional.
   * @returns Array of value child objects.
   * @throws Error if one or more child value rows are not found.
   */
  private async getValuesByParent(
    hierarchyUuid: string,
    level: number | null,
    trx?: Knex.Transaction
  ): Promise<PropertyValue[]> {
    const FieldDao = sl.get('FieldDao');

    const hasChild = await this.hasChild(hierarchyUuid, trx);

    if (hasChild) {
      const hierarchyRows: HierarchyData[] = await this.getHierarchyRowQuery(
        trx
      ).where('hierarchy.parent_uuid', hierarchyUuid);

      const valueRows = await Promise.all(
        hierarchyRows.map(row => this.getValueRowByUuid(row.objectUuid, trx))
      );

      const fieldRows = await Promise.all(
        hierarchyRows.map(row =>
          FieldDao.getFieldRowsByReferenceUuidAndType(
            row.objectUuid,
            'description',
            trx
          )
        )
      );

      const propertyValues: PropertyValue[] = await Promise.all(
        valueRows.map(async (row, idx) => ({
          ...row,
          hierarchy: hierarchyRows[idx],
          fieldInfo: fieldRows[idx][0] ?? null,
          variables: await this.getVariablesByParent(
            hierarchyRows[idx].uuid,
            level,
            trx
          ),
        }))
      );

      return propertyValues;
    }
    return [];
  }

  /**
   * Retrieves a value row by UUID.
   * @param uuid The UUID of the value row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single value row.
   * @throws Error if value row is not found.
   */
  private async getValueRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ValueRow> {
    const k = trx || knex;

    const valueRow: ValueRow | undefined = await k('value')
      .select('uuid', 'name', 'abbreviation')
      .where({ uuid })
      .first();

    if (!valueRow) {
      throw new Error(`Value with uuid ${uuid} not found`);
    }

    return valueRow;
  }

  /**
   * Retrieves a list of text UUIDs in a given collection.
   * @param collectionUuid The UUID of the collection.
   * @param trx Knex Transaction. Optional.
   * @returns Array of text UUIDs.
   */
  public async getTextUuidsByCollectionUuid(
    collectionUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows = await k('hierarchy')
      .pluck('object_uuid')
      .where('obj_parent_uuid', collectionUuid);

    return rows;
  }

  /**
   * Inserts a hierarchy row.
   * @param row The hierarchy row to insert.
   * @param trx Knex Transaction. Optional.
   */
  public async insertHierarchyRow(row: HierarchyRow, trx?: Knex.Transaction) {
    const k = trx || knex;

    await k('hierarchy').insert({
      uuid: row.uuid,
      parent_uuid: row.parentUuid,
      type: row.type,
      role: row.role,
      object_uuid: row.objectUuid,
      obj_parent_uuid: row.objectParentUuid,
      published: row.published,
      custom: row.custom,
    });
  }

  /**
   * Removes all text hierarchy rows associated with a given text UUID. Used when a text is permanently deleted.
   * @param textUuid The UUID of the text whose hierarchy rows should be removed.
   * @param trx Knex Transaction. Optional.
   */
  public async removeHierarchyTextRowsByTextUuid(
    textUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('hierarchy').del().where({ object_uuid: textUuid, type: 'text' });
  }

  /**
   * Retrieves all hierarchy rows associated with a given object UUID.
   * @param objectUuid The object UUID of the hierarchy rows to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of hierarchy rows.
   * @throws Error if one or more hierarchy rows are not found.
   */
  public async getHierarchyRowsByObjectUuid(
    objectUuid: string,
    trx?: Knex.Transaction
  ): Promise<HierarchyRow[]> {
    const k = trx || knex;

    const hierarchyUuids = await this.getHierarchyUuidsByObjectUuid(
      objectUuid,
      trx
    );

    const rows = await Promise.all(
      hierarchyUuids.map(uuid => this.getHierarchyRowByUuid(uuid, trx))
    );

    return rows;
  }

  /**
   * Retrieves list of all hierarchy rows associated with a given object UUID.
   * @param objectUuid The object UUID of the hierarchy rows whose UUIDs to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of hierarchy UUIDs.
   */
  private async getHierarchyUuidsByObjectUuid(
    objectUuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const rows = await k('hierarchy')
      .pluck('uuid')
      .where({ object_uuid: objectUuid });

    return rows;
  }

  /**
   * Retrieves a hierarchy row by UUID.
   * @param uuid The UUID of the hierarchy row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single hierarchy row.
   * @throws Error if hierarchy row is not found.
   */
  private async getHierarchyRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<HierarchyRow> {
    const k = trx || knex;

    const row: HierarchyRow | undefined = await k('hierarchy')
      .select(
        'uuid',
        'parent_uuid as parentUuid',
        'type',
        'role',
        'object_uuid as objectUuid',
        'obj_parent_uuid as objectParentUuid',
        'published',
        'custom'
      )
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Hierarchy row with uuid ${uuid} not found`);
    }

    return row;
  }

  /**
   * Retrieves a list of transliteration options.
   * @param trx Knex Transaction. Optional.
   * @returns Array of transliteration options.
   */
  public async getTransliterationOptions(trx?: Knex.Transaction) {
    const k = trx || knex;

    const transliterationOptions: TextTransliterationStatus[] = await k(
      'hierarchy'
    )
      .select(
        'hierarchy.object_uuid as uuid',
        'a1.name as color',
        'field.field as colorMeaning'
      )
      .innerJoin('alias as a1', 'a1.reference_uuid', 'hierarchy.object_uuid')
      .innerJoin(
        'alias as a2',
        'a2.reference_uuid',
        'hierarchy.obj_parent_uuid'
      )
      .innerJoin('field', 'hierarchy.object_uuid', 'field.reference_uuid')
      .where('a2.name', 'transliteration status');

    return transliterationOptions;
  }

  /**
   * Retrieves a transliteration option by UUID. The translit_status column in the `text` table refers to the UUID of a transliteration option.
   * @param uuid The UUID of the transliteration option to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns A transliteration option.
   */
  public async getTextTransliterationStatusByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<TextTransliterationStatus> {
    const k = trx || knex;

    const transliterationOption: TextTransliterationStatus = await k(
      'hierarchy'
    )
      .select(
        'hierarchy.object_uuid as uuid',
        'alias.name as color',
        'field.field as colorMeaning'
      )
      .innerJoin('alias', 'alias.reference_uuid', 'hierarchy.object_uuid')
      .innerJoin('field', 'field.reference_uuid', 'hierarchy.object_uuid')
      .where({ 'hierarchy.object_uuid': uuid })
      .first();

    return transliterationOption;
  }
}

/**
 * HierarchyDao instance as a singleton.
 */
export default new HierarchyDao();

import {
  LinkItem,
  Seal,
  SealCore,
  SealImpression,
  SealImpressionCore,
  SpatialUnitRow,
} from '@oare/types';
import { Knex } from 'knex';
import knex from '@/connection';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';

// COMPLETE

class SpatialUnitDao {
  /**
   * Searches for spatial units by name or UUID. Used for autocomplete when connecting link properties.
   * @param search The search string. Could be a UUID or a name.
   * @param trx Knex Transaction. Optional.
   * @returns Array of matching, ordered `LinkItem` objects.
   */
  public async searchSpatialUnitsLinkProperties(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knex;

    const rows: LinkItem[] = await k('spatial_unit')
      .innerJoin('alias', 'alias.reference_uuid', 'spatial_unit.uuid')
      .select('spatial_unit.uuid as objectUuid', 'alias.name as objectDisplay')
      .where(k.raw('LOWER(alias.name)'), 'like', `%${search.toLowerCase()}%`)
      .orWhereRaw('binary spatial_unit.uuid = binary ?', search)
      .orderByRaw(
        `CASE WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}' THEN 1 WHEN LOWER(alias.name) LIKE '${search.toLowerCase()}%' THEN 2 WHEN LOWER(alias.name) LIKE '%${search.toLowerCase()}' THEN 4 ELSE 3 END`
      )
      .orderByRaw('LOWER(alias.name)');

    return rows;
  }

  /**
   * Retrieves a single spatial unit row by UUID.
   * @param uuid The UUID of the spatial unit row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Single spatial unit row.
   * @throws Error if no spatial unit is found with the given UUID.
   */
  private async getSpatialUnitRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<SpatialUnitRow> {
    const k = trx || knex;

    const row: SpatialUnitRow | undefined = await k('spatial_unit')
      .select('uuid', 'type', 'tree_abb as treeAbb')
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`No spatial unit found with UUID ${uuid}`);
    }

    return row;
  }

  /**
   * Retrieves a list of all seal UUIDs.
   * @param trx Knex Transaction. Optional.
   * @returns Array of seal UUIDs.
   */
  public async getAllSealUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('spatial_unit')
      .pluck('uuid')
      .where({ tree_abb: 'Seal_Cat' });

    return uuids;
  }

  /**
   * Constructs SealCore object for a given seal UUID.
   * @param uuid The UUID of the seal.
   * @param trx Knex Transaction. Optional.
   * @returns Complete SealCore object.
   * @throws Error if no seal is found with the given UUID.
   */
  public async getSealCoreByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<SealCore> {
    const AliasDao = sl.get('AliasDao');

    const spatialUnitRow = await this.getSpatialUnitRowByUuid(uuid, trx);

    const names = await AliasDao.getAliasNamesByReferenceUuid(uuid, trx);
    const name = names[0] || '';

    const imageLinks: string[] = []; // Will be added in cache filter

    const occurrences = 0; // Will be added in cache filter

    const sealCore: SealCore = {
      ...spatialUnitRow,
      name,
      imageLinks,
      occurrences,
    };

    return sealCore;
  }

  /**
   * Constructs Seal object for a given seal UUID.
   * @param uuid The UUID of the seal.
   * @param trx Knex Transaction. Optional.
   * @returns Complete Seal object.
   * @throws Error if no seal is found with the given UUID.
   */
  public async getSealByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Seal> {
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');

    const sealCore = await this.getSealCoreByUuid(uuid, trx);

    const properties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
      uuid,
      trx
    );

    const owner = await this.getSealOwner(uuid, trx);

    const impressions: SealImpression[] = []; // Will be added in cache filter

    const seal: Seal = {
      ...sealCore,
      properties,
      owner,
      impressions,
    };

    return seal;
  }

  /**
   * Checks if a spatial unit exists with the given UUID.
   * @param uuid The UUID of the spatial unit.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the spatial unit exists.
   */
  public async spatialUnitExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const row = await k('spatial_unit').first().where({ uuid });

    return !!row;
  }

  /**
   * Retrieves number of seal impressions occurrences for a given seal UUID. Filters occurrences found in texts that the user does not have access to.
   * @param uuid The UUID of the seal.
   * @param textsToHide Array of text UUIDs that the user does not have access to.
   * @param trx Knex Transaction. Optional.
   * @returns Number of seal impression occurrences.
   */
  public async getSealImpressionOccurrencesBySealUuid(
    uuid: string,
    textsToHide: string[],
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knex;

    const count = await k('spatial_unit as su')
      .count({ count: 'su.uuid' })
      .leftJoin('item_properties as ip', 'ip.object_uuid', 'su.uuid')
      .leftJoin('text_epigraphy as te', 'te.uuid', 'ip.reference_uuid')
      .where({ tree_abb: 'Seal_Cat', 'su.type': 'object', 'su.uuid': uuid })
      .whereNotNull('te.text_uuid')
      .whereNotIn('te.text_uuid', textsToHide)
      .first();

    return count ? Number(count.count) : 0;
  }

  /**
   * Retrieves seal impression core objects for a given seal UUID. Filters impressions found in texts that the user does not have access to.
   * @param uuid The UUID of the seal.
   * @param textsToHide Array of text UUIDs that the user does not have access to.
   * @param trx Knex Transaction. Optional.
   * @returns Array of seal impression core objects.
   */
  private async getSealImpressionCoresBySealUuid(
    uuid: string,
    textsToHide: string[],
    trx?: Knex.Transaction
  ): Promise<SealImpressionCore[]> {
    const k = trx || knex;

    const rows: SealImpressionCore[] = await k('spatial_unit as su')
      .leftJoin('item_properties as ip', 'ip.object_uuid', 'su.uuid')
      .leftJoin('text_epigraphy as te', 'te.uuid', 'ip.reference_uuid')
      .leftJoin('person as p', 'p.uuid', 'ip.object_uuid')
      .leftJoin('dictionary_word as dw1', 'dw1.uuid', 'p.name_uuid')
      .leftJoin('dictionary_word as dw2', 'dw2.uuid', 'p.relation_name_uuid')
      .where({ tree_abb: 'Seal_Cat', 'su.type': 'object', 'su.uuid': uuid })
      .whereNotNull('te.text_uuid')
      .whereNotIn('te.text_uuid', textsToHide)
      .select(
        'te.text_uuid as textUuid',
        'te.side as side',
        k.raw('CONCAT(dw1.word, " ", p.relation, " ", dw2.word) as user')
      );

    return rows;
  }

  /**
   * Retrieves seal impressions for a given seal UUID. Filters impressions found in texts that the user does not have access to.
   * @param uuid The UUID of the seal.
   * @param textsToHide Array of text UUIDs that the user does not have access to.
   * @param trx Knex Transaction. Optional.
   * @returns Array of seal impressions.
   */
  public async getSealImpressionsBySealUuid(
    uuid: string,
    textsToHide: string[],
    trx?: Knex.Transaction
  ): Promise<SealImpression[]> {
    const TextDao = sl.get('TextDao');

    const sealImpressionCores = await this.getSealImpressionCoresBySealUuid(
      uuid,
      textsToHide,
      trx
    );

    const texts = await Promise.all(
      sealImpressionCores.map(core => TextDao.getTextByUuid(core.textUuid, trx))
    );

    const sealImpressions: SealImpression[] = sealImpressionCores.map(
      (core, idx) => ({
        ...core,
        text: texts[idx],
      })
    );

    return sealImpressions;
  }

  /**
   * Retrieves seal owner for a given seal UUID.
   * @param uuid The UUID of the seal.
   * @param trx Knex Transaction. Optional.
   * @returns Seal owner string or null if owner not assigned.
   */
  public async getSealOwner(uuid: string, trx?: Knex): Promise<string | null> {
    const k = trx || knex;

    const sealOwner: { name: string | null } | undefined = await k(
      'spatial_unit as su'
    )
      .innerJoin('item_properties as ip', 'ip.reference_uuid', 'su.uuid')
      .innerJoin('person as p', 'p.uuid', 'ip.object_uuid')
      .leftJoin('dictionary_word as dw1', 'dw1.uuid', 'p.name_uuid')
      .leftJoin('dictionary_word as dw2', 'dw2.uuid', 'p.relation_name_uuid')
      .where({ tree_abb: 'Seal_Cat', 'su.type': 'object', 'su.uuid': uuid })
      .select(k.raw('CONCAT(dw1.word, " ", p.relation, " ", dw2.word) as name'))
      .first();

    if (sealOwner && sealOwner.name) {
      return sealOwner.name.trim();
    }

    return null;
  }

  /**
   * Retrieves image URLs for a given seal UUID. Filters images that the user does not have access to.
   * @param uuid The UUID of the seal.
   * @param imagesToHide Array of image UUIDs that the user does not have access to.
   * @param trx Knex Transaction. Optional.
   * @returns Array of image URLs.
   */
  public async getImageLinksBySealUuid(
    uuid: string,
    imagesToHide: string[],
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const ErrorsDao = sl.get('ErrorsDao');
    const s3 = new AWS.S3();

    const k = trx || knex;

    const imageLinkRows: { link: string; container: string }[] = await k(
      'spatial_unit as su'
    )
      .join('link as l', 'l.reference_uuid', 'su.uuid')
      .join('resource as re', 'l.obj_uuid', 're.uuid')
      .where({ tree_abb: 'Seal_Cat', 'su.uuid': uuid })
      .whereNotIn('re.uuid', imagesToHide)
      .select('re.link', 're.container');

    let imageLinks: string[] = [];

    try {
      imageLinks = await Promise.all(
        imageLinkRows.map(imageLinkRow =>
          s3.getSignedUrlPromise('getObject', {
            Bucket: imageLinkRow.container,
            Key: imageLinkRow.link,
            Expires: 15778800,
          })
        )
      );
    } catch {
      await ErrorsDao.logError(
        null,
        'Error getting seal image linkes',
        null,
        'In Progress',
        trx
      );
      imageLinks = [];
    }

    return imageLinks;
  }
}

/**
 * SpatialUnitDao instance as a singleton
 */
export default new SpatialUnitDao();

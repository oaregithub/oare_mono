import knex from '@/connection';
import { Archive, ArchiveRow, Dossier } from '@oare/types';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

// COMPLETE

class ArchiveDao {
  /**
   * Retrieves an archive row by its UUID.
   * @param uuid The UUID of the archive row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Archive row.
   * @throws Error if no archive row found.
   */
  private async getArchiveRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<ArchiveRow> {
    const k = trx || knex;

    const archiveRow: ArchiveRow | undefined = await k('archive')
      .select(
        'uuid',
        'parent_uuid as parentUuid',
        'name',
        'owner',
        'arch_locus as archLocus',
        'current_editor as currentEditor',
        'type'
      )
      .where({ uuid })
      .first();

    if (!archiveRow) {
      throw new Error(`Archive with uuid ${uuid} does not exist`);
    }

    return archiveRow;
  }

  /**
   * Checks if an archive exists.
   * @param uuid The UUID of the archive to check.
   * @param trx Knex Transaction. Optional.
   * @returns Boolean indicating whether the archive exists.
   */
  public async archiveExists(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<boolean> {
    const k = trx || knex;

    const archive = await k('archive').first().where({ uuid });

    return !!archive;
  }

  /**
   * Gets list of dossier UUIDs that are children of the given archive UUID.
   * @param uuid The UUID of the archive whose dossier children to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Array of dossier UUIDs.
   */
  private async getDossierUuidsByArchiveUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const dossierUuids: string[] = await k('archive')
      .pluck('uuid')
      .where({ parent_uuid: uuid })
      .orderBy('name');

    return dossierUuids;
  }

  /**
   * Gets list of text UUIDs that are children of the given archive UUID.
   * Can also be used to get text Uuids that are children of a dossier.
   * @param uuid The UUID of the archive whose texts should be retrieved.
   * @param trx Knex Transaction. Optional.
   * @returns Array of text UUIDs.
   */
  private async getTextUuidsByArchiveUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const textUuids: string[] = await k('archive')
      .pluck('text.uuid')
      .innerJoin('link', 'link.obj_uuid', 'archive.uuid')
      .innerJoin('text', 'text.uuid', 'link.reference_uuid')
      .where('archive.uuid', uuid)
      .orderBy('text.name');

    return textUuids;
  }

  /**
   * Removes the link between the given text and archive/dossier.
   * Disconnect occurs in the `link` table.
   * @param textUuid The UUID of the text to disconnect.
   * @param archiveUuid The UUID of the archive or dossier to disconnect from.
   * @param trx Knex Transaction. Optional.
   */
  public async disconnectText(
    textUuid: string,
    archiveUuid: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knex;

    await k('link')
      .del()
      .where({ reference_uuid: textUuid, obj_uuid: archiveUuid });
  }

  /**
   * Gets a list of all archive UUIDs.
   * @param trx Knex Transaction. Optional.
   * @returns Array of archive UUIDs.
   */
  public async getAllArchiveUuids(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knex;

    const uuids: string[] = await k('archive')
      .innerJoin(
        'archive as archive_parent',
        'archive_parent.uuid',
        'archive.parent_uuid'
      )
      .pluck('archive.uuid')
      .where('archive_parent.type', 'hierarchy')
      .andWhere('archive_parent.name', 'head_archive_unit')
      .orderBy('archive.name');

    return uuids;
  }

  /**
   * Constructs complete Dossier object for the given dossier UUID.
   * @param uuid The UUID of the dossier to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Dossier object.
   * @throws Error if no archive row found for the dossier or other dossier data is missing.
   */
  public async getDossierByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Dossier> {
    const TextDao = sl.get('TextDao');

    const dossierRow = await this.getArchiveRowByUuid(uuid, trx);

    const textUuids = await this.getTextUuidsByArchiveUuid(uuid, trx);
    const texts = await Promise.all(
      textUuids.map(textUuid => TextDao.getTextByUuid(textUuid, trx))
    );

    const dossier: Dossier = {
      ...dossierRow,
      texts,
    };

    return dossier;
  }

  /**
   * Constructs complete Archive object for the given archive UUID.
   * @param uuid The UUID of the archive to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns Archive object.
   * @throws Error if no archive row found or other archive data is missing.
   */
  public async getArchiveByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Archive> {
    const TextDao = sl.get('TextDao');
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const FieldDao = sl.get('FieldDao');

    const archiveRow = await this.getArchiveRowByUuid(uuid, trx);

    const dossierUuids = await this.getDossierUuidsByArchiveUuid(uuid, trx);
    const dossiers = await Promise.all(
      dossierUuids.map(dossierUuid => this.getDossierByUuid(dossierUuid, trx))
    );

    const textUuids = await this.getTextUuidsByArchiveUuid(uuid, trx);
    const texts = await Promise.all(
      textUuids.map(textUuid => TextDao.getTextByUuid(textUuid, trx))
    );

    const descriptions = await FieldDao.getFieldRowsByReferenceUuidAndType(
      uuid,
      'description',
      trx
    );

    const itemProperties = await ItemPropertiesDao.getItemPropertiesByReferenceUuid(
      uuid
    );
    const referringWorkProperties = itemProperties.filter(
      p => p.variableUuid === 'b3938276-173b-11ec-8b77-024de1c1cc1d'
    );
    const bibliographyUuids = referringWorkProperties
      .map(p => p.objectUuid)
      .filter((u): u is string => !!u);

    const archive: Archive = {
      ...archiveRow,
      descriptions,
      bibliographyUuids,
      dossiers,
      texts,
    };
    return archive;
  }
}

/**
 * ArchiveDao instance as a singleton
 */
export default new ArchiveDao();

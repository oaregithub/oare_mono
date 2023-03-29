import { knexRead } from '@/connection';
import {
  Archive,
  Dossier,
  Text,
  ArchiveInfo,
  DossierInfo,
  FieldInfo,
} from '@oare/types';
import sl from '@/serviceLocator';
import { Knex } from 'knex';
import { ignorePunctuation } from '../TextEpigraphyDao/utils';

class ArchiveDao {
  async getAllArchives(trx?: Knex.Transaction): Promise<string[]> {
    const k = trx || knexRead();
    const uuids: string[] = await k('archive')
      .pluck('archive.uuid')
      .where('parent_uuid', 'b0fe5c7d-6c1c-11ec-bcc3-0282f921eac9');

    return uuids;
  }

  async getArchiveByUuid(
    uuid: string,
    userUuid: string | null,
    { page = 1, rows = 10, search = '' },
    trx?: Knex.Transaction
  ): Promise<Archive> {
    const k = trx || knexRead();
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const archive: Archive = await k('archive')
      .select(
        'archive.id as id',
        'archive.uuid as uuid',
        'archive.parent_uuid as parentUuid',
        'archive.name as name',
        'archive.owner as owner',
        'archive.arch_locus as archLocus'
      )
      .where('archive.uuid', uuid)
      .first();

    const dossierUuids = await this.getArchiveDossiers(
      uuid,
      {
        page,
        rows,
        search,
      },
      trx
    );
    archive.dossiersInfo = await Promise.all(
      dossierUuids.map(dossierUuid =>
        this.getDossierInfo(dossierUuid, userUuid, trx)
      )
    );
    archive.texts = await this.getArchiveTexts(
      uuid,
      userUuid,
      {
        page,
        rows,
        search,
      },
      trx
    );
    archive.totalTexts = await this.getTotalTexts(uuid, userUuid, trx);
    archive.totalDossiers = await this.getTotalDossiers(uuid, trx);
    archive.descriptions = await this.getArchiveDescriptions(uuid, trx);
    archive.bibliographyUuid =
      (
        await ItemPropertiesDao.getObjectUuidsByReferenceAndVariable(
          uuid,
          'b3938276-173b-11ec-8b77-024de1c1cc1d'
        )
      )[0] ?? null;
    return archive;
  }

  async getArchiveDossiers(
    parentUuid: string,
    { page = 1, rows = 10, search = '' },
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const finalSearch: string = `%${search.replace(/\W/g, '%').toLowerCase()}%`;
    const uuids: string[] = await k('archive')
      .pluck('archive.uuid')
      .where('parent_uuid', parentUuid)
      .andWhere(function () {
        this.whereRaw('LOWER(archive.name) LIKE ?', [finalSearch]);
      })
      .orderBy('archive.name')
      .limit(rows)
      .offset((page - 1) * rows);

    return uuids;
  }

  async getArchiveInfo(
    uuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<ArchiveInfo> {
    const k = trx || knexRead();
    const ItemPropertiesDao = sl.get('ItemPropertiesDao');
    const archive: Archive = await k('archive')
      .select(
        'archive.id as id',
        'archive.uuid as uuid',
        'archive.parent_uuid as parentUuid',
        'archive.name as name',
        'archive.owner as owner',
        'archive.arch_locus as archLocus'
      )
      .where('archive.uuid', uuid)
      .first();

    const bibliographyUuid: string | null =
      (
        await ItemPropertiesDao.getObjectUuidsByReferenceAndVariable(
          uuid,
          'b3938276-173b-11ec-8b77-024de1c1cc1d'
        )
      )[0] ?? null;

    const archiveInfo: ArchiveInfo = {
      name: archive.name,
      uuid: archive.uuid,
      totalTexts: await this.getTotalTexts(uuid, userUuid, trx),
      totalDossiers: await this.getTotalDossiers(uuid, trx),
      descriptions: await this.getArchiveDescriptions(uuid),
      bibliographyUuid,
    };
    return archiveInfo;
  }

  async getArchiveDescriptions(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<FieldInfo[]> {
    const k = trx || knexRead();
    const descriptions: FieldInfo[] = await k('field as f')
      .where('f.reference_uuid', uuid)
      .orderBy('f.primacy');
    return descriptions;
  }

  async getArchiveTexts(
    uuid: string,
    userUuid: string | null,
    { page = 1, rows = 10, search = '' },
    trx?: Knex.Transaction
  ): Promise<Text[] | null> {
    const k = trx || knexRead();
    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid,
      trx
    );
    const finalSearch: string = ignorePunctuation(search);
    const texts: Text[] = await k('link')
      .select(
        'text.uuid as textUuid',
        'text.type as type',
        'text.display_name as name',
        'text.excavation_prfx as excavationPrefix',
        'text.excavation_no as excavationNumber',
        'text.museum_prfx as museumPrefix',
        'text.museum_no as museumNumber',
        'text.publication_prfx as publicationPrefix',
        'text.publication_no as publicationNumber'
      )
      .innerJoin('archive', 'link.obj_uuid', 'archive.uuid')
      .innerJoin('text', 'link.reference_uuid', 'text.uuid')
      .where('archive.uuid', uuid)
      .whereNotIn('text.uuid', textsToHide)
      .andWhere(function () {
        this.whereRaw('LOWER(text.display_name) REGEXP ?', [finalSearch])
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) REGEXP ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) REGEXP ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) REGEXP ?",
            [finalSearch]
          );
      })
      .orderBy('text.display_name')
      .limit(rows)
      .offset((page - 1) * rows);

    return texts || null;
  }

  async getDossierByUuid(
    uuid: string,
    userUuid: string | null,
    { page = 1, rows = 10, search = '' },
    trx?: Knex.Transaction
  ): Promise<Dossier> {
    const k = trx || knexRead();
    const dossier: Dossier = await k('archive')
      .select(
        'archive.id as id',
        'archive.uuid as uuid',
        'archive.parent_uuid as parentUuid',
        'archive.name as name',
        'archive.owner as owner'
      )
      .where('archive.uuid', uuid)
      .first();

    dossier.texts = await this.getDossierTexts(
      uuid,
      userUuid,
      {
        page,
        rows,
        search,
      },
      trx
    );

    dossier.totalTexts = await this.getTotalTexts(uuid, userUuid, trx);

    return dossier;
  }

  async getDossierInfo(
    uuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<DossierInfo> {
    const k = trx || knexRead();
    const dossier: Dossier = await k('archive')
      .select('archive.uuid as uuid', 'archive.name as name')
      .where('archive.uuid', uuid)
      .first();

    const dossierInfo: DossierInfo = {
      name: dossier.name,
      uuid: dossier.uuid,
      totalTexts: await this.getTotalTexts(uuid, userUuid, trx),
    };
    return dossierInfo;
  }

  async getDossierTexts(
    uuid: string,
    userUuid: string | null,
    { page = 1, rows = 10, search = '' },
    trx?: Knex.Transaction
  ): Promise<Text[] | null> {
    const k = trx || knexRead();
    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid,
      trx
    );
    const finalSearch: string = ignorePunctuation(search);
    const texts: Text[] = await k('link')
      .select(
        'text.uuid as textUuid',
        'text.type as type',
        'text.display_name as name',
        'text.excavation_prfx as excavationPrefix',
        'text.excavation_no as excavationNumber',
        'text.museum_prfx as museumPrefix',
        'text.museum_no as museumNumber',
        'text.publication_prfx as publicationPrefix',
        'text.publication_no as publicationNumber'
      )
      .innerJoin('archive', 'link.obj_uuid', 'archive.uuid')
      .innerJoin('text', 'link.reference_uuid', 'text.uuid')
      .where('archive.uuid', uuid)
      .whereNotIn('text.uuid', textsToHide)
      .andWhere(function () {
        this.whereRaw('LOWER(text.display_name) REGEXP ?', [finalSearch])
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) REGEXP ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) REGEXP ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) REGEXP ?",
            [finalSearch]
          );
      })
      .orderBy('text.display_name')
      .limit(rows)
      .offset((page - 1) * rows);

    return texts || null;
  }

  async getTotalDossiers(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knexRead();
    const totalDossiers = await k('archive')
      .select(k.raw('count(archive.uuid) as total'))
      .where('parent_uuid', uuid)
      .first();
    const total: number = Number(totalDossiers.total);
    return total;
  }

  async getTotalTexts(
    uuid: string,
    userUuid: string | null,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knexRead();

    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid,
      trx
    );
    const totalTexts = await k('link')
      .select(knexRead().raw('count(text.uuid) as total'))
      .innerJoin('archive', 'link.obj_uuid', 'archive.uuid')
      .innerJoin('text', 'link.reference_uuid', 'text.uuid')
      .where('archive.uuid', uuid)
      .whereNotIn('text.uuid', textsToHide)
      .first();
    const total: number = Number(totalTexts.total);
    return total;
  }
}
export default new ArchiveDao();

import { knexRead } from '@/connection';
import { Archive, Dossier, Text, ArchiveInfo, DossierInfo } from '@oare/types';
import sl from '@/serviceLocator';

class ArchiveDao {
  async getAllArchives(): Promise<string[]> {
    const uuids: string[] = await knexRead()('archive')
      .pluck('archive.uuid')
      .where('parent_uuid', 'b0fe5c7d-6c1c-11ec-bcc3-0282f921eac9');

    return uuids;
  }

  async getArchiveByUuid(
    uuid: string,
    userUuid: string | null,
    { page = 1, rows = 10, search = '' }
  ): Promise<Archive> {
    const archive: Archive = await knexRead()('archive')
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

    const dossierUuids = await this.getArchiveDossiers(uuid, {
      page,
      rows,
      search,
    });
    archive.dossiersInfo = await Promise.all(
      dossierUuids.map(dossierUuid =>
        this.getDossierInfo(dossierUuid, userUuid)
      )
    );
    archive.texts = await this.getArchiveTexts(uuid, userUuid, {
      page,
      rows,
      search,
    });
    archive.totalTexts = await this.getTotalTexts(uuid, userUuid);
    archive.totalDossiers = await this.getTotalDossiers(uuid);
    return archive;
  }

  async getArchiveDossiers(
    parentUuid: string,
    { page = 1, rows = 10, search = '' }
  ): Promise<string[]> {
    const finalSearch: string = `%${search.replace(/\W/g, '%').toLowerCase()}%`;
    const uuids: string[] = await knexRead()('archive')
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
    userUuid: string | null
  ): Promise<ArchiveInfo> {
    const archive: Archive = await knexRead()('archive')
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

    const archiveInfo: ArchiveInfo = {
      name: archive.name,
      uuid: archive.uuid,
      totalTexts: await this.getTotalTexts(uuid, userUuid),
      totalDossiers: await this.getTotalDossiers(uuid),
    };
    return archiveInfo;
  }

  async getArchiveTexts(
    uuid: string,
    userUuid: string | null,
    { page = 1, rows = 10, search = '' }
  ): Promise<Text[] | null> {
    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid
    );
    const finalSearch: string = `%${search.replace(/\W/g, '%').toLowerCase()}%`;
    const texts: Text[] = await knexRead()('link')
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
        this.whereRaw('LOWER(text.display_name) LIKE ?', [finalSearch])
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) LIKE ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) LIKE ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) LIKE ?",
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
    { page = 1, rows = 10, search = '' }
  ): Promise<Dossier> {
    const dossier: Dossier = await knexRead()('archive')
      .select(
        'archive.id as id',
        'archive.uuid as uuid',
        'archive.parent_uuid as parentUuid',
        'archive.name as name',
        'archive.owner as owner'
      )
      .where('archive.uuid', uuid)
      .first();

    dossier.texts = await this.getDossierTexts(uuid, userUuid, {
      page,
      rows,
      search,
    });

    dossier.totalTexts = await this.getTotalTexts(uuid, userUuid);

    return dossier;
  }

  async getDossierInfo(
    uuid: string,
    userUuid: string | null
  ): Promise<DossierInfo> {
    const dossier: Dossier = await knexRead()('archive')
      .select('archive.uuid as uuid', 'archive.name as name')
      .where('archive.uuid', uuid)
      .first();

    const dossierInfo: DossierInfo = {
      name: dossier.name,
      uuid: dossier.uuid,
      totalTexts: await this.getTotalTexts(uuid, userUuid),
    };
    return dossierInfo;
  }

  async getDossierTexts(
    uuid: string,
    userUuid: string | null,
    { page = 1, rows = 10, search = '' }
  ): Promise<Text[] | null> {
    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid
    );
    const finalSearch: string = `%${search.replace(/\W/g, '%').toLowerCase()}%`;
    const texts: Text[] = await knexRead()('link')
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
        this.whereRaw('LOWER(text.display_name) LIKE ?', [finalSearch])
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.excavation_prfx, ''), ' ', IFNULL(text.excavation_no, ''))) LIKE ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.publication_prfx, ''), ' ', IFNULL(text.publication_no, ''))) LIKE ?",
            [finalSearch]
          )
          .orWhereRaw(
            "LOWER(CONCAT(IFNULL(text.museum_prfx, ''), ' ', IFNULL(text.museum_no, ''))) LIKE ?",
            [finalSearch]
          );
      })
      .orderBy('text.display_name')
      .limit(rows)
      .offset((page - 1) * rows);

    return texts || null;
  }

  async getTotalDossiers(uuid: string): Promise<number> {
    const totalDossiers = await knexRead()('archive')
      .select(knexRead().raw('count(archive.uuid) as total'))
      .where('parent_uuid', uuid)
      .first();
    const total: number = Number(totalDossiers.total);
    return total;
  }

  async getTotalTexts(uuid: string, userUuid: string | null): Promise<number> {
    const collectionTextUtils = sl.get('CollectionTextUtils');
    const textsToHide: string[] = await collectionTextUtils.textsToHide(
      userUuid
    );
    const totalTexts = await knexRead()('link')
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

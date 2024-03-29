import { knexRead, knexWrite } from '@/connection';
import { SealImpression, SealNameUuid, SealProperty } from '@oare/types';
import sl from '@/serviceLocator';
import AWS from 'aws-sdk';
import { Knex } from 'knex';

class SealDao {
  async getSeals(trx?: Knex): Promise<SealNameUuid[]> {
    const k = trx || knexRead();
    const seals: SealNameUuid[] = await k('alias as a')
      .join('spatial_unit as su', 'su.uuid', 'a.reference_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .groupBy('su.uuid')
      .select('su.uuid as uuid', 'a.name as name');

    return seals;
  }

  async getSealByUuid(sealUuid: string, trx?: Knex): Promise<SealNameUuid> {
    const k = trx || knexRead();
    const seals: SealNameUuid = await k('alias as a')
      .join('spatial_unit as su', 'su.uuid', 'a.reference_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.uuid', sealUuid)
      .groupBy('su.uuid')
      .select('su.uuid as uuid', 'a.name as name')
      .first();

    return seals;
  }

  async getImagesBySealUuid(sealUuid: string, trx?: Knex): Promise<string[]> {
    const k = trx || knexRead();

    const imageLinkRows: { link: string; container: string }[] = await k(
      'spatial_unit as su'
    )
      .join('link as l', 'l.reference_uuid', 'su.uuid')
      .join('resource as re', 'l.obj_uuid', 're.uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.uuid', sealUuid)
      .select('re.link', 're.container');

    const s3 = new AWS.S3();
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
      imageLinks = [];
    }

    return imageLinks;
  }

  async getSealImpressionCountBySealUuid(
    sealUuid: string,
    textsToHide: string[],
    trx?: Knex
  ): Promise<number> {
    const k = trx || knexRead();

    const count: { count: number } = await k('spatial_unit as su')
      .leftJoin('item_properties as ip', 'ip.object_uuid', 'su.uuid')
      .leftJoin('text_epigraphy as te', 'te.uuid', 'ip.reference_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.type', 'object')
      .andWhere('su.uuid', sealUuid)
      .whereNotNull('te.text_uuid')
      .select(k.raw('COUNT(su.uuid) as count'))
      .first()
      .modify(qb => {
        if (textsToHide) {
          qb.whereNotIn('te.text_uuid', textsToHide);
        }
      });

    return Number(count?.count) || 0;
  }

  async getSealImpressionsBySealUuid(
    sealUuid: string,
    textsToHide: string[],
    trx?: Knex
  ): Promise<SealImpression[]> {
    const k = trx || knexRead();
    const TextDao = sl.get('TextDao');

    const sealImpressionRows: {
      textUuid: string;
      side: number | null;
      user: string | null;
    }[] = await k('spatial_unit as su')
      .leftJoin('item_properties as ip', 'ip.object_uuid', 'su.uuid')
      .leftJoin('text_epigraphy as te', 'te.uuid', 'ip.reference_uuid')
      .leftJoin('person as p', 'p.uuid', 'ip.object_uuid')
      .leftJoin('dictionary_word as dw1', 'dw1.uuid', 'p.name_uuid')
      .leftJoin('dictionary_word as dw2', 'dw2.uuid', 'p.relation_name_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.type', 'object')
      .andWhere('su.uuid', sealUuid)
      .whereNotNull('te.text_uuid')
      .select(
        'te.text_uuid as textUuid',
        'te.side as side',
        k.raw('CONCAT(dw1.word, " ", p.relation, " ", dw2.word) as user')
      )
      .modify(qb => {
        if (textsToHide) {
          qb.whereNotIn('te.text_uuid', textsToHide);
        }
      });

    const sealImpressions: SealImpression[] = ((
      await Promise.all(
        sealImpressionRows.map(async row => ({
          text: await TextDao.getTextByUuid(row.textUuid),
          side: row.side ? row.side : 0,
          user: row.user ? row.user.trim() : '',
        }))
      )
    ).filter(
      impression => impression.text !== null
    ) as unknown) as SealImpression[];
    return sealImpressions;
  }

  async getSealOwner(
    sealUuid: string,
    trx?: Knex
  ): Promise<SealProperty | null> {
    const k = trx || knexRead();
    const sealOwner: { name: string } = await k('spatial_unit as su')
      .innerJoin('item_properties as ip', 'ip.reference_uuid', 'su.uuid')
      .innerJoin('person as p', 'p.uuid', 'ip.object_uuid')
      .leftJoin('dictionary_word as dw1', 'dw1.uuid', 'p.name_uuid')
      .leftJoin('dictionary_word as dw2', 'dw2.uuid', 'p.relation_name_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.type', 'object')
      .andWhere('su.uuid', sealUuid)
      .select(k.raw('CONCAT(dw1.word, " ", p.relation, " ", dw2.word) as name'))
      .first();

    if (sealOwner && sealOwner.name) {
      return { 'Owner/user': sealOwner.name.trim() };
    }
    return null;
  }

  async getSealProperties(
    sealUuid: string,
    trx?: Knex
  ): Promise<SealProperty[]> {
    const k = trx || knexRead();

    const sealProperties: SealProperty[] = await k('spatial_unit as su')
      .leftJoin('item_properties as ip', 'ip.reference_uuid', 'su.uuid')
      .leftJoin('alias as a', 'a.reference_uuid', 'ip.variable_uuid')
      .where('su.tree_abb', 'Seal_Cat')
      .andWhere('su.type', 'object')
      .whereNot('a.name', '.')
      .andWhere('ip.level', '>', 1)
      .andWhere('su.uuid', sealUuid)
      .select('a.name as name', 'ip.value as value')
      .then((val: { name: string | null; value: string | null }[]) => {
        const properties: SealProperty[] = [];
        val.forEach(v => {
          if (v.name && v.value) {
            properties.push({ [v.name]: v.value });
          }
        });
        return properties;
      });

    const owner: SealProperty | null = await this.getSealOwner(sealUuid, trx);

    return owner ? [...sealProperties, owner] : sealProperties;
  }

  async updateSealSpelling(
    uuid: string,
    sealName: string,
    trx?: Knex.Transaction
  ): Promise<void> {
    const k = trx || knexWrite();
    await k('alias').update({ name: sealName }).where({ reference_uuid: uuid });
  }

  async getLinkedSealUuid(
    textEpigraphyUuid: string,
    trx?: Knex
  ): Promise<string | null> {
    const k = trx || knexRead();
    const linkedSealUuid: string | null = await k('item_properties as ip')
      .where('ip.reference_uuid', textEpigraphyUuid)
      .andWhere('ip.variable_uuid', 'f32e6903-67c9-41d8-840a-d933b8b3e719')
      .whereNotNull('ip.object_uuid')
      .select('ip.object_uuid')
      .first()
      .then((val: { object_uuid: string | null }) => val?.object_uuid || null);
    return linkedSealUuid;
  }

  async getSealLinkParentUuid(
    textEpigraphyUuid: string,
    trx?: Knex
  ): Promise<string> {
    const k = trx || knexRead();
    const sealLinkParentUuid: string = await k('item_properties as ip')
      .where('ip.reference_uuid', textEpigraphyUuid)
      .andWhere('ip.value_uuid', 'ec820e17-ecc7-492f-86a7-a01b379622e1')
      .select('ip.object_uuid')
      .first()
      .then((val: { uuid: string }) => val.uuid);
    return sealLinkParentUuid;
  }
}

export default new SealDao();

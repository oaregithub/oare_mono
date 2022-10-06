import { knexRead } from '@/connection';
import { UuidRow, SignCode, SignList, SignListReading } from '@oare/types';
import { formattedSearchCharacter } from '@/api/daos/TextEpigraphyDao/utils';
import { Knex } from 'knex';

class SignReadingDao {
  async hasSign(sign: string, trx?: Knex.Transaction): Promise<boolean> {
    const k = trx || knexRead();
    const row = await k('sign_reading').where('reading', sign).first();
    return !!row;
  }

  /**
   * Gets all valid sign uuids from array of possible intellisearch signs
   * @param signs array of all possible signs from intellisearch query
   * @returns sign uuids for valid signs found in the array of possible signs
   */
  async getIntellisearchSignUuids(
    signs: string[],
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const rows: UuidRow[] = await k('sign_reading')
      .select('uuid')
      .whereIn('reading', signs);
    return rows.map(row => row.uuid);
  }

  async getMatchingSigns(
    sign: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knexRead();
    const matchingSigns = await k('sign_reading AS sr1')
      .select('sr2.reading')
      .innerJoin(
        'sign_reading AS sr2',
        'sr1.reference_uuid',
        'sr2.reference_uuid'
      )
      .where('sr1.reading', sign);
    return matchingSigns.map(row => row.reading);
  }

  async getSignCode(
    sign: string,
    isDeterminative: boolean,
    trx?: Knex.Transaction
  ): Promise<SignCode> {
    const k = trx || knexRead();
    const imageCodeArray = await k('sign_reading')
      .select(
        'sign_org.org_num as signCode',
        'sign_reading.reference_uuid as signUuid',
        'sign_reading.uuid as readingUuid',
        'sign_reading.value as value',
        'sign_reading.type as type'
      )
      .leftJoin(
        'sign_org',
        'sign_org.reference_uuid',
        'sign_reading.reference_uuid'
      )
      .where('sign_org.type', 'MZL')
      .andWhere('sign_org.has_png', true)
      .andWhere('sign_reading.reading', sign)
      .andWhereNot('sign_reading.type', 'uninterpreted')
      .modify(qb => {
        if (isDeterminative) {
          qb.where('sign_reading.type', 'determinative');
        } else {
          qb.whereNot('sign_reading.type', 'determinative');
        }
      })
      .first();
    const imageCode: string | null = imageCodeArray
      ? imageCodeArray.signCode
      : null;

    if (imageCode) {
      const newSign = await k('sign')
        .select('name')
        .where('uuid', imageCodeArray.signUuid)
        .first();
      return {
        signUuid: imageCodeArray.signUuid,
        readingUuid: imageCodeArray.readingUuid,
        type: 'image',
        code: imageCode,
        sign: newSign.name,
        value: imageCodeArray.value,
        readingType: imageCodeArray.type,
      };
    }

    const fontCodeArray = await k('sign')
      .select(
        'sign.font_code as fontCode',
        'sign_reading.reference_uuid as signUuid',
        'sign_reading.uuid as readingUuid',
        'sign_reading.value as value',
        'sign_reading.type as type'
      )
      .innerJoin('sign_reading', 'sign_reading.reference_uuid', 'sign.uuid')
      .where('sign_reading.reading', sign)
      .andWhereNot('sign_reading.type', 'uninterpreted')
      .modify(qb => {
        if (isDeterminative) {
          qb.where('sign_reading.type', 'determinative');
        } else {
          qb.whereNot('sign_reading.type', 'determinative');
        }
      })
      .first();
    const fontCode: string | null = fontCodeArray
      ? fontCodeArray.fontCode
      : null;
    if (fontCode) {
      const newSign = await k('sign')
        .select('name')
        .where('uuid', fontCodeArray.signUuid)
        .first();
      return {
        signUuid: fontCodeArray.signUuid,
        readingUuid: fontCodeArray.readingUuid,
        type: 'utf8',
        code: fontCode,
        sign: newSign.name,
        value: fontCodeArray.value,
        readingType: fontCodeArray.type,
      };
    }
    return {
      signUuid: null,
      readingUuid: null,
      type: null,
      code: null,
    };
  }

  async getFormattedSign(sign: string): Promise<string[]> {
    const formattedSign = formattedSearchCharacter(sign);
    return formattedSign;
  }

  async getSignList(trx?: Knex.Transaction): Promise<SignList[]> {
    const k = trx || knexRead();
    const signList: SignList[] = await k('sign_reading as sr')
      .join('sign as s', 's.uuid', 'sr.reference_uuid')
      .leftJoin('sign_org as so', function () {
        this.on('so.reference_uuid', 's.uuid').andOn(
          k.raw('so.type = ?', ['ABZ'])
        );
      })
      .leftJoin('sign_org as so1', function () {
        this.on('so1.reference_uuid', 's.uuid').andOn(
          k.raw('so1.type = ?', ['MZL'])
        );
      })
      .distinct({
        signUuid: 's.uuid',
        name: 's.name',
        abz: 'so.org_num',
        mzl: 'so1.org_num',
        fontCode: 's.font_code',
      })
      .modify(qb => {
        qb.select(
          k.raw('IF(so1.has_png = 0, so.has_png, so1.has_png) as hasPng')
        );
      });
    return signList;
  }

  async getReadingsForSignList(
    signUuid: string,
    trx?: Knex.Transaction
  ): Promise<SignListReading[]> {
    const k = trx || knexRead();
    const signReadings: SignListReading[] = await k('sign_reading as sr')
      .where('sr.reference_uuid', signUuid)
      .select({ uuid: 'sr.uuid', value: 'sr.value', type: 'sr.type' });
    const signReadingsWithCount: SignListReading[] = await Promise.all(
      signReadings.map(async s => ({
        ...s,
        count: await this.getReadingCount(s.uuid),
      }))
    );
    return signReadingsWithCount;
  }

  async getSignCount(
    signUuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knexRead();
    const signCount = await k('text_epigraphy as te')
      .count({ count: '*' })
      .where('te.sign_uuid', signUuid)
      .first();
    let count = 0;
    if (signCount) {
      count = Number(signCount.count) || 0;
    }
    return count;
  }

  async getReadingCount(
    readingUuid: string,
    trx?: Knex.Transaction
  ): Promise<number> {
    const k = trx || knexRead();
    const signCount = await k('text_epigraphy as te')
      .count({ count: '*' })
      .where('te.reading_uuid', readingUuid)
      .first();
    let count = 0;
    if (signCount) {
      count = Number(signCount.count) || 0;
    }
    return count;
  }
}

export default new SignReadingDao();

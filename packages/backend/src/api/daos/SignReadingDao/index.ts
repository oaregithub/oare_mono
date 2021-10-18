import knex from '@/connection';
import { UuidRow, SignCode } from '@oare/types';
import { formattedSearchCharacter } from '@/api/daos/TextEpigraphyDao/utils';

class SignReadingDao {
  async hasSign(sign: string): Promise<boolean> {
    const row = await knex('sign_reading').where('reading', sign).first();
    return !!row;
  }

  /**
   * Gets all valid sign uuids from array of possible intellisearch signs
   * @param signs array of all possible signs from intellisearch query
   * @returns sign uuids for valid signs found in the array of possible signs
   */
  async getIntellisearchSignUuids(signs: string[]): Promise<string[]> {
    const rows: UuidRow[] = await knex('sign_reading')
      .select('uuid')
      .whereIn('reading', signs);
    return rows.map(row => row.uuid);
  }

  async getMatchingSigns(sign: string): Promise<string[]> {
    const matchingSigns = await knex('sign_reading AS sr1')
      .select('sr2.reading')
      .innerJoin(
        'sign_reading AS sr2',
        'sr1.reference_uuid',
        'sr2.reference_uuid'
      )
      .where('sr1.reading', sign);
    return matchingSigns.map(row => row.reading);
  }

  async getSignCode(sign: string, isDeterminative: boolean): Promise<SignCode> {
    const imageCodeArray = await knex('sign_reading')
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

    const imageExists = () => {
      try {
        require.resolve(`@oare/oare/src/assets/signVectors/${imageCode}.png`);
        return true;
      } catch {
        return false;
      }
    };

    if (imageCode && imageExists()) {
      const newSign = await knex('sign')
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

    const fontCodeArray = await knex('sign')
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
      const newSign = await knex('sign')
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
}

export default new SignReadingDao();

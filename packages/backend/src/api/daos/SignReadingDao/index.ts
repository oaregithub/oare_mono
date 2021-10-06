import knex from '@/connection';
import { UuidRow, SignCode } from '@oare/types';

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

  async getSignCode(sign: string): Promise<SignCode> {
    const imageCodeArray = await knex('sign_reading')
      .select('sign_org.org_num as signCode')
      .leftJoin(
        'sign_org',
        'sign_org.reference_uuid',
        'sign_reading.reference_uuid'
      )
      .where('sign_org.type', 'MZL')
      .andWhere('sign_reading.reading', sign)
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
      return {
        type: 'image',
        code: imageCode,
      };
    }

    const fontCodeArray = await knex('sign')
      .select('sign.font_code as fontCode')
      .innerJoin('sign_reading', 'sign_reading.reference_uuid', 'sign.uuid')
      .where('sign_reading.reading', sign)
      .first();
    const fontCode: string | null = fontCodeArray
      ? fontCodeArray.fontCode
      : null;
    if (fontCode) {
      return {
        type: 'utf8',
        code: fontCode,
      };
    }
    return {
      type: null,
      code: null,
    };
  }
}

export default new SignReadingDao();

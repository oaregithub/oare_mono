import { Knex } from 'knex';
import { v4 } from 'uuid';

export interface dictionarySpellingEpigraphy {
  dictionarySpellingInfo: { referenceUuid: string; explicitSpelling: string };
  signInfo: {
    signSpellNum: number;
    signUuid: string;
    readingUuid: string;
    reading: string;
  }[];
}

export const stringToCharsArray = async (
  explicitSpelling: string
): Promise<{ char: string; type: string; spellNum: number }[]> => {
  const chars = explicitSpelling
    .trim()
    .replace(/[{}]/g, '-')
    .split(/(\([^.-\s+=()]+\))|(\d\.\d)|[().-\s+=]/g)
    .filter(Boolean);

  const charArray: {
    char: string;
    type: string;
    spellNum: number;
  }[] = await Promise.all(
    chars.map(async (char, idx) => {
      return {
        char: char.replace(/[()]/g, ''),
        type: await determineType(char),
        spellNum: idx + 1,
      };
    })
  );

  return charArray;
};

export const determineType = async (char: string): Promise<string> => {
  if (char.match(/^\([^.]*\)$/)) {
    return 'determinative';
  } else if (/^\d+$|^(\d+\.\d+)$/.test(char)) {
    return 'number';
  } else if (char.toLocaleUpperCase() === char) {
    return 'logogram';
  } else if (char.toLocaleLowerCase() === char) {
    return 'phonogram';
  } else {
    return 'uninterpreted';
  }
};

export const getSignInfo = async (
  knex: Knex,
  char: {
    char: string;
    type: string;
    spellNum: number;
  }
): Promise<{
  signSpellNum: number;
  signUuid: string;
  readingUuid: string;
  reading: string;
}> => {
  let signInfo: {
    signUuid: string;
    readingUuid: string;
    reading: string;
  } = await knex('sign_reading as sr')
    .select({
      signUuid: 'sr.reference_uuid',
      readingUuid: 'sr.uuid',
      reading: 'sr.reading',
    })
    .where(function () {
      this.where('sr.reading', char.char).orWhere('sr.value', char.char);
    })
    .andWhere('sr.type', char.type)
    .first();
  if (!signInfo?.signUuid || !signInfo?.reading || !signInfo?.readingUuid) {
    signInfo = await knex('sign_reading as sr')
      .select({
        signUuid: 'sr.reference_uuid',
        readingUuid: 'sr.uuid',
        reading: 'sr.reading',
      })
      .where('sr.reading', char.char)
      .orWhere('sr.value', char.char)
      .first();
  }

  return { ...signInfo, signSpellNum: char.spellNum };
};

export async function up(knex: Knex): Promise<void> {
  const hasDictSpellEpigTable = await knex.schema.hasTable(
    'dictionary_spelling_epigraphy'
  );

  if (!hasDictSpellEpigTable) {
    const dictionarySpellings: Array<{
      explicit_spelling: string;
      uuid: string;
    }> = await knex('dictionary_spelling').select({
      explicit_spelling: 'explicit_spelling',
      uuid: 'uuid',
    });

    const total = dictionarySpellings.length;

    const spellEpigObjects: dictionarySpellingEpigraphy[] = await Promise.all(
      dictionarySpellings.map(async (ds, index) => {
        const referenceUuid: string = ds.uuid;
        const explicitSpelling: string = ds.explicit_spelling;
        const chars: {
          char: string;
          type: string;
          spellNum: number;
        }[] = await stringToCharsArray(explicitSpelling);
        const signInfo: {
          signSpellNum: number;
          signUuid: string;
          readingUuid: string;
          reading: string;
        }[] = await Promise.all(
          chars.map(async char => {
            const sign: {
              signSpellNum: number;
              signUuid: string;
              readingUuid: string;
              reading: string;
            } = await getSignInfo(knex, char);
            return sign;
          })
        );
        console.log(`${(((index + 1) / total) * 100).toFixed(4)}% generated`);
        return {
          dictionarySpellingInfo: { referenceUuid, explicitSpelling },
          signInfo: signInfo,
        } as dictionarySpellingEpigraphy;
      })
    );

    console.log('creating table');

    await knex.schema.createTable('dictionary_spelling_epigraphy', table => {
      table.charset('utf8mb4');
      table.collate('utf8mb4_bin');
      table.increments('id').primary();
      table.uuid('uuid').notNullable().unique();
      // @ts-ignore
      table.uuid('reference_uuid').collate('latin1_swedish_ci');
      table
        .foreign('reference_uuid', 'dict_spell_reference_uuid_fk')
        .references('dictionary_spelling.uuid');
      table.integer('sign_spell_num');
      // @ts-ignore
      table.uuid('reading_uuid').collate('latin1_swedish_ci');
      table
        .foreign('reading_uuid', 'sign_reading_uuid_fk')
        .references('sign_reading.uuid');
      table.string('reading');
      // @ts-ignore
      table.uuid('sign_uuid').collate('latin1_swedish_ci');
      table.foreign('sign_uuid', 'sign_uuid_fk').references('sign.uuid');
    });

    spellEpigObjects.forEach(async (obj, index) => {
      obj.signInfo.forEach(async sign => {
        await knex('dictionary_spelling_epigraphy').insert({
          reference_uuid: obj.dictionarySpellingInfo.referenceUuid,
          sign_spell_num: sign.signSpellNum,
          reading_uuid: sign.readingUuid,
          reading: sign.reading,
          sign_uuid: sign.signUuid,
          uuid: v4(),
        });
      });
      console.log(`${(((index + 1) / total) * 100).toFixed(4)}% populated`);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasDictSpellEpigTable = await knex.schema.hasTable(
    'dictionary_spelling_epigraphy'
  );

  if (hasDictSpellEpigTable) {
    await knex.schema.dropTable('dictionary_spelling_epigraphy');
  }
}

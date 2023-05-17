import { PeriodRow, Year, Month, LinkItem } from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';

class PeriodsDao {
  async getPeriodRows(
    treeUuid: string,
    type: string,
    trx?: Knex.Transaction
  ): Promise<PeriodRow[]> {
    const k = trx || knex;
    const rows: PeriodRow[] = await k('period')
      .select(
        'uuid',
        'type',
        'tree_uuid',
        'parent_uuid AS parentUuid',
        'name',
        'abbreviation',
        'official1_uuid AS official1Uuid',
        'official2_uuid AS official2Uuid',
        'official1PN AS official1Name',
        'official2PN AS official2Name',
        'official1PN_uuid AS official1NameUuid',
        'official2PN_uuid AS official2NameUuid',
        'official1PTR as official1Father',
        'official2PTR as official2Father',
        'official1PTR_PN_uuid as official1FatherNameUuid',
        'official2PTR_PN_uuid as official2FatherNameUuid',
        'official1PTR_uuid as official1FatherUuid',
        'official2PTR_uuid as official2FatherUuid',
        'period_type as periodType',
        'order'
      )
      .where('tree_uuid', treeUuid)
      .andWhere('period_type', type);

    return rows;
  }

  async getYears(
    yearRows: PeriodRow[],
    monthRows: PeriodRow[],
    weekRows: PeriodRow[]
  ): Promise<Year[]> {
    const years: Year[] = await Promise.all(
      yearRows.map(row => this.yearMaker(row, monthRows, weekRows))
    );

    return years;
  }

  async yearMaker(
    period: PeriodRow,
    monthRows: PeriodRow[],
    weekRows: PeriodRow[],
    trx?: Knex.Transaction
  ): Promise<Year> {
    const k = trx || knex;

    const { uuid } = period;
    let yearNumber: string = '';

    if (period.abbreviation != null) {
      yearNumber = period.abbreviation;
    }

    let yearName: string = '';

    if (
      period.official1Uuid != null &&
      period.official1FatherNameUuid != null
    ) {
      const yearOfficialName = await k('dictionary_word')
        .select('word')
        .innerJoin('person', 'person.name_uuid', 'dictionary_word.uuid')
        .where('person.uuid', period.official1Uuid)
        .first();

      const yearOfficialRelation = await k('person')
        .select('relation')
        .where('uuid', period.official1Uuid)
        .first();
      const yearOfficialRelationName = await k('dictionary_word')
        .select('word')
        .innerJoin(
          'person',
          'person.relation_name_uuid',
          '=',
          'dictionary_word.uuid'
        )
        .where('person.uuid', period.official1Uuid)
        .first();
      yearName = `${yearOfficialName.word} ${yearOfficialRelation.relation} ${yearOfficialRelationName.word}`;
    } else if (
      period.official1Uuid != null &&
      period.official1FatherNameUuid == null
    ) {
      const yearOfficialName = await k('dictionary_word')
        .select('word')
        .innerJoin('person', 'person.name_uuid', '=', 'dictionary_word.uuid')
        .where('person.uuid', period.official1Uuid)
        .first();

      const yearOfficialLabel = await k('person')
        .select('label')
        .where('person.uuid', period.official1Uuid)
        .first();

      if (yearOfficialLabel != null) {
        yearName = `${yearOfficialName.word} ${yearOfficialLabel.label}`;
      } else {
        yearName = yearOfficialName.word;
      }
    } else if (period.official1NameUuid !== null) {
      const yearOfficialName = await k('dictionary_word')
        .select('word')
        .where('uuid', period.official1NameUuid)
        .first();

      if (period.official1FatherNameUuid !== null) {
        const yearOfficialFatherName = await k('dictionary_word')
          .select('word')
          .where('uuid', period.official1FatherNameUuid)
          .first();

        yearName = `${yearOfficialName.word} s. ${yearOfficialFatherName.word}`;
      } else {
        yearName = `${yearOfficialName.word}`;
      }
    } else {
      yearName = period.name;
    }

    const yearOccurrences = await this.getOccurrences(period.uuid);
    const months = await this.getMonths(period, monthRows, weekRows);

    return {
      uuid,
      number: yearNumber,
      name: yearName,
      occurrences: yearOccurrences,
      months,
    };
  }

  async getMonths(
    yearRow: PeriodRow,
    monthRows: PeriodRow[],
    weekRows: PeriodRow[]
  ): Promise<Month[]> {
    const matchingMonths = monthRows.filter(
      month => month.parentUuid === yearRow.uuid
    );

    const months = await Promise.all(
      matchingMonths.map(row => this.monthMaker(row, weekRows))
    );

    return months.sort((a, b) => a.abbreviation - b.abbreviation);
  }

  async monthMaker(monthRow: PeriodRow, weekRows: PeriodRow[]): Promise<Month> {
    const { uuid } = monthRow;
    const monthAbbreviation: number = Number(monthRow.abbreviation);
    const monthName: string = monthRow.name;
    const monthOccurrences = await this.getOccurrences(uuid);
    const weeks = await this.getWeeks(monthRow, weekRows);

    return {
      uuid,
      abbreviation: monthAbbreviation,
      name: monthName,
      occurrences: monthOccurrences,
      weeks,
    };
  }

  async getWeeks(monthRow: PeriodRow, weekRows: PeriodRow[]) {
    const matchingWeeks = weekRows.filter(
      week => week.parentUuid === monthRow.uuid
    );

    const weeks = await Promise.all(
      matchingWeeks.map(row => this.weekMaker(row))
    );

    return weeks;
  }

  async weekMaker(weekRow: PeriodRow) {
    const weekOccurrences = await this.getOccurrences(weekRow.uuid);

    return {
      uuid: weekRow.uuid,
      name: weekRow.name,
      occurrences: weekOccurrences,
    };
  }

  async getOccurrences(uuid: string, trx?: Knex.Transaction) {
    const k = trx || knex;

    const countRow = await k('item_properties')
      .where('object_uuid', uuid)
      .andWhere('variable_uuid', 'cd76438c-3a82-11ed-b9d7-0282f921eac9')
      .count({ count: 'uuid' })
      .first();

    const occurrences = countRow && countRow.count ? countRow.count : 0;
    return Number(occurrences);
  }

  /**
   * Searches for periods by name or abbreviation or UUID. Used for autocomplete when connecting link properties.
   * Result strings are dynamically constructed based on the period type.
   * @param search The search string. Could be a UUID, name, or abbreviation.
   * @param trx Knex Transaction. Optional.
   * @returns Array of matching, ordered `LinkItem` objects.
   */
  async searchPeriods(
    search: string,
    trx?: Knex.Transaction
  ): Promise<LinkItem[]> {
    const k = trx || knex;

    const rows: LinkItem[] = await k('period')
      .select(
        'period.uuid as objectUuid',
        k.raw(
          `CASE WHEN period.period_type = "OA Calendar Year" 
          THEN CONCAT(period.period_type, " - ", coalesce(period.abbreviation, " NONE "), " ", period.name)
          WHEN period.period_type = "OA Month"
          THEN CONCAT(period.period_type, " - ", parent.abbreviation, " ", parent.name, " - ", period.abbreviation, " ", period.name)
          WHEN period.period_type = "OA hamuštum"
          THEN CONCAT(period.period_type, " - ", grandparent.abbreviation, " ", grandparent.name, " - ", parent.abbreviation, " ", parent.name, " - ", period.name)
          END
          as objectDisplay`
        )
      )
      .leftJoin('period as parent', 'period.parent_uuid', 'parent.uuid')
      .leftJoin(
        'period as grandparent',
        'parent.parent_uuid',
        'grandparent.uuid'
      )
      .where('period.tree_uuid', '01da4ab2-6ea0-49f3-8752-759ca4bd5cdc')
      .where(k.raw('LOWER(period.name)'), 'like', `%${search.toLowerCase()}%`)
      .orWhere('period.abbreviation', search)
      .orWhere('parent.abbreviation', search)
      .orWhere('grandparent.abbreviation', search)
      .orWhereRaw('binary period.uuid = binary ?', search)
      .orderByRaw(
        `CASE WHEN LOWER(period.name) LIKE '${search.toLowerCase()}' THEN 1 WHEN LOWER(period.name) LIKE '${search.toLowerCase()}%' THEN 2 WHEN LOWER(period.name) LIKE '%${search.toLowerCase()}' THEN 4 ELSE 3 END`
      )
      .orderByRaw('LOWER(period.name)');

    return rows;
  }
}

/**
 * PeriodsDao instance as a singleton
 */
export default new PeriodsDao();

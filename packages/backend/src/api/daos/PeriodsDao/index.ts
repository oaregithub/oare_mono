import { PeriodRow, Year, Month, PeriodResponse } from '@oare/types';
import { knexRead } from '@/connection';
import { Knex } from 'knex';

class PeriodsDao {
  async getPeriodRows(
    treeUuid: string,
    type: string,
    trx?: Knex.Transaction
  ): Promise<PeriodRow[]> {
    const k = trx || knexRead();
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
    weekRows: PeriodRow[],
    trx?: Knex.Transaction
  ): Promise<Year[]> {
    const k = trx || knexRead();

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
    const k = trx || knexRead();

    const { uuid } = period;
    let yearNumber: string = '';

    if (period.abbreviation != null) {
      yearNumber = period.abbreviation;
    } else {
      yearNumber = '';
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

    const countRow = await k('item_properties')
      .where('object_uuid', period.uuid)
      .andWhere('variable_uuid', 'cd76438c-3a82-11ed-b9d7-0282f921eac9')
      .count({ count: 'uuid' })
      .first();

    const yearOccurrences = countRow && countRow.count ? countRow.count : 0;
    const months = await this.getMonths(period, monthRows, weekRows);

    return {
      uuid,
      number: yearNumber,
      name: yearName,
      occurrences: Number(yearOccurrences),
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

    return months;
  }

  async monthMaker(monthRow: PeriodRow, weekRows: PeriodRow[]): Promise<Month> {
    const { uuid, abbreviation } = monthRow;

    const monthName: string = `${abbreviation} . ${monthRow.name}`;

    const weeks = await this.getWeeks(monthRow, weekRows);

    return {
      uuid,
      abbreviation,
      name: monthName,
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
    return {
      uuid: weekRow.uuid,
      name: weekRow.name,
    };
  }
}
export default new PeriodsDao();

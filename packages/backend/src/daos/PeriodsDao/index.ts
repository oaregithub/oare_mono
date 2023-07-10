import {
  PeriodRow,
  Year,
  Month,
  LinkItem,
  PeriodResponse,
  Week,
} from '@oare/types';
import knex from '@/connection';
import { Knex } from 'knex';
import sl from '@/serviceLocator';

class PeriodsDao {
  /**
   * Retrieves a period row by UUID.
   * @param uuid The UUID of the period row to retrieve.
   * @param trx Knex Transaction. Optional.
   * @returns PeriodRow object.
   * @throws Error if the period row is not found.
   */
  private async getPeriodRowByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<PeriodRow> {
    const k = trx || knex;

    const row: PeriodRow | undefined = await k('period')
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
      .where({ uuid })
      .first();

    if (!row) {
      throw new Error(`Period row with uuid ${uuid} not found`);
    }

    return row;
  }

  /**
   * Constructs an entire PeriodResponse object containing all years, months, and weeks.
   * @param trx Knex Transaction. Optional.
   * @returns A PeriodResponse object.
   * @throws Error if a referenced period row is not found.
   */
  public async getPeriods(trx?: Knex.Transaction): Promise<PeriodResponse> {
    const yearUuids = await this.getPeriodUuidsByParentUuidAndPeriodType(
      null,
      'OA Calendar Year',
      trx
    );

    const years = await Promise.all(
      yearUuids.map(uuid => this.getYearByUuid(uuid, trx))
    );

    const sortedYears = years.sort((a, b) => {
      if (!a.abbreviation) {
        return -1;
      }

      if (!b.abbreviation) {
        return 1;
      }

      return a.abbreviation.localeCompare(b.abbreviation);
    });

    const periodResponse: PeriodResponse = {
      years: sortedYears,
    };

    return periodResponse;
  }

  /**
   * Constructs a year object for a given year UUID.
   * @param uuid The UUID of the year.
   * @param trx Knex Transaction. Optional.
   * @returns A Year object.
   * @throws Error if a referenced period row is not found.
   */
  private async getYearByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Year> {
    const DictionaryWordDao = sl.get('DictionaryWordDao');
    const PersonDao = sl.get('PersonDao');

    const yearRow = await this.getPeriodRowByUuid(uuid, trx);

    let label: string = '';

    if (
      yearRow.official1Uuid !== null &&
      yearRow.official1FatherNameUuid !== null
    ) {
      const personRow = await PersonDao.getPersonRowByUuid(
        yearRow.official1Uuid,
        trx
      );

      const yearOfficialName = await DictionaryWordDao.getDictionaryWordRowByUuid(
        personRow.nameUuid!,
        trx
      );

      const yearOfficialRelationName = await DictionaryWordDao.getDictionaryWordRowByUuid(
        personRow.relationNameUuid!,
        trx
      );

      label = `${yearOfficialName.word} ${personRow.relation} ${yearOfficialRelationName.word}`;
    } else if (
      yearRow.official1Uuid !== null &&
      yearRow.official1FatherNameUuid === null
    ) {
      const personRow = await PersonDao.getPersonRowByUuid(
        yearRow.official1Uuid,
        trx
      );

      const yearOfficialName = await DictionaryWordDao.getDictionaryWordRowByUuid(
        personRow.nameUuid!,
        trx
      );

      if (personRow.label !== null) {
        label = `${yearOfficialName.word} ${personRow.label}`;
      } else {
        label = `${yearOfficialName.word}`;
      }
    } else if (yearRow.official1NameUuid !== null) {
      const yearOfficialName = await DictionaryWordDao.getDictionaryWordRowByUuid(
        yearRow.official1NameUuid,
        trx
      );

      if (yearRow.official1FatherNameUuid !== null) {
        const yearOfficialFatherName = await DictionaryWordDao.getDictionaryWordRowByUuid(
          yearRow.official1FatherNameUuid,
          trx
        );

        label = `${yearOfficialName.word} s. ${yearOfficialFatherName.word}`;
      } else {
        label = `${yearOfficialName.word}`;
      }
    } else {
      label = `${yearRow.name}`;
    }

    const monthUuids = await this.getPeriodUuidsByParentUuidAndPeriodType(
      uuid,
      'OA Month',
      trx
    );

    const months = await Promise.all(
      monthUuids.map(monthUuid => this.getMonthByUuid(monthUuid, trx))
    );

    const sortedMonths = months.sort((a, b) => {
      if (!a.abbreviation) {
        return -1;
      }

      if (!b.abbreviation) {
        return 1;
      }

      return a.abbreviation.localeCompare(b.abbreviation);
    });

    const year: Year = {
      ...yearRow,
      label,
      occurrences: 0, // Will be added in cache filter
      months: sortedMonths,
    };

    return year;
  }

  /**
   * Constructs a Month object for a given month UUID.
   * @param uuid The UUID of the month.
   * @param trx Knex Transaction. Optional.
   * @returns A Month object.
   * @throws Error if a referenced period row is not found.
   */
  private async getMonthByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Month> {
    const monthRow = await this.getPeriodRowByUuid(uuid, trx);

    const weekUuids = await this.getPeriodUuidsByParentUuidAndPeriodType(
      uuid,
      'OA hamuštum',
      trx
    );

    const weeks = await Promise.all(
      weekUuids.map(weekUuid => this.getWeekByUuid(weekUuid, trx))
    );

    const month: Month = {
      ...monthRow,
      label: monthRow.name,
      occurrences: 0, // Will be added in cache filter
      weeks,
    };

    return month;
  }

  /**
   * Constructs a Week object for a given week UUID.
   * @param uuid The UUID of the week.
   * @param trx Knex Transaction. Optional.
   * @returns A Week object.
   * @throws Error if a referenced period row is not found.
   */
  private async getWeekByUuid(
    uuid: string,
    trx?: Knex.Transaction
  ): Promise<Week> {
    const weekRow = await this.getPeriodRowByUuid(uuid, trx);

    const week: Week = {
      ...weekRow,
      label: weekRow.name,
      occurrences: 0, // Will be added in cache filter
    };

    return week;
  }

  /**
   * Retrieves a list of period UUIDS by parent UUID and period type.
   * @param parentUuid The UUID of the parent period.
   * @param periodType The period_type of the period.
   * @param trx Knex Transaction. Optional.
   * @returns Array of period UUIDs.
   */
  private async getPeriodUuidsByParentUuidAndPeriodType(
    parentUuid: string | null,
    periodType: string,
    trx?: Knex.Transaction
  ): Promise<string[]> {
    const k = trx || knex;

    const uuids = await k('period').pluck('uuid').where({
      tree_uuid: '01da4ab2-6ea0-49f3-8752-759ca4bd5cdc',
      parent_uuid: parentUuid,
      period_type: periodType,
    });

    return uuids;
  }

  /**
   * Retrieves the number of occurrences of a period.
   * @param uuid The UUID of the period.
   * @param trx Knex Transaction. Optional.
   * @returns Number of occurrences of the period.
   */
  public async getOccurrences(
    uuid: string,
    textsToHide: string[],
    trx?: Knex.Transaction
  ) {
    const k = trx || knex;

    const countRow = await k('item_properties')
      .innerJoin(
        'text_discourse',
        'item_properties.reference_uuid',
        'text_discourse.uuid'
      )
      .where('object_uuid', uuid)
      .andWhere('variable_uuid', 'cd76438c-3a82-11ed-b9d7-0282f921eac9')
      .whereNotIn('text_uuid', textsToHide)
      .count({ count: 'item_properties.uuid' })
      .first();

    const occurrences = countRow && countRow.count ? Number(countRow.count) : 0;

    return occurrences;
  }

  /**
   * Searches for periods by name or abbreviation or UUID. Used for autocomplete when connecting link properties.
   * Result strings are dynamically constructed based on the period type.
   * @param search The search string. Could be a UUID, name, or abbreviation.
   * @param trx Knex Transaction. Optional.
   * @returns Array of matching, ordered `LinkItem` objects.
   */
  public async searchPeriodsLinkProperties(
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

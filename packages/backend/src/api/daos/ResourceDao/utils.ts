import { knexRead } from '@/connection';
import { ReferringLocationInfo } from '@oare/types';
import { Knex } from 'knex';

export async function concatLocation(
  refLocationInfo: ReferringLocationInfo
): Promise<string> {
  let locationString = '';

  const {
    beginPage,
    endPage,
    beginPlate,
    endPlate,
    note,
    publicationNumber,
  } = refLocationInfo;

  if (publicationNumber) {
    locationString = `${locationString} no. ${publicationNumber}`;
  }
  if (beginPage && beginPlate) {
    locationString = `${locationString}, ${beginPage}`;
    if (endPage) {
      locationString = `${locationString}-${endPage}`;
    }
    locationString = `${locationString} & ${beginPlate}`;
    if (endPlate) {
      locationString = `${locationString}-${endPlate}`;
    }
    if (note) {
      locationString = `${locationString} n. ${note}`;
    }
  } else {
    if (beginPage) {
      locationString = `${locationString}, ${beginPage}`;
    }
    if (endPage) {
      locationString = `${locationString}-${endPage}`;
    }
    if (beginPlate) {
      locationString = `${locationString}, pl. ${beginPlate}`;
    }
    if (endPlate) {
      locationString = `${locationString}-${endPlate}`;
    }
  }

  return locationString;
}

export async function getReferringLocationInfoQuery(
  variableUuid: string,
  textUuid: string,
  bibUuid: string,
  trx?: Knex.Transaction
) {
  const k = trx || knexRead();
  const query = k('item_properties as ip')
    .leftJoin('item_properties as ip2', 'ip.parent_uuid', 'ip2.parent_uuid')
    .leftJoin('item_properties as ip3', 'ip2.uuid', 'ip3.parent_uuid')
    .where('ip3.variable_uuid', variableUuid)
    .andWhere('ip3.reference_uuid', textUuid)
    .andWhere('ip.object_uuid', bibUuid)
    .select('ip3.value')
    .first();
  return query;
}

export async function calcPDFPageNum(
  format: string,
  beginPage: number | null,
  beginPlate: number | null
) {
  const splitFormat: string[] = format.split('-');
  const layout: string = splitFormat[0];
  const pageOffset: number = Number(splitFormat[1]);
  const plateOffset: number = Number(splitFormat[2]);
  let page = 0;
  let plate = 0;
  if (layout === 'a') {
    if (beginPage) page = beginPage + pageOffset;
    if (beginPlate && plateOffset) plate = beginPlate + plateOffset;
  }
  if (layout === 'b') {
    if (beginPage) page = -Math.floor(-beginPage / 2) + pageOffset;
    if (beginPlate && plateOffset)
      plate = -Math.floor(-beginPlate / 2) + plateOffset;
  }
  if (layout === 'c') {
    if (beginPage) page = Math.floor(beginPage / 2) + pageOffset;
    if (beginPlate && plateOffset)
      plate = Math.floor(beginPlate / 2) + plateOffset;
  }

  return {
    plate,
    page,
  };
}

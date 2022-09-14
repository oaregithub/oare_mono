import { ReferringLocationInfo } from '@oare/types';

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

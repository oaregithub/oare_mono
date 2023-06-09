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
    if (beginPage) {
      page = beginPage + pageOffset;
    }
    if (beginPlate && plateOffset) {
      plate = beginPlate + plateOffset;
    }
  }
  if (layout === 'b') {
    if (beginPage) {
      page = -Math.floor(-beginPage / 2) + pageOffset;
    }
    if (beginPlate && plateOffset) {
      plate = -Math.floor(-beginPlate / 2) + plateOffset;
    }
  }
  if (layout === 'c') {
    if (beginPage) {
      page = Math.floor(beginPage / 2) + pageOffset;
    }
    if (beginPlate && plateOffset) {
      plate = Math.floor(beginPlate / 2) + plateOffset;
    }
  }

  return {
    plate,
    page,
  };
}

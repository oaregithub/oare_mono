import fs from 'fs';
import path from 'path';

function getQueryString(fileName: string) {
  return fs.readFileSync(path.join(__dirname, '../sql/', fileName)).toString();
}

/**
 *
 * @param {string[]} letters - Example: [a,b,c]
 * @param {string} tableAndColumn - Example: dictionary_word.word
 * @returns {string}
 */
function getOrWhereForLetters(
  letters: string[],
  tableAndColumn: string
): string {
  let andWhere = '';
  letters.forEach((l: string, index: number) => {
    andWhere += `${tableAndColumn} REGEXP '^[(]${l.toUpperCase()}|^[${l.toUpperCase()}]|^[(]${l.toLowerCase()}|^[${l.toLowerCase()}]]'`;
    if (index !== letters.length - 1) {
      andWhere += ' OR ';
    }
  });

  return andWhere;
}

export default {
  getQueryString,
  getOrWhereForLetters,
};

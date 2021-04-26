import fs from 'fs';
import path from 'path';

function getQueryString(fileName: string) {
  return fs.readFileSync(path.join(__dirname, '../sql/', fileName)).toString();
}

interface AndWhereWithBindings {
  andWhere: string;
  bindings: string[];
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
): AndWhereWithBindings {
  let andWhere = '';
  const bindings: string[] = [];
  letters.forEach((l: string, index: number) => {
    andWhere += `${tableAndColumn} REGEXP "^[(]?|^[?]|^[(]?|^[?]]"`;
    if (index !== letters.length - 1) {
      andWhere += ' OR ';
    }
    bindings.push(
      l.toUpperCase(),
      l.toUpperCase(),
      l.toLowerCase(),
      l.toLowerCase()
    );
  });

  return {
    andWhere,
    bindings,
  } as AndWhereWithBindings;
}

export default {
  getQueryString,
  getOrWhereForLetters,
};

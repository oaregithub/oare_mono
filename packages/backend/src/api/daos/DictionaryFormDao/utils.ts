import { DictionaryForm, FormSpelling } from '@oare/types';
import { SpellingQueryRow, FormGrammarRow } from './index';

export default function assembleSpellingsAndFormGrammar(
  spellingRows: SpellingQueryRow[],
  formGrammars: FormGrammarRow[],
): DictionaryForm[] {
  const resultGrammars: DictionaryForm[] = [];

  spellingRows.forEach((spellingRow) => {
    const { form, formUuid } = spellingRow;
    const spellingNames = spellingRow.spellings ? spellingRow.spellings.split(',') : [];
    const spellingUuids = spellingRow.spellingUuids ? spellingRow.spellingUuids.split(',') : [];
    const spellings = spellingNames.map((spelling, idx) => ({
      spelling,
      uuid: spellingUuids[idx],
    }));

    const grammarRows = formGrammars.filter((row) => row.formUuid === formUuid);
    const cliticSuffixUuid = getCliticSuffixUuid(grammarRows);

    let suffix = null;
    if (cliticSuffixUuid) {
      suffix = {
        persons: getSuffixVariables('Person', grammarRows, cliticSuffixUuid),
        cases: getSuffixVariables('Case', grammarRows, cliticSuffixUuid),
        genders: getSuffixVariables('Gender', grammarRows, cliticSuffixUuid),
        grammaticalNumbers: getSuffixVariables('Grammatical Number', grammarRows, cliticSuffixUuid),
      };
    }

    resultGrammars.push({
      uuid: formUuid,
      form,
      spellings,
      stems: getVariables('Stem', grammarRows, cliticSuffixUuid),
      tenses: getVariables('Tense', grammarRows, cliticSuffixUuid),
      cases: getVariables('Case', grammarRows, cliticSuffixUuid),
      states: getVariables('State', grammarRows, cliticSuffixUuid),
      moods: getVariables('Mood', grammarRows, cliticSuffixUuid),
      clitics: getVariables('Clitic', grammarRows, cliticSuffixUuid).sort((a, b) => {
        if (a === 'suf.') return 1;
        if (b === 'suf.') return -1;
        return 0;
      }),
      persons: getVariables('Person', grammarRows, cliticSuffixUuid),
      grammaticalNumbers: getVariables('Grammatical Number', grammarRows, cliticSuffixUuid),
      morphologicalForms: getVariables('Morphological Form', grammarRows, cliticSuffixUuid),
      genders: getVariables('Gender', grammarRows, cliticSuffixUuid),
      suffix,
    });
  });
  return resultGrammars.sort((a, b) => {
    if (a.form < b.form) {
      return -1;
    }
    if (a.form > b.form) {
      return 1;
    }
    return 0;
  });
}

function getCliticSuffixUuid(grammarRows: FormGrammarRow[]) {
  const cliticRow = grammarRows.find((row) => row.variable === 'Clitic' && row.valueName === 'Suffix pronoun');

  if (!cliticRow) return null;

  return cliticRow.propertyUuid;
}

function getVariables(variable: string, grammarRows: FormGrammarRow[], cliticUuid: string | null): string[] {
  const valueRows = grammarRows.filter((row) => row.variable === variable && row.parentUuid !== cliticUuid);

  const values = valueRows.map((row) => row.valueAbbrev || '').filter((row) => row !== '');
  return values;
  // return values.filter((v, i) => values.indexOf(v) === i);
}

function getSuffixVariables(variable: string, grammarRows: FormGrammarRow[], cliticUuid: string): string[] {
  const valueRows = grammarRows.filter((row) => row.variable === variable && row.parentUuid === cliticUuid);

  const values = valueRows.map((row) => row.valueAbbrev || '').filter((row) => row !== '');
  return values;
  // return values.filter((v, i) => values.indexOf(v) === i);
}

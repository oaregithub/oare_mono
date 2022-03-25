import {
  DictionaryForm,
  DictionaryFormGrammar,
  ItemPropertyRow,
} from '@oare/types';
import { DateTime } from 'luxon';
import sl from '@/serviceLocator';

function getCliticSuffixUuid(properties: ItemPropertyRow[]): string | null {
  const cliticRow = properties.find(
    row => row.variableName === 'Clitic' && row.valueName === 'Suffix pronoun'
  );
  return cliticRow ? cliticRow.uuid : null;
}

function getVariables(
  variable: string,
  properties: ItemPropertyRow[],
  cliticUuid: string | null
): string[] {
  const valueRows = properties.filter(
    row => row.variableName === variable && row.parentUuid !== cliticUuid
  );

  const values = valueRows
    .map(row => row.valAbbreviation || '')
    .filter(row => row !== '');
  return values;
}

function getSuffixVariables(
  variable: string,
  properties: ItemPropertyRow[],
  cliticUuid: string
): string[] {
  const valueRows = properties.filter(
    row => row.variableName === variable && row.parentUuid === cliticUuid
  );

  const values = valueRows
    .map(row => row.valAbbreviation || '')
    .filter(row => row !== '');
  return values;
}

const generateFormGrammar = (form: DictionaryForm): DictionaryFormGrammar => {
  const cliticSuffixUuid = getCliticSuffixUuid(form.properties);

  let suffix = null;
  if (cliticSuffixUuid) {
    const [persons, cases, genders, grammaticalNumbers] = [
      'Person',
      'Case',
      'Gender',
      'Grammatical Number',
    ].map(varValue =>
      getSuffixVariables(varValue, form.properties, cliticSuffixUuid)
    );
    suffix = {
      persons,
      cases,
      genders,
      grammaticalNumbers,
    };
  }

  const [
    stems,
    tenses,
    cases,
    states,
    moods,
    persons,
    grammaticalNumbers,
    morphologicalForms,
    genders,
  ] = [
    'Stem',
    'Tense',
    'Case',
    'State',
    'Mood',
    'Person',
    'Grammatical Number',
    'Morphological Form',
    'Gender',
  ].map(varType => getVariables(varType, form.properties, cliticSuffixUuid));

  return {
    stems,
    tenses,
    cases,
    states,
    moods,
    persons,
    grammaticalNumbers,
    morphologicalForms,
    genders,
    suffix,
    clitics: getVariables('Clitic', form.properties, cliticSuffixUuid).sort(
      (a, b) => {
        if (a === 'suf.') return 1;
        if (b === 'suf.') return -1;
        return 0;
      }
    ),
  };
};

const formGrammarString = (form: DictionaryForm): string => {
  const formGrammar = generateFormGrammar(form);

  let suffix = '';

  if (formGrammar.suffix) {
    suffix =
      formGrammar.suffix.persons.join('') +
      formGrammar.suffix.genders.join('') +
      formGrammar.suffix.grammaticalNumbers.join('') +
      formGrammar.suffix.cases.join('');
    if (formGrammar.clitics.includes('-ma')) {
      suffix += '-ma';
    }
  }
  return `${
    formGrammar.stems.join('') +
    formGrammar.morphologicalForms
      .filter(mf => mf === 'stv.' || mf === 'inf')
      .join('') +
    formGrammar.tenses.join('')
  } ${formGrammar.persons.join('')}${formGrammar.genders.join(
    ''
  )}${formGrammar.grammaticalNumbers.join('')}${formGrammar.cases.join(
    ''
  )} ${formGrammar.states.join('')}${formGrammar.moods.join(
    ''
  )}${formGrammar.clitics
    .map(clitic => {
      if (clitic === 'suf.') return '+';
      if (clitic === 'vent') return '+vent';
      return clitic;
    })
    .filter(clitic => clitic !== '-ma')
    .join('')}${suffix}`.trim();
};

export const formatTimestamp = (timestamp: Date) =>
  DateTime.fromJSDate(new Date(timestamp)).toLocaleString(
    DateTime.DATETIME_MED
  );

export const resetAdminBadge = async () => {
  const server = sl.get('serverProxy');
  const store = sl.get('store');

  const errorBadge = await server.newErrorsExist();
  const commentsBadge = await server.newThreadsExist();

  store.setAdminBadge({
    error: errorBadge,
    comments: commentsBadge,
  });
};

export default {
  formGrammarString,
};

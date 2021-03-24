import { DictionaryForm } from '@oare/types';
import { DateTime } from 'luxon';

const formGrammarString = (form: DictionaryForm): string => {
  let suffix = '';

  if (form.suffix) {
    suffix =
      form.suffix.persons.join('') +
      form.suffix.genders.join('') +
      form.suffix.grammaticalNumbers.join('') +
      form.suffix.cases.join('');
    if (form.clitics.includes('-ma')) {
      suffix += '-ma';
    }
  }
  return `${
    form.stems.join('') +
    form.morphologicalForms
      .filter(mf => mf === 'stv.' || mf === 'inf')
      .join('') +
    form.tenses.join('')
  } ${form.persons.join('')}${form.genders.join(
    ''
  )}${form.grammaticalNumbers.join('')}${form.cases.join(
    ''
  )} ${form.states.join('')}${form.moods.join('')}${form.clitics
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

export default {
  formGrammarString,
};

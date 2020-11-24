<template>
  <span class="mx-1" v-if="formGrammar !== ''">({{ formGrammar }})</span>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  Ref,
  reactive,
} from '@vue/composition-api';
import { DictionaryForm, SpellingText } from '@oare/types';
import { DataTableHeader } from 'vuetify';

export default defineComponent({
  props: {
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
  },
  setup({ form }) {
    const search = ref('');

    const formGrammar = computed(() => {
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
      return (
        form.stems.join('') +
        form.morphologicalForms
          .filter(mf => mf === 'stv.' || mf === 'inf')
          .join('') +
        form.tenses.join('') +
        ' ' +
        form.persons.join('') +
        form.genders.join('') +
        form.grammaticalNumbers.join('') +
        form.cases.join('') +
        ' ' +
        form.states.join('') +
        form.moods.join('') +
        form.clitics
          .map(clitic => {
            if (clitic === 'suf.') return '+';
            if (clitic === 'vent') return '+vent';
            return clitic;
          })
          .filter(clitic => clitic !== '-ma')
          .join('') +
        suffix
      ).trim();
    });

    return {
      formGrammar,
      search,
    };
  },
});
</script>

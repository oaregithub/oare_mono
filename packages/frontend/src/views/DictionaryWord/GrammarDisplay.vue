<template>
  <div>
    <span class="mx-1" v-if="formGrammar !== ''">({{ formGrammar }})</span>
    <span>
      <span v-for="(s, index) in form.spellings" :key="index">
        <spelling-display
          :spelling="s"
          :updateSpelling="newSpelling => updateSpelling(index, newSpelling)"
        />
        <span v-if="index !== form.spellings.length - 1" class="mr-1">,</span>
      </span></span
    >
  </div>
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
import { DictionaryForm, SpellingText, FormSpelling } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import SpellingDisplay from './SpellingDisplay.vue';

export default defineComponent({
  components: {
    SpellingDisplay,
  },
  props: {
    updateForm: {
      type: Function as PropType<(newForm: DictionaryForm) => void>,
      required: true,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
  },
  setup({ updateForm, form }) {
    const search = ref('');

    const updateSpelling = (index: number, newSpelling: FormSpelling) => {
      const spellings = [...form.spellings];
      spellings[index] = newSpelling;
      updateForm({
        ...form,
        spellings,
      });
    };

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
      updateSpelling,
    };
  },
});
</script>

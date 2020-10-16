<template>
  <div>
    <div class="d-flex">
      <div v-if="wordInfo.partsOfSpeech.length > 0" class="mr-1">
        {{ wordInfo.partsOfSpeech.join(', ') }}
      </div>
      <div v-if="wordInfo.verbalThematicVowelTypes.length > 0" class="mr-1">
        ({{ wordInfo.verbalThematicVowelTypes.join(', ') }})
      </div>
      <p>
        <span v-for="(tr, idx) in wordInfo.translations" :key="tr.uuid">
          <b>{{ idx + 1 }}</b
          >. {{ tr.translation }}
        </span>
        <span
          v-if="
            wordInfo.translations.length > 0 &&
              wordInfo.specialClassifications.length > 0
          "
          >;</span
        >
        <span v-if="wordInfo.specialClassifications.length > 0">
          {{ wordInfo.specialClassifications.join(', ') }}
        </span>
      </p>
    </div>
    <div v-if="wordInfo.forms.length < 1">
      No forms found for {{ wordInfo.word }}
    </div>
    <div v-for="(formInfo, idx) in wordInfo.forms" :key="idx" class="d-flex">
      <strong class="mr-1">{{ formInfo.form }}</strong>
      <span class="mr-1" v-if="formGrammar(formInfo).trim() !== ''"
        >({{ formGrammar(formInfo) }})</span
      >
      <span>{{ formInfo.spellings.map(sp => sp.spelling).join(', ') }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { WordWithForms, DictionaryForm } from '@oare/types';

export default defineComponent({
  props: {
    wordInfo: {
      type: Object as PropType<WordWithForms>,
      required: true,
    },
  },
  setup() {
    const formGrammar = (form: DictionaryForm) => {
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
      );
    };

    return {
      formGrammar,
    };
  },
});
</script>

<style></style>

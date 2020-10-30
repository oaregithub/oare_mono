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
    <forms-display :forms="wordInfo.forms" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { WordWithForms, DictionaryForm } from '@oare/types';
import FormsDisplay from './FormsDisplay.vue';

export default defineComponent({
  props: {
    wordInfo: {
      type: Object as PropType<WordWithForms>,
      required: true,
    },
  },
  components: {
    FormsDisplay,
  },
});
</script>

<style></style>

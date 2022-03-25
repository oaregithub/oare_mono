<template>
  <div class="d-flex">
    <div v-if="partsOfSpeech.length > 0" class="mr-1">
      {{ partsOfSpeechString }}
    </div>
    <div v-if="verbalThematicVowelTypes.length > 0" class="mr-1">
      ({{ verbalThematicVowelTypesString }})
    </div>
    <p v-if="onlyShowFirstTranslation" class="mb-0">
      <span v-if="word.translations.length >= 1">
        <b>{{ 1 }}</b>
        . {{ word.translations[0].translation }}
      </span>
    </p>
    <p v-else>
      <span v-for="(tr, idx) in word.translations" :key="tr.uuid">
        <b>{{ idx + 1 }}</b
        >. {{ tr.translation }}
      </span>

      <span
        v-if="word.translations.length > 0 && specialClassifications.length > 0"
        >;</span
      >
      <span v-if="specialClassifications.length > 0">
        {{ specialClassificationsString }}
      </span>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Word } from '@oare/types';

export default defineComponent({
  name: 'WordGrammar',
  props: {
    word: {
      type: Object as PropType<Word>,
      required: true,
    },
    onlyShowFirstTranslation: {
      type: Boolean,
      default: false,
    },
  },
  setup({ word }) {
    const partsOfSpeech = computed(() =>
      word.properties.filter(prop => prop.variableName === 'Part of Speech')
    );

    const partsOfSpeechString = computed(() =>
      partsOfSpeech.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const verbalThematicVowelTypes = computed(() =>
      word.properties.filter(
        prop => prop.variableName === 'Verbal Thematic Vowel Type'
      )
    );

    const verbalThematicVowelTypesString = computed(() =>
      verbalThematicVowelTypes.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const specialClassifications = computed(() =>
      word.properties.filter(
        prop => prop.variableName === 'Special Classifications'
      )
    );

    const specialClassificationsString = computed(() =>
      specialClassifications.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    return {
      partsOfSpeech,
      partsOfSpeechString,
      verbalThematicVowelTypes,
      verbalThematicVowelTypesString,
      specialClassifications,
      specialClassificationsString,
    };
  },
});
</script>

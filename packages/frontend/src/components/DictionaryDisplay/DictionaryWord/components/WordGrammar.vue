<template>
  <div class="d-flex">
    <div v-if="word.partsOfSpeech.length > 0" class="mr-1">
      {{ partsOfSpeech }}
    </div>
    <div v-if="word.verbalThematicVowelTypes.length > 0" class="mr-1">
      ({{ verbalThematicVowelTypes }})
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
        v-if="
          word.translations.length > 0 && word.specialClassifications.length > 0
        "
        >;</span
      >
      <span v-if="word.specialClassifications.length > 0">
        {{ specialClassifications }}
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
      word.partsOfSpeech.map(pos => pos.name).join(', ')
    );

    const verbalThematicVowelTypes = computed(() =>
      word.verbalThematicVowelTypes.map(pos => pos.name).join(', ')
    );

    const specialClassifications = computed(() =>
      word.specialClassifications.map(pos => pos.name).join(', ')
    );

    return {
      partsOfSpeech,
      verbalThematicVowelTypes,
      specialClassifications,
    };
  },
});
</script>

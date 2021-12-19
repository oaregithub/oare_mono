<template>
  <v-row class="mb-n4 mx-1 mt-1" justify="center">
    <v-tooltip
      top
      open-delay="1200"
      v-for="(char, idx) in specialCharacters"
      :key="idx"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          @click="inputSpecialChar(char.character)"
          color="grey lighten-3"
          rounded
          small
          :disabled="disabled"
          elevation="0"
          class="mx-1 mt-1"
          >{{ char.character }}</v-btn
        >
      </template>
      <span>{{ char.label }}</span>
    </v-tooltip>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export interface SpecialChar {
  character: string;
  label: string;
}

export default defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const actions = sl.get('globalActions');

    const specialCharacters = ref<SpecialChar[]>([
      {
        character: '[',
        label: 'Damage',
      },
      {
        character: ']',
        label: 'Damage',
      },
      {
        character: '⸢',
        label: 'Partial Damage',
      },
      {
        character: '⸣',
        label: 'Partial Damage',
      },
      {
        character: '«',
        label: 'Superfluous',
      },
      {
        character: '»',
        label: 'Superfluous',
      },
      {
        character: '‹',
        label: 'Omitted',
      },
      {
        character: '›',
        label: 'Omitted',
      },
      {
        character: '{',
        label: 'Erasure',
      },
      {
        character: '}',
        label: 'Erasure',
      },
      {
        character: ':',
        label: 'Uninterpreted',
      },
      {
        character: ';',
        label: 'Phonetic Complement',
      },
      {
        character: '*',
        label: 'Written Over Erasure',
      },
      {
        character: '?',
        label: 'Uncertain',
      },
      {
        character: '/',
        label: 'Written Below the Line',
      },
      {
        character: '\\',
        label: 'Written Above the Line',
      },
      {
        character: '!',
        label: '! - Emended Reading, !! - Collated Reading',
      },
      {
        character: '"',
        label: 'Original Sign',
      },
      {
        character: "'",
        label: 'Alternate Sign',
      },
      {
        character: 'x',
        label: 'Undetermined Sign',
      },
      {
        character: '...',
        label: 'Undetermined Signs (Unknown number)',
      },
      {
        character: '|',
        label: 'Separator',
      },
    ]);

    const inputSpecialChar = (char: string) => {
      actions.inputSpecialChar(char);
    };

    return {
      specialCharacters,
      inputSpecialChar,
    };
  },
});
</script>
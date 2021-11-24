<template>
  <v-row class="mb-2 mx-1 mt-1">
    <v-tooltip
      top
      open-delay="1500"
      v-for="(char, idx) in specialCharacters"
      :key="idx"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          v-on="on"
          @click="$emit('char-input', char.character)"
          color="info"
          text
          small
          >{{ char.character }}</v-btn
        >
      </template>
      <span>{{ char.label }}</span>
    </v-tooltip>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export interface SpecialChar {
  character: string;
  label: string;
}

export default defineComponent({
  setup() {
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
    ]);
    return {
      specialCharacters,
    };
  },
});
</script>
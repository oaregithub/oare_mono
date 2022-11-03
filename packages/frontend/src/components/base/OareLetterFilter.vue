<template>
  <div>
    <v-btn
      v-for="lett in letters"
      class="mr-2 mb-2"
      :key="lett"
      fab
      small
      color="primary"
      :to="`/${route}/${encodedLetter(lett)}`"
      >{{ lett }}</v-btn
    >
    <v-col cols="12" sm="6" md="4">
      <v-text-field
        v-model="wordSearch"
        :placeholder="'Filter ' + filterTitle"
        clearable
      />
    </v-col>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'OareLetterFilter',
  props: {
    letter: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
    filterTitle: {
      type: String,
      default: 'words',
    },
  },
  setup(props, { emit }) {
    const letters = ref(Object.keys(AkkadianLetterGroupsUpper));
    const wordSearch = useQueryParam('filter', '', true);
    const encodedLetter = (letter: string) => encodeURIComponent(letter);

    watch(
      () => props.letter,
      () => (wordSearch.value = ''),
      { immediate: false }
    );

    watch(wordSearch, () => emit('search-input', wordSearch.value), {
      immediate: true,
    });

    return {
      letters,
      wordSearch,
      encodedLetter,
    };
  },
});
</script>

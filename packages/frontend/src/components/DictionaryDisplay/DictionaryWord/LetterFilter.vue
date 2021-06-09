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
import {
  computed,
  defineComponent,
  PropType,
  ref,
  watch,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { DisplayableWord } from '@oare/types';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'LetterFilter',
  props: {
    letter: {
      type: String,
      required: true,
    },
    wordList: {
      type: Array as PropType<DisplayableWord[]>,
      required: true,
    },
    route: {
      type: String,
      required: true,
    },
    searchFilter: {
      type: Function as PropType<
        (search: string, word: DisplayableWord) => boolean
      >,
      default: () => {
        return () => true;
      },
    },
    filterTitle: {
      type: String,
      default: 'words',
    },
  },
  setup(props, { emit }) {
    const letters = ref(Object.keys(AkkadianLetterGroupsUpper));
    const wordSearch = useQueryParam('filter', '');
    const encodedLetter = (letter: string) => encodeURIComponent(letter);

    const wordsByLetter = computed(() => {
      return props.wordList.filter(name => {
        const groupLetters = AkkadianLetterGroupsUpper[props.letter];
        return groupLetters.includes(name.word[0].toUpperCase());
      });
    });
    const filteredWords = computed(() => {
      return wordsByLetter.value.filter(word =>
        props.searchFilter(wordSearch.value, word)
      );
    });
    emit('filtered-words', filteredWords.value);

    watch(
      () => props.letter,
      () => (wordSearch.value = ''),
      { immediate: false }
    );

    watch(
      () => filteredWords.value,
      () => emit('filtered-words', filteredWords.value),
      { immediate: false }
    );

    return {
      letters,
      wordSearch,
      encodedLetter,
    };
  },
});
</script>

<style scoped></style>

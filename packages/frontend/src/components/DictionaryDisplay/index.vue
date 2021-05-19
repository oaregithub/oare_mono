<template>
  <div>
    <letter-filter
      :route="route"
      :word-list="wordList"
      :letter="letter"
      :search-filter="searchFilter"
      @filtered-words="getWords"
    >
    </letter-filter>
    <div v-for="wordInfo in filteredWords" :key="wordInfo.uuid" class="mb-3">
      <div class="d-flex">
        <slot name="word" :word="wordInfo"> </slot>
        <slot name="translation" :word="wordInfo"></slot>
      </div>
      <div>
        <slot name="forms" :word="wordInfo"></slot>
      </div>
    </div>
    <v-btn fab fixed bottom right @click="$vuetify.goTo(0)" color="info">
      <v-icon>mdi-chevron-up</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import LetterFilter from '@/views/Words/DictionaryWord/LetterFilter.vue';
import { DisplayableWord } from '@oare/types';

export default defineComponent({
  name: 'DictionaryDisplay',
  components: {
    LetterFilter,
  },
  props: {
    wordList: {
      type: Array as PropType<DisplayableWord[]>,
      required: true,
    },
    letter: {
      type: String,
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
  setup() {
    const filteredWords = ref<DisplayableWord[]>([]);

    const getWords = (words: DisplayableWord[]) => {
      filteredWords.value = words;
    };

    return {
      filteredWords,
      getWords,
    };
  },
});
</script>

<style></style>

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

    <v-container class="mb-3">
      <v-row no-gutters>
        <v-col v-for="n in 6" :key="n" cols="6" sm="2">
          <v-hover v-slot="{ hover }">
            <v-card
              class="pa-2"
              outlined
              tile
              :elevation="hover ? 12 : 2"
              :style="`background: ${highlightColors[n - 1]}`"
            >
              {{ highlightBins[n - 1] }}
              <v-expand-transition>
                <div v-if="hover" class="mb-3">total ccurrences per word</div>
              </v-expand-transition>
            </v-card>
          </v-hover>
        </v-col>
      </v-row>
    </v-container>

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
import LetterFilter from '@/components/DictionaryDisplay/DictionaryWord/LetterFilter.vue';
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

    const highlightBins = [
      '0-10',
      '11-100',
      '101-1000',
      '1001-10000',
      '10001-25000',
      '25001+',
    ];

    const highlightColors = [
      '#c0fdff',
      '#d0d1ff',
      '#deaaff',
      '#e5b3fe',
      '#f3c4fb',
      ' #ffcbf2',
    ];

    return {
      filteredWords,
      getWords,
      highlightBins,
      highlightColors,
    };
  },
});
</script>

<style></style>

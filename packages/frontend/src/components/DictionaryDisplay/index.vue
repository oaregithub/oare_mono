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
      <v-text-field v-model="wordSearch" placeholder="Filter words" clearable />
    </v-col>
    <div v-for="wordInfo in filteredWords" :key="wordInfo.uuid" class="mb-3">
      <div class="d-flex">
        <slot name="word" :word="wordInfo">
          <div class="font-weight-bold mr-1">{{ wordInfo.word }}</div>
        </slot>
        <slot name="translation" :word="wordInfo"> </slot>
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
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import {
  defineComponent,
  ref,
  Ref,
  computed,
  watch,
  PropType,
} from '@vue/composition-api';

export interface DisplayableWord {
  uuid: string;
  word: string;
}

export default defineComponent({
  name: 'DictionaryDisplay',
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
  },
  setup(props, context) {
    const filter = computed(() => {
      const {
        root: {
          $route: {
            query: { filter },
          },
        },
      } = context;
      return filter ? String(filter) : '';
    });
    const letters = ref(Object.keys(AkkadianLetterGroupsUpper));
    const wordSearch: Ref<string> = ref(filter.value || '');

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
    const encodedLetter = (letter: string) => encodeURIComponent(letter);

    watch(
      () => props.letter,
      () => (wordSearch.value = ''),
      {
        lazy: true,
      }
    );

    watch(wordSearch, () => {
      context.root.$router.replace({
        path: context.root.$route.path,
        query: {
          filter: wordSearch.value,
        },
      });
    });

    watch(
      () => context.root.$route.query,
      () => {
        wordSearch.value = filter.value;
      }
    );

    return {
      letters,
      encodedLetter,
      wordSearch,
      filteredWords,
    };
  },
});
</script>

<style></style>

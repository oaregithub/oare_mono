<template>
  <div>
    <v-row>
      <v-col cols="8">
        Search lemma, forms, and translations
        <dictionary-info-card />
        <v-text-field
          class="test-dictionary-search"
          v-model="dictionarySearch"
          placeholder="Dictionary"
          outlined
          @keyup.enter.native="resetSearch"
        />
        <span v-if="wildCard" class="red--text"
          >Please use less than 3 wildcards in your search.</span
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-btn
          class="test-submit-button"
          color="primary"
          :disabled="!canSearch || searchLoading"
          @click="resetSearch"
          >Search</v-btn
        >
      </v-col>
    </v-row>

    <ResultTable
      :totalSearchResults="totalResults"
      :searchResults="searchResults"
      :loading="searchLoading"
      :page="Number(page)"
      @update:page="page = `${$event}`"
      :rows="Number(rows)"
      @update:rows="rows = `${$event}`"
      :headers="headers"
    >
      <template #[`item.name`]="{ item }">
        <router-link
          v-if="wordLink(item)"
          :to="wordLink(item)"
          v-html="dictHighlightedItem(item.name, searchArray)"
        >
        </router-link>
      </template>

      <template #[`item.translations`]="{ item }">
        <div v-if="item.translations.length === 0" />
        <div
          v-for="(translation, idx) in getItemTranslations(item)"
          :key="idx"
          v-html="dictHighlightedItem(translation, searchArray)"
        ></div>
      </template>

      <template #[`item.matches`]="{ item }">
        <div
          v-for="(match, index) in getItemMatches(item)"
          :key="index"
          v-html="dictHighlightedItem(match, searchArray)"
        ></div>
      </template>
    </ResultTable>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  computed,
  watch,
  onMounted,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { DictionarySearchRow } from '@oare/types';
import ResultTable from '../components/ResultTable.vue';
import { dictHighlightedItem } from '../utils';
import useQueryParam from '@/hooks/useQueryParam';
import DictionaryInfoCard from './components/DictionaryInfoCard.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'DictionarySearch',
  components: {
    ResultTable,
    DictionaryInfoCard,
  },
  setup() {
    const totalResults = ref(0);
    const searchResults: Ref<DictionarySearchRow[]> = ref([]);
    const searchLoading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const dictionarySearch = useQueryParam('dictionary', '');
    const page = useQueryParam('page', '1');
    const rows = useQueryParam('rows', '25');
    const wildCard = ref(false);
    const searchArray: Ref<string[]> = ref([]);
    const canSearch = computed(() => {
      return dictionarySearch.value.trim() !== '';
    });
    const headers = ref([
      {
        text: 'Word',
        value: 'name',
      },
      {
        text: 'Matching translations',
        value: 'translations',
      },
      {
        text: 'Matching forms and spellings',
        value: 'matches',
      },
    ]);

    const performSearch = async () => {
      const moreThan2Wildcards = dictionarySearch.value
        .split('')
        .filter(char => {
          if (char === '$' || char === '&' || char === 'C') {
            return char;
          }
        });
      if (moreThan2Wildcards.length < 3) {
        if (canSearch.value) {
          searchLoading.value = true;
          wildCard.value = false;
          try {
            const searchResult = await server.searchDictionary({
              search: dictionarySearch.value,
              page: Number(page.value),
              rows: Number(rows.value),
            });
            totalResults.value = searchResult.totalRows;
            searchResults.value = searchResult.results;
            searchArray.value = searchResult.searchArray;
          } catch (err) {
            actions.showErrorSnackbar(
              'Error performing dictionary search. Please try again.',
              err as Error
            );
          } finally {
            searchLoading.value = false;
          }
        }
      } else {
        wildCard.value = true;
      }
    };

    const resetSearch = () => {
      page.value = '1';
      performSearch();
    };

    onMounted(performSearch);

    watch([page, rows], performSearch, { immediate: false });

    const getWordGroup = (word: string) => {
      for (const [group, groupLetters] of Object.entries(
        AkkadianLetterGroupsUpper
      )) {
        if (groupLetters.includes(word[0].toUpperCase())) {
          return group;
        }
      }
      return 'A';
    };

    const wordLink = (word: DictionarySearchRow) => {
      if (word.type === 'word') {
        return `/dictionaryWord/${word.uuid}`;
      } else if (word.type === 'PN') {
        const nameGroup = getWordGroup(word.name);
        return `/names/${encodeURIComponent(nameGroup)}?filter=${word.name}`;
      } else if (word.type === 'GN') {
        const placeGroup = getWordGroup(word.name);
        return `/places/${encodeURIComponent(placeGroup)}?filter=${word.name}`;
      }
      return null;
    };

    const getItemTranslations = (item: DictionarySearchRow) => {
      return item.translations;
    };

    const getItemMatches = (item: DictionarySearchRow) => {
      return item.matches;
    };

    return {
      dictionarySearch,
      canSearch,
      totalResults,
      searchResults,
      performSearch,
      dictHighlightedItem,
      searchLoading,
      page,
      rows,
      headers,
      searchArray,
      wildCard,
      wordLink,
      resetSearch,
      getItemTranslations,
      getItemMatches,
    };
  },
});
</script>

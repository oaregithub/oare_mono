<template>
  <div>
    <v-row>
      <v-col cols="8">
        Search lemma, forms, and translations<dictionary-search-info-card
        ></dictionary-search-info-card>
        <v-text-field
          class="test-dictionary-search"
          v-model="dictionarySearch"
          placeholder="Dictionary"
          outlined
          @keyup.enter.native="resetSearch"
        />
        <v-btn
          class="test-submit-button"
          color="primary"
          :disabled="!canSearch || searchLoading"
          @click="resetSearch"
          >Search</v-btn
        >
      </v-col>
      <v-col cols="4">
        <v-radio-group label="Respect Character Boundaries" v-model="useMode">
          <v-radio label="Yes" value="respectCharBoundaries"></v-radio>
          <v-radio label="No" value="respectNoBoundaries"></v-radio>
        </v-radio-group>
      </v-col>
    </v-row>

    <ResultTable
      :totalSearchResults="totalResults"
      :searchResults="searchResults"
      :loading="searchLoading"
      :page="Number(page)"
      @update:page="p => (page = p)"
      :rows="Number(rows)"
      @update:rows="r => (rows = r)"
      :headers="headers"
    >
      <template #[`item.name`]="{ item }">
        <router-link
          v-if="wordLink(item)"
          :to="wordLink(item)"
          v-html="highlightedItem(item.name, lastSearch)"
        >
        </router-link>
      </template>

      <template #[`item.translations`]="{ item }">
        <div v-if="item.translations.length === 0" />
        <div
          v-for="(translation, idx) in getItemTranslations(item)"
          :key="idx"
          v-html="highlightedItem(translation, lastSearch)"
        ></div>
      </template>

      <template #[`item.matches`]="{ item }">
        <div
          v-for="(match, index) in getItemMatches(item)"
          :key="index"
          v-html="highlightedItem(match, lastSearch)"
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
import DictionarySearchInfoCard from './components/DictionarySearchInfoCard.vue';
import { highlightedItem } from '../utils';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'DictionarySearch',
  components: {
    ResultTable,
    DictionarySearchInfoCard,
  },
  setup() {
    const totalResults = ref(0);
    const searchResults: Ref<DictionarySearchRow[]> = ref([]);
    const searchLoading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const dictionarySearch = useQueryParam('dictionary', '', true);
    const page = useQueryParam('page', '1', false);
    const rows = useQueryParam('rows', '25', true);
    const mode = useQueryParam('mode', 'respectCharBoundaries', true);
    const useMode = ref(mode.value);
    const lastSearch = ref('');
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
      if (canSearch.value) {
        searchLoading.value = true;
        lastSearch.value = dictionarySearch.value;
        try {
          const searchResult = await server.searchDictionary({
            search: dictionarySearch.value,
            page: Number(page.value),
            rows: Number(rows.value),
            mode: useMode.value,
          });
          totalResults.value = searchResult.totalRows;
          searchResults.value = searchResult.results;
        } catch (err) {
          actions.showErrorSnackbar(
            'Error performing dictionary search. Please try again.',
            err as Error
          );
        } finally {
          searchLoading.value = false;
        }
      }
    };

    const enableModeSelection = computed(() => {
      return !dictionarySearch.value.includes('-');
    });

    const resetSearch = () => {
      page.value = '1';
      performSearch();
    };

    onMounted(performSearch);

    watch([page, rows], performSearch, { immediate: false });

    const wordLink = (word: DictionarySearchRow) => {
      if (word.type === 'word') {
        return `/dictionaryWord/${word.uuid}`;
      } else if (word.type === 'PN') {
        return `/namesWord/${word.uuid}`;
      } else if (word.type === 'GN') {
        return `/placesWord/${word.uuid}`;
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
      highlightedItem,
      searchLoading,
      page,
      rows,
      headers,
      lastSearch,
      wordLink,
      resetSearch,
      getItemTranslations,
      getItemMatches,
      enableModeSelection,
      useMode,
    };
  },
});
</script>

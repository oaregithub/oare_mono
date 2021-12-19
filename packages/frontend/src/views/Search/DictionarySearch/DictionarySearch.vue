<template>
  <div>
    <v-row>
      <v-col cols="8">
        Search lemma, forms, and translations
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
          v-for="(translation, idx) in item.translations"
          :key="idx"
          v-html="highlightedItem(translation, lastSearch)"
        ></div>
      </template>

      <template #[`item.matches`]="{ item }">
        <div
          v-for="(match, index) in item.matches"
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
import { highlightedItem } from '../utils';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'DictionarySearch',
  components: {
    ResultTable,
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
          });
          totalResults.value = searchResult.totalRows;
          searchResults.value = searchResult.results;
        } catch(err) {
          actions.showErrorSnackbar(
            'Error performing dictionary search. Please try again.',
            err as Error
          );
        } finally {
          searchLoading.value = false;
        }
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
    };
  },
});
</script>

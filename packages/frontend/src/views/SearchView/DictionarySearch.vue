<template>
  <div>
    <v-row>
      <v-col cols="8">
        Search lemma, forms, and translations
        <v-text-field
          :value="dictionarySearch"
          @input="setDictionarySearch"
          placeholder="Dictionary"
          outlined
          @keyup.enter.native="performSearch"
        />
        <v-btn
          color="primary"
          :disabled="!canSearch || searchLoading"
          @click="performSearch"
          >Search</v-btn
        >
      </v-col>
    </v-row>

    <ResultTable
      :totalSearchResults="totalResults"
      :searchResults="searchResults"
      :loading="searchLoading"
      :page="Number(page)"
      @update:page="p => setPage(String(p))"
      :rows="Number(rows)"
      @update:rows="r => setRows(String(r))"
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
import ResultTable from './ResultTable.vue';
import server from '@/serverProxy';
import { highlightedItem } from './utils';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'DictionarySearch',
  components: {
    ResultTable,
  },
  setup(props, context) {
    const totalResults = ref(0);
    const searchResults: Ref<DictionarySearchRow[]> = ref([]);
    const searchLoading = ref(false);

    const [dictionarySearch, setDictionarySearch] = useQueryParam(
      'dictionary',
      ''
    );
    const [page, setPage] = useQueryParam('page', '1');
    const [rows, setRows] = useQueryParam('rows', '10');
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
        const searchResult = await server.searchDictionary(
          dictionarySearch.value,
          Number(page.value),
          Number(rows.value)
        );
        totalResults.value = searchResult.totalRows;
        searchResults.value = searchResult.results;
        searchLoading.value = false;
      }
    };

    onMounted(performSearch);

    watch([page, rows], performSearch, { lazy: true });

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
      setDictionarySearch,
      canSearch,
      totalResults,
      searchResults,
      performSearch,
      highlightedItem,
      searchLoading,
      page,
      setPage,
      rows,
      setRows,
      headers,
      lastSearch,
      wordLink,
    };
  },
});
</script>

<style></style>

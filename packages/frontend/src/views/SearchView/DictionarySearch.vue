<template>
  <div>
    <v-row>
      <v-col cols="8">
        Search lemma, forms, and translations
        <v-text-field
          v-model="dictionarySearch"
          placeholder="Dictionary"
          outlined
          @keyup.enter.native="triggerSearch"
        />
        <v-btn
          color="primary"
          :disabled="!canSearch || searchLoading"
          @click="triggerSearch"
          >Search</v-btn
        >
      </v-col>
    </v-row>

    <ResultTable
      :totalSearchResults="totalResults"
      :searchResults="searchResults"
      :loading="searchLoading"
      :page.sync="page"
      :rows.sync="rows"
      :headers="headers"
    >
      <template #item.name="{ item }">
        <router-link
          v-if="wordLink(item)"
          :to="wordLink(item)"
          v-html="highlightedItem(item.name, lastSearch)"
        >
        </router-link>
      </template>

      <template #item.translations="{ item }">
        <div v-if="item.translations.length === 0" />
        <div
          v-for="(translation, idx) in item.translations"
          :key="idx"
          v-html="highlightedItem(translation, lastSearch)"
        ></div>
      </template>

      <template #item.matches="{ item }">
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
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
import { DictionarySearchRow } from '@/types/search_dictionary';
import ResultTable from './ResultTable.vue';
import server from '@/serverProxy';
import { updateUrl, highlightedItem } from './utils';

export default defineComponent({
  name: 'DictionarySearch',
  components: {
    ResultTable,
  },
  setup(props, context) {
    const dictionarySearch = ref('');
    const totalResults = ref(0);
    const searchResults: Ref<DictionarySearchRow[]> = ref([]);
    const searchLoading = ref(false);
    const page = ref(1);
    const rows = ref(10);
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
          page.value,
          rows.value
        );
        totalResults.value = searchResult.totalRows;
        searchResults.value = searchResult.results;
        searchLoading.value = false;
      }
    };

    const queryUrl = computed(() => ({
      page: String(page.value),
      rows: String(rows.value),
      dictionary: dictionarySearch.value,
    }));

    watch(page, () => updateUrl(queryUrl.value), { lazy: true });
    watch(rows, () => updateUrl(queryUrl.value), { lazy: true });

    const triggerSearch = async () => {
      if (canSearch.value) {
        updateUrl({
          ...queryUrl.value,
          page: '1',
        });
      }
    };

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

    watch(
      () => context.root.$route.query,
      () => {
        const {
          root: {
            $route: { query },
          },
        } = context;
        dictionarySearch.value = query.dictionary
          ? String(query.dictionary)
          : '';
        page.value = query.page ? Number(query.page) : 1;
        rows.value = query.rows ? Number(rows.value) : 10;
        performSearch();
      },
      { deep: true }
    );

    return {
      dictionarySearch,
      canSearch,
      totalResults,
      searchResults,
      triggerSearch,
      highlightedItem,
      searchLoading,
      page,
      rows,
      headers,
      lastSearch,
      wordLink,
    };
  },
});
</script>

<style></style>

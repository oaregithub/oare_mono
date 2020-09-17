<template>
  <div>
    <v-row>
      <v-col cols="8">
        {{ $t('search.textTitle') }}
        <v-text-field
          v-model="textTitleSearch"
          placeholder="Text title"
          @keyup.enter="searchTexts"
          outlined
        />
        {{ $t('search.characterSequenceDescription') }}
        <v-text-field
          v-model="transliterationSearch"
          :placeholder="$t('search.characterSequences')"
          @keyup.enter="searchTexts"
          outlined
        ></v-text-field>
        <v-btn
          @click="searchTexts"
          color="primary"
          :disabled="!canPerformSearch"
          >{{ $t('search.searchBtnText') }}</v-btn
        >
      </v-col>
    </v-row>
    <result-table
      :searchResults="searchResults"
      :loading="searchLoading"
      :totalSearchResults="totalSearchResults"
      :page="Number(page)"
      @update:page="p => setPage(String(p))"
      :rows="Number(rows)"
      @update:rows="r => setRows(String(r))"
      :headers="headers"
    >
      <template #item.name="{ item }">
        <router-link :to="'/epigraphies/' + item.uuid">
          {{ item.name }}
        </router-link>
      </template>
    </result-table>
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
import { SearchResultRow, SearchResult } from '@/types/search';
import { updateUrl, formattedSearchCharacter } from './utils';
import server from '@/serverProxy';
import ResultTable from './ResultTable.vue';
import { highlightedItem } from './utils';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'TextsSearch',
  components: {
    ResultTable,
  },
  setup(props, context) {
    const searchResults: Ref<SearchResultRow[]> = ref([]);
    const textTitleSearch = ref('');
    const transliterationSearch = ref('');
    const searchLoading = ref(false);
    const totalSearchResults = ref(0);
    const [rows, setRows] = useQueryParam('rows', '10');
    const [page, setPage] = useQueryParam('page', '1');

    const headers = ref([
      {
        text: 'Text Name',
        value: 'name',
      },
      {
        text: 'Matching Lines',
        value: 'matches',
      },
    ]);

    const searchCharsArray = computed(() => {
      let chars = transliterationSearch.value
        .trim()
        .split(/[\s\-.]+/)
        .map(formattedSearchCharacter);

      if (chars.length === 1 && chars[0] === '') {
        return [];
      }
      return chars;
    });

    const canPerformSearch = computed(() => {
      return transliterationSearch.value.trim() || textTitleSearch.value.trim();
    });

    const queryUrl = computed(() => ({
      page: String(page.value),
      rows: String(rows.value),
      title: textTitleSearch.value,
      query: transliterationSearch.value,
    }));

    const searchTexts = async () => {
      searchLoading.value = true;
      let { totalRows, results }: SearchResult = await server.searchTexts(
        [...searchCharsArray.value],
        textTitleSearch.value,
        {
          page: Number(page.value),
          rows: Number(rows.value),
        }
      );

      totalSearchResults.value = totalRows;
      searchResults.value = results;

      searchLoading.value = false;
    };

    watch(
      [page, rows],
      () => {
        if (canPerformSearch.value) {
          searchTexts();
        }
      },
      { lazy: true }
    );

    return {
      searchResults,
      textTitleSearch,
      transliterationSearch,
      searchLoading,
      totalSearchResults,
      canPerformSearch,
      page,
      setPage,
      rows,
      setRows,
      headers,
      highlightedItem,
      searchTexts,
    };
  },
});
</script>

<style></style>

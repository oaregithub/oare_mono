<template>
  <div>
    <v-row>
      <v-col cols="8">
        {{ $t('search.textTitle') }}
        <v-text-field
          class="test-title-search"
          :value="textTitleSearch"
          @input="setTextTitleSearch"
          placeholder="Text title"
          @keyup.enter="resetSearch"
          outlined
        />
        {{ $t('search.characterSequenceDescription') }}
        <search-information-card/>
        <v-text-field
          class="test-character-search"
          :value="translitSearch"
          @input="setTranslitSearch"
          :placeholder="$t('search.characterSequences')"
          @keyup.enter="resetSearch"
          outlined
        ></v-text-field>
        <v-btn
          class="test-submit-button"
          @click="resetSearch"
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
      :searchTotalLoading="searchTotalLoading"
      :page="Number(page)"
      @update:page="p => setPage(String(p))"
      :rows="Number(rows)"
      @update:rows="r => setRows(String(r))"
      :headers="headers"
    >
      <template #[`item.name`]="{ item }">
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
  onMounted,
} from '@vue/composition-api';
import { SearchTextsResultRow, SearchTextsResponse } from '@oare/types';
import ResultTable from '../components/ResultTable.vue';
import SearchInformationCard from './components/SearchInformationCard.vue';
import { highlightedItem } from '../utils';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'TextsSearch',
  components: {
    ResultTable,
    SearchInformationCard,
  },
  setup() {
    const searchResults: Ref<SearchTextsResultRow[]> = ref([]);
    const searchLoading = ref(false);
    const searchTotalLoading = ref(false);
    const totalSearchResults = ref(0);

    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const [translitSearch, setTranslitSearch] = useQueryParam('translit', '');
    const [textTitleSearch, setTextTitleSearch] = useQueryParam('title', '');
    const [rows, setRows] = useQueryParam('rows', '100');
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

    const canPerformSearch = computed(() => {
      return translitSearch.value.trim() || textTitleSearch.value.trim();
    });

    const searchTexts = async () => {
      if (!canPerformSearch.value) return;

      searchLoading.value = true;
      try {
        let {
          results,
        }: SearchTextsResponse = await server.searchTexts({
          characters: translitSearch.value,
          textTitle: textTitleSearch.value,
          page: Number(page.value),
          rows: Number(rows.value),
        });
        searchResults.value = results;
      } catch {
        actions.showErrorSnackbar('Error searching texts. Please try again.');
      } finally {
        searchLoading.value = false;
      }
    };

    const resetSearch = async () => {
      page.value = '1';
      totalSearchResults.value = -1;
      searchTotalLoading.value = true;
      searchTexts();
      try {
        totalSearchResults.value = await server.searchTextsTotal({
          characters: translitSearch.value,
          textTitle: textTitleSearch.value,
        });
      } catch {
        actions.showErrorSnackbar('Error getting texts total. Please try again.');
      } finally {
        searchTotalLoading.value = false;
      }
    };

    watch([page, rows], searchTexts, { immediate: false });

    onMounted(resetSearch);

    return {
      searchResults,
      textTitleSearch,
      setTextTitleSearch,
      translitSearch,
      setTranslitSearch,
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
      resetSearch,
      searchTotalLoading,
    };
  },
});
</script>

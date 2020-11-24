<template>
  <oare-dialog
    title="Add Spelling"
    :value="value"
    @input="$emit('input', $event)"
    :submitDisabled="!spelling"
    :width="1000"
  >
    <v-text-field v-model="spelling" autofocus clearable />
    <v-row>
      <v-col cols="12" md="6">
        This spelling appears in the following forms:
        <v-data-table
          :headers="spellingResultHeaders"
          :items="spellingSearchResults"
          :loading="searchSpellingLoading"
        >
          <template #[`item.word`]="{ item }">
            <router-link :to="`/dictionaryWord/${item.wordUuid}`">{{
              item.word
            }}</router-link>
          </template>
          <template #[`item.form`]="{ item }">
            {{ item.form.form }}
          </template>
        </v-data-table>
      </v-col>
      <v-col cols="12" md="6">
        This spelling appears in the following texts:
        <v-data-table
          :headers="discourseResultHeaders"
          :items="discourseSearchResults"
          :loading="searchDiscourseLoading"
          :server-items-length="totalDiscourseResults"
          :options.sync="discourseOptions"
        >
          <template #[`item.textName`]="{ item }">
            <router-link :to="`/epigraphies/${item.textUuid}`">{{
              item.textName
            }}</router-link>
          </template>
          <template #[`item.readings`]="{ item }">
            <span v-html="renderedReading(item)" />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import OareDialog from '@/components/base/OareDialog.vue';
import {
  SearchSpellingResultRow,
  SearchDiscourseSpellingRow,
} from '@oare/types';
import {
  defineComponent,
  ref,
  reactive,
  Ref,
  watch,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import _ from 'lodash';
import { DataTableHeader } from 'vuetify';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    OareDialog,
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const spelling = ref('');
    const searchedSpelling = ref('');
    const totalDiscourseResults = ref(0);
    const discourseOptions = ref({
      page: 1,
      itemsPerPage: 10,
    });

    const spellingSearchResults: Ref<SearchSpellingResultRow[]> = ref([]);
    const discourseSearchResults: Ref<SearchDiscourseSpellingRow[]> = ref([]);
    const searchSpellingLoading = ref(false);
    const searchDiscourseLoading = ref(false);

    const spellingResultHeaders: Ref<DataTableHeader[]> = ref([
      {
        text: 'Word',
        value: 'word',
      },
      {
        text: 'Form',
        value: 'form',
      },
    ]);

    const discourseResultHeaders: Ref<DataTableHeader[]> = ref([
      {
        text: 'Text',
        value: 'textName',
      },
      {
        text: 'Line',
        value: 'line',
      },
      {
        text: 'Reading',
        value: 'readings',
      },
    ]);

    const renderedReading = (row: SearchDiscourseSpellingRow) => {
      return row.readings
        .map(reading =>
          reading.wordOnTablet === row.wordOnTablet
            ? `<mark>${reading.spelling}</mark>`
            : reading.spelling
        )
        .join(' ');
    };

    const searchSpellings = async (newSpelling: string) => {
      try {
        searchSpellingLoading.value = true;
        searchedSpelling.value = newSpelling;
        spellingSearchResults.value = await server.searchSpellings(newSpelling);
      } catch {
        actions.showErrorSnackbar('Failed to search for spellings');
      } finally {
        searchSpellingLoading.value = false;
      }
    };

    const searchDiscourse = async (newSpelling: string) => {
      try {
        searchDiscourseLoading.value = true;
        discourseSearchResults.value = [];
        const { totalResults, rows } = await server.searchSpellingDiscourse(
          newSpelling,
          {
            page: discourseOptions.value.page - 1,
            limit: discourseOptions.value.itemsPerPage,
          }
        );

        discourseSearchResults.value = rows;
        totalDiscourseResults.value = totalResults;
      } catch {
        actions.showErrorSnackbar('Failed to search discourse spellings');
      } finally {
        searchDiscourseLoading.value = false;
      }
    };

    watch(
      spelling,
      _.debounce(async (newSpelling: string) => {
        if (newSpelling) {
          searchSpellings(newSpelling);
          searchDiscourse(newSpelling);
        } else {
          spellingSearchResults.value = [];
          discourseSearchResults.value = [];
        }
      }, 500)
    );

    watch(
      discourseOptions,
      () => {
        if (spelling.value) {
          searchDiscourse(spelling.value);
        }
      },
      { deep: true }
    );

    return {
      spelling,
      spellingSearchResults,
      discourseSearchResults,
      spellingResultHeaders,
      discourseResultHeaders,
      searchSpellingLoading,
      searchDiscourseLoading,
      renderedReading,
      totalDiscourseResults,
      discourseOptions,
    };
  },
});
</script>

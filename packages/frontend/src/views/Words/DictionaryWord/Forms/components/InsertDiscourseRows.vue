<template>
  <div>
    <div class="red--text text--darken-2 font-weight-bold">
      <span v-if="numFormOccurrences === 0"
        >The input spelling does not exist on any forms. Please add the spelling
        first.</span
      >
    </div>
    The following spelling occurrences are missing discourse information:
    <v-data-table
      v-model="selectedOccurrences"
      :headers="listHeaders"
      :items="searchNullDiscourseLoading ? [] : nullDiscourseOccurrences"
      :loading="searchNullDiscourseLoading"
      :server-items-length="nullDiscourseCount"
      :options.sync="searchOptions"
      :footer-props="{ 'items-per-page-options': [10, 25, 50, 100] }"
      item-key="epigraphyUuids[0]"
      show-select
    >
      <template #[`item.textName`]="{ item }">
        <router-link :to="`/epigraphies/${item.textUuid}`">{{
          item.textName
        }}</router-link>
      </template>
      <template #[`item.reading`]="{ item }">
        <span v-html="item.reading"></span>
      </template>
      <template #[`footer.page-text`]="items">
        <div v-if="!items.itemsLength || !items.pageStart || !items.pageStop">
          —
        </div>
        <div v-else>
          {{ items.pageStart }} - {{ items.pageStop }} of
          {{ searchNullCountLoading ? 'Loading...' : items.itemsLength }}
        </div>
      </template>
    </v-data-table>
    <v-row>
      <v-spacer />
      <OareLoaderButton
        color="primary"
        @click="insertDiscourseRows"
        class="test-submit-btn mt-4"
        :disabled="selectedOccurrences.length === 0 || numFormOccurrences === 0"
        :loading="insertDiscourseRowsLoading"
      >
        Submit
      </OareLoaderButton>
    </v-row>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  Ref,
  watch,
  inject,
} from '@vue/composition-api';
import {
  DictionaryForm,
  FormSpelling,
  SearchNullDiscourseResultRow,
} from '@oare/types';
import { spellingHtmlReading } from '@oare/oare';
import useQueryParam from '@/hooks/useQueryParam';
import { DataTableHeader, DataOptions } from 'vuetify';
import { ReloadKey } from '../../index.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'InsertDiscourseRows',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    spelling: {
      type: Object as PropType<FormSpelling>,
      required: true,
    },
    spellingInput: {
      type: String,
      required: true,
    },
    numFormOccurrences: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const reload = inject(ReloadKey);

    const searchNullDiscourseLoading = ref(false);
    const searchNullCountLoading = ref(false);
    const insertDiscourseRowsLoading = ref(false);
    const [page, setPage] = useQueryParam('page', '1');
    const [limit, setRows] = useQueryParam('limit', '50');

    const nullDiscourseOccurrences: Ref<SearchNullDiscourseResultRow[]> = ref(
      []
    );
    const nullDiscourseCount = ref(0);
    const selectedOccurrences: Ref<SearchNullDiscourseResultRow[]> = ref([]);

    const listHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Text', value: 'textName', width: '40%' },
      { text: 'Line', value: 'line', width: '10%' },
      { text: 'Reading', value: 'reading', width: '50%' },
    ]);
    const searchOptions: Ref<DataOptions> = ref({
      page: Number(page.value),
      itemsPerPage: Number(limit.value),
      sortBy: [],
      sortDesc: [],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: false,
    });

    const searchNullDiscourse = async () => {
      try {
        searchNullDiscourseLoading.value = true;
        nullDiscourseOccurrences.value = await server.searchNullDiscourse(
          props.spellingInput,
          Number(page.value),
          Number(limit.value)
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading null discourse occurrences. Please try again.'
        );
      } finally {
        searchNullDiscourseLoading.value = false;
      }
    };

    const searchNullDiscourseCount = async () => {
      try {
        searchNullCountLoading.value = true;
        nullDiscourseCount.value = await server.searchNullDiscourseCount(
          props.spellingInput
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading null discourse occurrences total. Please try again.'
        );
      } finally {
        searchNullCountLoading.value = false;
      }
    };

    const insertDiscourseRows = async () => {
      try {
        insertDiscourseRowsLoading.value = true;
        await server.insertDiscourseRow(
          props.spellingInput,
          selectedOccurrences.value
        );
        searchOptions.value.page = 1;
        reload && reload();
      } catch {
        actions.showErrorSnackbar(
          'Error inserting selected occurrence to the text discourse table. Please try again.'
        );
      } finally {
        insertDiscourseRowsLoading.value = false;
      }
    };

    watch(
      () => props.spellingInput,
      _.debounce(async (newSpelling: string) => {
        searchOptions.value.page = 1;
        if (newSpelling) {
          await searchNullDiscourse();
          await searchNullDiscourseCount();
        } else {
          nullDiscourseOccurrences.value = [];
          selectedOccurrences.value = [];
          nullDiscourseCount.value = 0;
        }
      }, 500)
    );

    watch(searchOptions, async () => {
      try {
        setPage(String(searchOptions.value.page));
        setRows(String(searchOptions.value.itemsPerPage));
        if (props.spellingInput) {
          await searchNullDiscourse();
        }
      } catch {
        actions.showErrorSnackbar(
          `Error retrieving more occurrences. Please try again.`
        );
      }
    });

    watch(
      () => props.value,
      open => {
        if (!open) {
          nullDiscourseOccurrences.value = [];
          selectedOccurrences.value = [];
          searchOptions.value.page = 1;
        } else {
          if (props.spellingInput) {
            searchNullDiscourse();
            searchNullDiscourseCount();
          }
        }
      },
      { immediate: true }
    );

    return {
      spellingHtmlReading,
      nullDiscourseOccurrences,
      nullDiscourseCount,
      searchNullDiscourse,
      searchNullDiscourseCount,
      selectedOccurrences,
      searchNullDiscourseLoading,
      listHeaders,
      searchOptions,
      insertDiscourseRows,
      searchNullCountLoading,
      insertDiscourseRowsLoading,
    };
  },
});
</script>

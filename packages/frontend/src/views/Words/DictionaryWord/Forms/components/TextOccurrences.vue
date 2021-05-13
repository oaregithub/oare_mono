<template>
  <OareDialog
    :value="value"
    :title="`Texts for ${title}`"
    :showSubmit="false"
    cancelText="Close"
    :persistent="false"
    @input="clearValues"
  >
    <v-row>
      <v-col cols="12" sm="6" class="py-0">
        <v-text-field v-model="search" clearable label="Filter" autofocus />
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="textOccurrences"
      :search="search"
      :loading="referencesLoading"
      :server-items-length="allTextOccurrencesLength"
      :options.sync="tableOptions"
      :footer-props="{
        'items-per-page-options': [10, 25, 50, 100],
      }"
    >
      <template #[`item.text`]="{ item }">
        <router-link :to="`/epigraphies/${item.textUuid}`" class="test-text">{{
          item.textName
        }}</router-link>
      </template>
      <template #[`item.context`]="{ item }">
        <div
          v-for="(reading, index) in item.readings"
          class="test-reading"
          :key="index"
          v-html="reading"
        />
      </template>
    </v-data-table>
  </OareDialog>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  reactive,
  ref,
  watch,
} from '@vue/composition-api';
import { Pagination, SpellingOccurrenceResponseRow } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
    uuid: {
      type: String,
      required: true,
    },
    getTexts: {
      type: Function as PropType<
        (uuid: string, request: Pagination) => SpellingOccurrenceResponseRow[]
      >,
      required: true,
    },
    // Only needed when paginating on the backend
    getTextsCount: {
      type: Function as PropType<
        (uuid: string, filter: Partial<Pagination>) => number
      >,
      required: false,
    },
    totalTextOccurrences: {
      type: Number,
      required: true,
    },
    value: {
      type: Boolean,
      default: false,
    },
    defaultPageSize: {
      type: Boolean,
      default: true,
    },
    manualPagination: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const search = ref('');
    const override = ref(false);
    const allTextOccurrences = ref<SpellingOccurrenceResponseRow[]>([]);
    const allTextOccurrencesLength = ref(props.totalTextOccurrences);
    const textOccurrences = ref<SpellingOccurrenceResponseRow[]>([]);
    const headers: DataTableHeader[] = reactive([
      {
        text: 'Text Name',
        value: 'text',
      },
      {
        text: 'Context',
        value: 'context',
      },
    ]);

    const referencesLoading = ref(false);
    const tableOptions = ref({
      page: 1,
      itemsPerPage: 10,
    });

    const pageSize = props.defaultPageSize
      ? tableOptions.value.page
      : tableOptions.value.page - 1;

    const canRetrievedAllData = (): boolean => {
      return (
        !props.manualPagination ||
        (props.manualPagination && textOccurrences.value.length === 0)
      );
    };

    const getReferences = async () => {
      try {
        referencesLoading.value = true;
        if (canRetrievedAllData() || override.value) {
          allTextOccurrences.value = await props.getTexts(props.uuid, {
            page: props.defaultPageSize
              ? tableOptions.value.page
              : tableOptions.value.page - 1,
            limit: tableOptions.value.itemsPerPage,
            ...(search.value ? { filter: search.value } : null),
          });
          textOccurrences.value = allTextOccurrences.value;
          if (props.manualPagination) {
            setTextOccurrenceManualPaginationLength();
          }
        }

        if (props.manualPagination) {
          textOccurrences.value = manuallyPaginate(allTextOccurrences.value);
        }
      } catch {
        actions.showErrorSnackbar('Failed to load text occurrences');
      } finally {
        referencesLoading.value = false;
      }
    };

    const getReferencesOverride = async () => {
      override.value = true;
      await getReferences();
      override.value = false;
    };

    const setTextOccurrenceManualPaginationLength = () => {
      allTextOccurrencesLength.value =
        search.value === ''
          ? props.totalTextOccurrences
          : allTextOccurrences.value.length;
    };

    const manuallyPaginate = (values: any[]): any[] => {
      const updatedValues = values.slice(
        (tableOptions.value.page - pageSize) * tableOptions.value.itemsPerPage,
        tableOptions.value.page * tableOptions.value.itemsPerPage
      );

      tableOptions.value.page = 1;
      return updatedValues;
    };

    const clearValues = () => {
      search.value = '';
      tableOptions.value.page = 1;
      tableOptions.value.itemsPerPage = 10;
      emit('input');
    };

    watch(() => props.uuid, getReferencesOverride);

    watch(tableOptions, getReferences);

    watch(
      search,
      _.debounce(async () => {
        if (!props.manualPagination && props.getTextsCount) {
          allTextOccurrencesLength.value = await props.getTextsCount(
            props.uuid,
            {
              filter: search.value,
            }
          );
        }
        await getReferencesOverride();
      }, 500)
    );

    return {
      search,
      textOccurrences,
      allTextOccurrencesLength,
      allTextOccurrences,
      headers,
      referencesLoading,
      tableOptions,
      clearValues,
    };
  },
});
</script>

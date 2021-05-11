<template>
  <OareDialog
    :value="value"
    :title="`Texts for ${title}`"
    :showSubmit="false"
    cancelText="Close"
    :persistent="false"
    @input="$emit('input', $event)"
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
      :server-items-length="totalTextOccurrences"
      :options.sync="tableOptions"
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
  PropType,
  reactive,
  ref,
  watch,
  computed,
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
    totalTextOccurrences: {
      type: Number,
      required: true,
    },
    getTexts: {
      type: Function as PropType<
        (uuid: string, request: Pagination) => SpellingOccurrenceResponseRow[]
      >,
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
  setup(props) {
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const search = ref('');
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

    const pageSize = computed(() => {
      return props.defaultPageSize
        ? tableOptions.value.page
        : tableOptions.value.page - 1;
    });

    const canRetrievedAllData = (): boolean => {
      return (
        !props.manualPagination ||
        (props.manualPagination && textOccurrences.value.length === 0)
      );
    };

    const getReferences = async () => {
      try {
        referencesLoading.value = true;
        if (canRetrievedAllData()) {
          textOccurrences.value = await props.getTexts(props.uuid, {
            page: pageSize.value,
            limit: tableOptions.value.itemsPerPage,
            ...(search.value ? { filter: search.value } : null),
          });
        }

        if (props.manualPagination) {
          textOccurrences.value = manuallyPaginate(textOccurrences.value);
        }
      } catch {
        actions.showErrorSnackbar('Failed to load text occurrences');
      } finally {
        referencesLoading.value = false;
      }
    };

    const manuallyPaginate = (values: any[]): any[] =>
      values.slice(
        (tableOptions.value.page - pageSize.value) *
          tableOptions.value.itemsPerPage,
        tableOptions.value.page * tableOptions.value.itemsPerPage
      );

    watch(tableOptions, getReferences);

    watch(search, _.debounce(getReferences, 500));

    return {
      search,
      textOccurrences,
      headers,
      referencesLoading,
      tableOptions,
    };
  },
});
</script>

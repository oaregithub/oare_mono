<template>
  <v-data-table
    v-bind="$attrs"
    :options.sync="sortOptions"
    :loading="loading"
    :items="loading ? [] : $attrs.items"
    :footer-props="{
      'items-per-page-options': [10, 25, 50, 100],
    }"
  >
    <template
      v-for="(_, scopedSlotName) in $scopedSlots"
      v-slot:[scopedSlotName]="slotData"
    >
      <slot :name="scopedSlotName" v-bind="slotData" />
    </template>

    <template v-for="(_, slotName) in $slots" v-slot:[slotName]>
      <slot :name="slotName" />
    </template>
  </v-data-table>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  PropType,
  watch,
  computed,
} from '@vue/composition-api';
import useQueryParam from '@/hooks/useQueryParam';
import { DataOptions } from 'vuetify';
import sl from '@/serviceLocator';

export interface OareDataTableOptions {
  page: number;
  rows: number;
  sortBy: string;
  sortDesc: boolean;
}

export default defineComponent({
  props: {
    debounce: {
      type: Boolean,
      default: false,
    },
    defaultSort: {
      type: String,
      default: '',
    },
    defaultDesc: {
      type: Boolean,
      default: true,
    },
    defaultPage: {
      type: Number,
      default: 1,
    },
    defaultRows: {
      type: Number,
      default: 10,
    },
    errorMessage: {
      type: String,
      default: 'Failed to fetch items',
    },
    fetchItems: {
      type: Function as PropType<
        (options: OareDataTableOptions) => Promise<void>
      >,
      required: true,
    },
    watchedParams: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  setup({
    debounce,
    defaultSort,
    defaultDesc,
    defaultPage,
    defaultRows,
    fetchItems,
    errorMessage,
    watchedParams,
  }) {
    const _ = sl.get('lodash');
    const actions = sl.get('globalActions');
    const sortBy = useQueryParam('sortBy', defaultSort);
    const sortDesc = useQueryParam('sortDesc', String(defaultDesc));
    const page = useQueryParam('page', String(defaultPage));
    const rows = useQueryParam('rows', String(defaultRows));

    const loading = ref(false);

    const sortOptions = ref<DataOptions>({
      page: Number(page.value),
      itemsPerPage: Number(rows.value),
      sortBy: [sortBy.value],
      sortDesc: [sortDesc.value === 'true'],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: true,
    });

    const tableOptions = computed<OareDataTableOptions>(() => ({
      page: Number(page.value),
      rows: Number(rows.value),
      sortBy: sortBy.value,
      sortDesc: sortDesc.value === 'true',
    }));

    const queryParams = watchedParams.map(paramName =>
      useQueryParam(paramName, '')
    );

    const performFetch = async () => {
      try {
        loading.value = true;
        await fetchItems(tableOptions.value);
      } catch (err) {
        actions.showErrorSnackbar(errorMessage, err as Error);
      } finally {
        loading.value = false;
      }
    };

    const queryParamsOnChange = () => {
      sortOptions.value.page = 1;
      performFetch();
    };

    watch(
      queryParams,
      debounce ? _.debounce(queryParamsOnChange, 500) : queryParamsOnChange
    );

    watch(sortOptions, newOptions => {
      sortBy.value = newOptions.sortBy[0];
      sortDesc.value = String(newOptions.sortDesc[0]);
      page.value = String(newOptions.page);
      rows.value = String(newOptions.itemsPerPage);

      performFetch();
    });

    return {
      sortOptions,
      loading,
    };
  },
});
</script>

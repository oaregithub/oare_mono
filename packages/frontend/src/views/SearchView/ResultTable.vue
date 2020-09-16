<template>
  <v-data-table
    :headers="headers"
    :items="loading ? [] : searchResults"
    :footer-props="{
      'items-per-page-options': [10, 25, 50, 100],
    }"
    :loading="loading"
    :server-items-length="totalSearchResults"
    :options.sync="searchOptions"
    :no-data-text="$t('search.noData')"
    :loading-text="$t('search.loadingText')"
  >
    <template #item.name="{ item }">
      <slot name="item.name" :item="item">
        {{ item.name }}
      </slot>
    </template>
    <template #item.translations="{ item }">
      <slot name="item.translations" :item="item">
        {{ item.translations }}
      </slot>
    </template>

    <template #item.matches="{ item }">
      <slot name="item.matches" :item="item">
        <div v-for="(match, index) in item.matches" :key="index">
          {{ match }}
        </div>
      </slot>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  computed,
  PropType,
} from '@vue/composition-api';
import { DataTableHeader } from 'vuetify';
import { SearchResultRow } from '@/types/search';
import router from '../../router';
import { updateUrl } from './utils';

export default defineComponent({
  props: {
    searchResults: {
      type: Array as PropType<SearchResultRow[]>,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    totalSearchResults: {
      type: Number,
      required: true,
    },
    page: {
      type: Number,
      default: 1,
    },
    rows: {
      type: Number,
      default: 10,
    },
    headers: {
      type: Array as PropType<DataTableHeader[]>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const searchOptions = ref({
      page: props.page,
      itemsPerPage: props.rows,
    });

    watch(
      () => props.page,
      () => (searchOptions.value.page = props.page)
    );
    watch(
      () => props.rows,
      () => (searchOptions.value.itemsPerPage = props.rows)
    );

    watch(
      () => searchOptions.value.page,
      () => {
        emit('update:page', searchOptions.value.page);
      },
      { lazy: true }
    );
    watch(
      () => searchOptions.value.itemsPerPage,
      () => {
        emit('update:rows', searchOptions.value.itemsPerPage);
      },
      { lazy: true }
    );

    return {
      searchOptions,
    };
  },
});
</script>

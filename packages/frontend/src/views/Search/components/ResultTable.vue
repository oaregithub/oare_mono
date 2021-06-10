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
    <template #[`item.name`]="{ item }">
      <slot name="item.name" :item="item">
        {{ item.name }}
      </slot>
    </template>
    <template #[`item.translations`]="{ item }">
      <slot name="item.translations" :item="item">
        {{ item.translations }}
      </slot>
    </template>

    <template #[`item.matches`]="{ item }">
      <slot name="item.matches" :item="item">
        <div
          v-for="(match, index) in item.matches"
          :key="index"
          v-html="match"
        ></div>
      </slot>
    </template>
    <template #[`footer.page-text`]="items">
      <div v-if="!items.itemsLength || !items.pageStart || !items.pageStop">
        –
      </div>
      <div v-else>
        {{ items.pageStart }} - {{ items.pageStop }} of
        {{ searchTotalLoading ? 'Loading...' : items.itemsLength }}
      </div>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from '@vue/composition-api';
import { DataTableHeader } from 'vuetify';
import { SearchTextsResultRow } from '@oare/types';

export default defineComponent({
  props: {
    searchResults: {
      type: Array as PropType<SearchTextsResultRow[]>,
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
    searchTotalLoading: {
      type: Boolean,
      default: false,
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
      { immediate: false }
    );
    watch(
      () => searchOptions.value.itemsPerPage,
      () => {
        emit('update:rows', searchOptions.value.itemsPerPage);
      },
      { immediate: false }
    );

    return {
      searchOptions,
    };
  },
});
</script>

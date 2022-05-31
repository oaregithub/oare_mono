<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="items"
      :server-items-length="total"
      :options.sync="searchOptions"
      :footer-props="{
        'items-per-page-options': [25, 50, 100, 500],
      }"
      :loading="loading"
    >
      <template v-slot:[`item.name`]="{ item }">
        <router-link
          :to="`/epigraphies/${item.uuid}/${item.discourseUuids}`"
          target="_blank"
          rel="noreferrer noopener"
          >{{ item.name }}</router-link
        >
      </template>

      <template v-slot:[`item.discourseUnits`]="{ item }"
        ><div>
          <table-discourse
            :discourseUnits="item.discourseUnits"
            :discourseUuids="item.discourseUuids"
          ></table-discourse>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { WordsInTextsSearchResultRow } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import TableDiscourse from './TableDiscourse.vue';

export default defineComponent({
  name: 'WordsInTextSearchTable',
  props: {
    items: {
      type: Array as PropType<WordsInTextsSearchResultRow[]>,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    page: {
      type: Number,
      default: 1,
    },
    rows: {
      type: Number,
      default: 25,
    },
    loading: {
      type: Boolean,
    },
  },
  components: { TableDiscourse },
  setup(props, { emit }) {
    const headers = ref<DataTableHeader[]>([]);

    headers.value = [
      {
        text: 'Text Name',
        value: 'name',
        width: '30%',
      },
      {
        text: 'Matching Discourse',
        value: 'discourseUnits',
        width: '70%',
      },
    ];

    const searchOptions = ref({
      page: props.page,
      itemsPerPage: props.rows,
    });

    watch(
      () => props.page,
      () => (searchOptions.value.page = props.page)
    );

    watch(
      () => searchOptions.value.page,
      () => {
        emit('update:page', searchOptions.value.page);
      }
    );

    watch(
      () => searchOptions.value.itemsPerPage,
      () => {
        emit('update:rows', searchOptions.value.itemsPerPage);
      }
    );
    return {
      headers,
      searchOptions,
    };
  },
});
</script>

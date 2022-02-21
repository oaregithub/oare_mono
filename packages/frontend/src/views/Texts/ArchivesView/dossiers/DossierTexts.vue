<template>
  <div>
    <div>
      <v-data-table
        :headers="textHeaders"
        :items="texts"
        :options.sync="searchOptions"
        :server-items-length="totalTexts"
        :footer-props="{
          'items-per-page-options': [5, 10, 25, 50, 100],
        }"
      >
        <template v-slot:[`item.name`]="{ item }">
          <router-link
            v-if="item.textUuid"
            :to="`/epigraphies/${item.textUuid}`"
            >{{ item.name }}
          </router-link>
          <span v-else>{{ item.name }}</span>
        </template>

        <template v-slot:[`item.excavation`]="{ item }">
          {{ item.excavationPrefix }} {{ item.excavationNumber }}
        </template>

        <template v-slot:[`item.museum`]="{ item }">
          {{ item.museumPrefix }} {{ item.museumNumber }}
        </template>

        <template v-slot:[`item.publication`]="{ item }">
          {{ item.publicationPrefix }} {{ item.publicationNumber }}
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { Text } from '@oare/types';
import { DataTableHeader } from 'vuetify';

export default defineComponent({
  name: 'DossierTexts',
  props: {
    texts: {
      type: Array as PropType<Text[]>,
      required: true,
    },
    totalTexts: {
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
  },
  setup(props, { emit }) {
    const textHeaders = ref<DataTableHeader[]>([]);
    textHeaders.value = [
      {
        text: 'Text Name',
        value: 'name',
        width: '30%',
      },
      {
        text: 'Excavation Info',
        value: 'excavation',
        width: '25%',
      },
      {
        text: 'Museum Info',
        value: 'museum',
        width: '20%',
      },
      {
        text: 'Primary Publication Info',
        value: 'publication',
        width: '25%',
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
      textHeaders,
      searchOptions,
    };
  },
});
</script>

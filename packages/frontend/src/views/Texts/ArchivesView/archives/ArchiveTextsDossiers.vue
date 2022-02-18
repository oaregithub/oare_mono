<template>
  <div>
    <div v-if="DossiersOrTexts === 'Dossiers'">
      <v-data-table
        :headers="dossierHeaders"
        :items="dossiersInfo"
        :server-items-length="totalDossiers"
        :search="search"
        :options.sync="searchOptions"
      >
        <template v-slot:[`item.name`]="{ item }">
          <router-link :to="`/dossier/${item.uuid}`">{{
            item.name
          }}</router-link>
        </template>

        <template v-slot:[`item.numTexts`]="{ item }">
          {{ item.totalTexts }}
        </template>
      </v-data-table>
    </div>
    <div v-else>
      <v-data-table
        :headers="textHeaders"
        :items="texts"
        :search="search"
        :server-items-length="totalTexts"
        :options.sync="searchOptions"
        :footer-props="{
          'items-per-page-options': [10, 25, 50, 100],
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
import { Text, DossierInfo } from '@oare/types';

export default defineComponent({
  name: 'ArchiveTextsDossiers',
  props: {
    texts: {
      type: Array as PropType<Text[]>,
      required: true,
    },
    dossiersInfo: {
      type: Array as PropType<DossierInfo[]>,
      required: true,
    },
    DossiersOrTexts: {
      type: String,
      required: true,
    },
    totalTexts: {
      type: Number,
      required: true,
    },
    totalDossiers: {
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
    search: {
      type: String,
      required: false,
    },
  },
  setup(props, { emit }) {
    const textHeaders = ref([
      {
        text: 'Text Name',
        value: 'name',
      },
      {
        text: 'Excavation Info',
        value: 'excavation',
      },
      {
        text: 'Museum Info',
        value: 'museum',
      },
      {
        text: 'Primary Publication Info',
        value: 'publication',
      },
    ]);
    const dossierHeaders = ref([
      {
        text: 'Dossier Name',
        value: 'name',
      },
      {
        text: 'Number of Texts',
        value: 'numTexts',
      },
    ]);

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
      dossierHeaders,
      searchOptions,
    };
  },
});
</script>

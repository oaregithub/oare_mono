<template>
  <v-data-table
    :headers="headers"
    :items="loading ? [] : texts"
    :loading="loading"
    :options.sync="searchOptions"
    :server-items-length="totalTexts"
    :footer-props="{
      'items-per-page-options': [10, 25, 50, 100],
    }"
  >
    <template v-slot:[`item.name`]="{ item }">
      <router-link v-if="item.hasEpigraphy" :to="`/epigraphies/${item.uuid}/page/${page}`">{{ 
      item.name
      }}</router-link>
      <span v-else>{{ item.name }}</span>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType } from '@vue/composition-api';
import { CollectionText } from '@oare/types';
import sl from '@/serviceLocator';
export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    texts: {
      type: Array as PropType<CollectionText[]>,
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
    path: {
      type: String,
      default: ''
    },
    collectionUuid: {
      type: String,
    }
  },
  setup(props, { emit }) {
    const router = sl.get('router');
    const headers = ref([
      {
        text: 'Text Name',
        value: 'name',
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
      () => props.page,
      () => (props.path = `/collections/name/${props.collectionUuid}/page/${props.page}`)
    );

    watch(
      () => props.path,
      () => {
        emit('update:path', router.push(`${props.path}`))
      }
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

<style></style>

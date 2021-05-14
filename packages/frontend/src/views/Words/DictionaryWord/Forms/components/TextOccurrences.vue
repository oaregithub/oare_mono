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
      :server-items-length="textOccurrencesLength"
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
  computed,
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
    getTextsCount: {
      type: Function as PropType<
        (uuid: string, filter: Partial<Pagination>) => number
      >,
      required: true,
    },
    totalTextOccurrences: {
      type: Number,
      required: true,
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const search = ref('');
    const textOccurrencesLength = ref(0);
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

    // TODO: Something isn't updating correctly here, sometimes it works, most of the time it doesn't. Weird.
    const getReferences = async () => {
      try {
        referencesLoading.value = true;
        textOccurrences.value = await props.getTexts(props.uuid, {
          page: tableOptions.value.page,
          limit: tableOptions.value.itemsPerPage,
          ...(search.value ? { filter: search.value } : null),
        });
      } catch {
        actions.showErrorSnackbar('Failed to load text occurrences');
      } finally {
        referencesLoading.value = false;
      }
    };

    const clearValues = () => {
      search.value = '';
      tableOptions.value.page = 1;
      tableOptions.value.itemsPerPage = 10;
      textOccurrences.value = [];
      textOccurrencesLength.value = 0;
      emit('input');
    };

    watch(
      () => props.uuid,
      async () => {
        await getReferences();
      }
    );

    watch(tableOptions, getReferences);

    watch(
      search,
      _.debounce(async () => {
        textOccurrencesLength.value = await props.getTextsCount(props.uuid, {
          filter: search.value,
        });
        tableOptions.value.page = 1;
        await getReferences();
      }, 500)
    );

    watch(
      () => props.totalTextOccurrences,
      () => {
        textOccurrencesLength.value = props.totalTextOccurrences;
      }
    );

    return {
      search,
      textOccurrences,
      textOccurrencesLength,
      headers,
      referencesLoading,
      tableOptions,
      clearValues,
    };
  },
});
</script>

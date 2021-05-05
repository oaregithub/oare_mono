<template>
  <OareDialog
    v-model="displayDialog"
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
    initializePage: {
      type: Number,
      default: 1,
    },
  },
  setup(props) {
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const search = ref('');
    const textOccurrences = ref<SpellingOccurrenceResponseRow[]>([]);
    const displayDialog = ref(true);
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
      page: props.initializePage,
      itemsPerPage: 10,
    });

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

    watch(tableOptions, getReferences);

    watch(search, _.debounce(getReferences, 500));

    return {
      search,
      textOccurrences,
      headers,
      displayDialog,
      referencesLoading,
      tableOptions,
    };
  },
});
</script>

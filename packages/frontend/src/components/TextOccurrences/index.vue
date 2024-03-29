<template>
  <OareDialog
    :value="value"
    :title="`Texts for ${title}`"
    submitText="Disconnect"
    @submit="disconnect"
    :showSubmit="canDisconnect"
    :submitDisabled="disconnectSelections.length < 1"
    cancelText="Close"
    :persistent="false"
    @input="$emit('input', false)"
    :width="1000"
  >
    <v-row>
      <v-col cols="12" sm="6" class="py-0">
        <v-text-field v-model="search" clearable label="Filter" autofocus />
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="textOccurrences"
      item-key="discourseUuid"
      :search="search"
      :loading="referencesLoading"
      :server-items-length="textOccurrencesLength"
      :options.sync="tableOptions"
      :footer-props="{
        'items-per-page-options': [10, 25, 50, 100],
      }"
    >
      <template #[`item.text`]="{ item }">
        <router-link
          :to="`/epigraphies/${item.textUuid}/${encodeURIComponent(
            item.discourseUuidsToHighlight
          )}`"
          class="test-text"
          target="_blank"
          >{{ item.textName }}</router-link
        >
      </template>
      <template #[`item.context`]="{ item }">
        <div v-if="item.readings">
          <div
            v-for="(reading, index) in item.readings"
            class="test-reading"
            :key="index"
            v-html="reading"
          />
        </div>
        <span v-else>Preview Unavailable</span>
      </template>
      <template #[`item.disconnect`]="{ item }">
        <div class="d-flex justify-center">
          <v-checkbox
            :value="item.discourseUuid"
            v-model="disconnectSelections"
            class="test-disconnect"
          />
        </div>
      </template>
    </v-data-table>
  </OareDialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  Ref,
  ref,
  watch,
  computed,
} from '@vue/composition-api';
import {
  Pagination,
  TextOccurrencesResponseRow,
  TextOccurrencesCountResponseItem,
} from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
    uuids: {
      type: Array as PropType<string[]>,
      required: true,
    },
    getTexts: {
      type: Function as PropType<
        (
          uuid: string[],
          request: Pagination,
          filterUuid?: string
        ) => Promise<TextOccurrencesResponseRow[]>
      >,
      required: true,
    },
    getTextsCount: {
      type: Function as PropType<
        (
          uuid: string[],
          filter: Partial<Pagination>,
          filterUuid?: string
        ) => Promise<TextOccurrencesCountResponseItem[]>
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
    showDisconnect: {
      type: Boolean,
      default: true,
    },
    filterUuid: {
      type: String,
      required: false,
    },
  },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const store = sl.get('store');

    const search = ref('');
    const textOccurrencesLength = ref(props.totalTextOccurrences);
    const textOccurrences = ref<TextOccurrencesResponseRow[]>([]);

    const canDisconnect = computed(() =>
      store.hasPermission('DISCONNECT_OCCURRENCES')
    );

    const headers: Ref<DataTableHeader[]> =
      canDisconnect.value && props.showDisconnect
        ? ref([
            {
              text: 'Text Name',
              value: 'text',
            },
            {
              text: 'Context',
              value: 'context',
            },
            {
              text: 'Disconnect',
              value: 'disconnect',
              align: 'center',
              sortable: false,
            },
          ])
        : ref([
            {
              text: 'Text Name',
              value: 'text',
            },
            {
              text: 'Context',
              value: 'context',
            },
          ]);
    const disconnectSelections = ref<string[]>([]);

    const disconnect = () => {
      emit('disconnect', disconnectSelections.value);
      emit('reload');
      disconnectSelections.value = [];
    };

    const referencesLoading = ref(false);
    const tableOptions = ref({
      page: 1,
      itemsPerPage: 10,
    });

    const getReferences = async () => {
      try {
        textOccurrences.value = [];
        referencesLoading.value = true;
        textOccurrences.value = await props.getTexts(
          props.uuids,
          {
            page: tableOptions.value.page,
            limit: tableOptions.value.itemsPerPage,
            ...(search.value ? { filter: search.value } : null),
          },
          props.filterUuid
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to load text occurrences',
          err as Error
        );
      } finally {
        referencesLoading.value = false;
      }
    };

    watch(
      [() => props.value, () => props.filterUuid, () => props.uuids],
      async () => {
        if (props.value) {
          tableOptions.value.page = 1;
          await getReferences();
        }
      }
    );

    watch(tableOptions, async () => await getReferences());

    watch(
      search,
      _.debounce(async () => {
        textOccurrencesLength.value = (
          await props.getTextsCount(
            props.uuids,
            {
              filter: search.value,
            },
            props.filterUuid
          )
        ).reduce((sum, current) => sum + current.count, 0);
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
      disconnectSelections,
      disconnect,
      canDisconnect,
    };
  },
});
</script>

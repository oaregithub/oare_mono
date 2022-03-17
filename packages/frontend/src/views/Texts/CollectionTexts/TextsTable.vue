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
      <v-icon
        v-if="editText !== item.uuid && item.name != null && hasEditPermission"
        @click="toggleTextInfo(item.uuid, item)"
        class="test-pencil mr-4"
        >mdi-pencil</v-icon
      >
      <router-link v-if="item.hasEpigraphy" :to="`/epigraphies/${item.uuid}`">
        {{ item.name }}
      </router-link>
      <span v-else>{{ item.name }}</span>
      <v-row v-if="editText === item.uuid" class="ma-1">
        <v-icon @click="updateTextInfo(item)" class="edit-text-save-btn mr-2"
          >mdi-check</v-icon
        >
        <v-icon @click="cancelEditTextInfo(item)">mdi-close</v-icon>
      </v-row>
    </template>

    <template v-slot:[`item.excavation`]="{ item }">
      <v-row v-if="editText !== item.uuid">
        <v-col cols="8" sm="6">
          <span> {{ item.excavationPrefix }} {{ item.excavationNumber }} </span>
        </v-col>
      </v-row>
      <v-row v-if="editText === item.uuid" class="mt-3">
        <v-col cols="8" sm="6">
          <v-text-field
            outlined
            v-model="item.excavationPrefix"
            label="Prefix"
            class="excavationPrefix"
            clearable
            dense
          ></v-text-field>
        </v-col>
        <v-col cols="8" sm="6">
          <v-text-field
            outlined
            v-model="item.excavationNumber"
            label="Number"
            class="excavationNumber"
            clearable
            dense
          ></v-text-field>
        </v-col>
      </v-row>
    </template>

    <template v-slot:[`item.museum`]="{ item }">
      <v-row v-if="editText !== item.uuid">
        <v-col cols="8" sm="6">
          <span> {{ item.museumPrefix }} {{ item.museumNumber }} </span>
        </v-col>
      </v-row>
      <v-row v-if="editText === item.uuid" class="mt-3">
        <v-col cols="8" sm="6">
          <v-text-field
            outlined
            v-model="item.museumPrefix"
            label="Prefix"
            class="museumPrefix"
            clearable
            dense
          ></v-text-field>
        </v-col>
        <v-col cols="8" sm="6">
          <v-text-field
            outlined
            v-model="item.museumNumber"
            label="Number"
            class="museumNumber"
            clearable
            dense
          ></v-text-field>
        </v-col>
      </v-row>
    </template>

    <template v-slot:[`item.publication`]="{ item }">
      <v-row v-if="editText !== item.uuid">
        <v-col cols="8" sm="6">
          <span>
            {{ item.publicationPrefix }} {{ item.publicationNumber }}
          </span>
        </v-col>
      </v-row>
      <v-row v-if="editText === item.uuid" class="mt-3">
        <v-col cols="4" sm="6">
          <v-text-field
            outlined
            v-model="item.publicationPrefix"
            label="Prefix"
            class="publicationPrefix"
            clearable
            dense
          ></v-text-field>
        </v-col>
        <v-col cols="4" sm="6">
          <v-text-field
            outlined
            v-model="item.publicationNumber"
            label="Number"
            class="publicationNumber"
            clearable
            dense
          ></v-text-field>
        </v-col>
      </v-row>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  PropType,
  computed,
} from '@vue/composition-api';
import { CollectionText } from '@oare/types';
import sl from '@/serviceLocator';

export interface OriginalTextInfo {
  excavationPrefix: string | null;
  excavationNumber: string | null;
  museumPrefix: string | null;
  museumNumber: string | null;
  primaryPublicationPrefix: string | null;
  primaryPublicationNumber: string | null;
}

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
  },

  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const hasEditPermission = computed(() =>
      store.getters.permissions
        .map(perm => perm.name)
        .includes('EDIT_TEXT_INFO')
    );

    const originalTextInfoObject = ref<OriginalTextInfo>({
      excavationPrefix: null,
      excavationNumber: null,
      museumPrefix: null,
      museumNumber: null,
      primaryPublicationPrefix: null,
      primaryPublicationNumber: null,
    });

    const headers = ref([
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

    const searchOptions = ref({
      page: props.page,
      itemsPerPage: props.rows,
    });

    const editText = ref<string>();

    const toggleTextInfo = function (uuid: string, item: any) {
      originalTextInfoObject.value.excavationPrefix = item.excavationPrefix;
      originalTextInfoObject.value.excavationNumber = item.excavationNumber;
      originalTextInfoObject.value.museumPrefix = item.museumPrefix;
      originalTextInfoObject.value.museumNumber = item.museumNumber;
      originalTextInfoObject.value.primaryPublicationPrefix =
        item.publicationPrefix;
      originalTextInfoObject.value.primaryPublicationNumber =
        item.publicationNumber;

      editText.value = uuid;
    };

    const cancelEditTextInfo = function (item: any) {
      item.excavationPrefix = originalTextInfoObject.value.excavationPrefix;
      item.excavationNumber = originalTextInfoObject.value.excavationNumber;
      item.museumPrefix = originalTextInfoObject.value.museumPrefix;
      item.museumNumber = originalTextInfoObject.value.museumNumber;
      item.publicationPrefix =
        originalTextInfoObject.value.primaryPublicationPrefix;
      item.publicationNumber =
        originalTextInfoObject.value.primaryPublicationNumber;

      editText.value = undefined;
    };

    const updateTextInfo = async (item: any) => {
      try {
        await server.updateTextInfo(
          item.uuid,
          item.excavationPrefix,
          item.excavationNumber,
          item.museumPrefix,
          item.museumNumber,
          item.publicationPrefix,
          item.publicationNumber
        );
        editText.value = undefined;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing text info. Please try again.',
          err as Error
        );
      }
    };

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
      editText,
      toggleTextInfo,
      cancelEditTextInfo,
      updateTextInfo,
      hasEditPermission,
    };
  },
});
</script>

<style></style>

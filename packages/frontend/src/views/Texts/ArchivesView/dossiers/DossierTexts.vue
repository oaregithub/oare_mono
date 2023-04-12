<template>
  <div>
    <div>
      <v-data-table
        :headers="isAdmin ? textHeaders : textHeaders.slice(0, -1)"
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

        <template v-if="isAdmin" v-slot:[`item.actions`]="{ item }">
          <v-btn
            class="primary disconnect-btn"
            @click="selectItemForRemoval(item)"
            >disconnect text</v-btn
          >
        </template>
      </v-data-table>
    </div>
    <oare-dialog
      v-model="isRemoving"
      title="Disconnect text"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="disconnectText"
      >Disconnect text {{ itemToDisconnect.name }} from dossier?</oare-dialog
    >
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  watch,
} from '@vue/composition-api';
import { Text } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

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
    dossierUuid: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const itemToDisconnect = ref<Text>({
      uuid: '',
      type: '',
      name: '',
      excavationPrefix: '',
      excavationNumber: '',
      museumPrefix: '',
      museumNumber: '',
      publicationPrefix: '',
      publicationNumber: '',
    });
    const isRemoving = ref(false);

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
      { text: 'Actions', value: 'actions', sortable: false, width: '10%' },
    ];

    const searchOptions = ref({
      page: props.page,
      itemsPerPage: props.rows,
    });

    const isAdmin = computed(() => store.getters.isAdmin);

    const selectItemForRemoval = (item: Text) => {
      itemToDisconnect.value = item;
      isRemoving.value = true;
    };

    const disconnectText = async () => {
      try {
        await server.disconnectText({
          referenceUuid: itemToDisconnect.value.uuid,
          objUuid: props.dossierUuid,
        });
        actions.showSnackbar(
          `Successfully disconnected ${itemToDisconnect.value.name} from dossier.`
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing text. Please try again.',
          err as Error
        );
      } finally {
        isRemoving.value = false;
        itemToDisconnect.value = {
          uuid: '',
          type: '',
          name: '',
          excavationPrefix: '',
          excavationNumber: '',
          museumPrefix: '',
          museumNumber: '',
          publicationPrefix: '',
          publicationNumber: '',
        };
        emit('refresh-page');
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
      textHeaders,
      searchOptions,
      selectItemForRemoval,
      disconnectText,
      isRemoving,
      itemToDisconnect,
      isAdmin,
    };
  },
});
</script>

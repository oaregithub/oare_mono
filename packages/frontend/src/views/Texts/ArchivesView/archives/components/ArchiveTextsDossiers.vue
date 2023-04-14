<template>
  <div>
    <div v-if="DossiersOrTexts === 'Dossiers'">
      <v-data-table
        :headers="dossierHeaders"
        :items="dossiersInfo"
        :server-items-length="totalDossiers"
        :options.sync="searchOptions"
        :footer-props="{
          'items-per-page-options': [10, 15, 25, 50],
        }"
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
        :headers="isAdmin ? textHeaders : textHeaders.slice(0, -1)"
        :items="texts"
        :server-items-length="totalTexts"
        :options.sync="searchOptions"
        :footer-props="{
          'items-per-page-options': [10, 25, 50, 100],
        }"
      >
        <template v-slot:[`item.name`]="{ item }">
          <router-link v-if="item.uuid" :to="`/epigraphies/${item.uuid}`"
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

        <template v-if="isAdmin" v-slot:[`item.removeText`]="{ item }">
          <v-btn class="disconnect-btn" @click="selectItemForRemoval(item)" icon
            ><v-icon>mdi-note-remove-outline</v-icon></v-btn
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
      >Disconnect text {{ itemToDisconnect.name }} from archive?</oare-dialog
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
import { Text, DossierInfo } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

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
    archiveUuid: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const dossierHeaders = ref<DataTableHeader[]>([]);
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

    const textHeaders = computed(() => {
      const headers: DataTableHeader[] = [
        {
          text: 'Text Name',
          value: 'name',
          width: '30%',
        },
        {
          text: 'Excavation Info',
          value: 'excavation',
          width: '20%',
        },
        {
          text: 'Museum Info',
          value: 'museum',
          width: '20%',
        },
        {
          text: 'Primary Publication Info',
          value: 'publication',
          width: '20%',
        },
      ];
      if (isAdmin.value) {
        headers.push({
          text: 'Remove Text',
          value: 'removeText',
          sortable: false,
          width: '10%',
        });
      }
      return headers;
    });

    dossierHeaders.value = [
      {
        text: 'Dossier Name',
        value: 'name',
        width: '70%',
      },
      {
        text: 'Number of Texts',
        value: 'numTexts',
        width: '30%',
      },
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
          textUuid: itemToDisconnect.value.uuid,
          archiveOrDossierUuid: props.archiveUuid,
        });
        actions.showSnackbar(
          `Successfully disconnected ${itemToDisconnect.value.name} from archive.`
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
      dossierHeaders,
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

<template>
  <div>
    <oare-content-view :title="archiveName" :loading="loading">
      <v-row class="ma-0">
        <router-link to="/archives">Back to Archive List</router-link>
      </v-row>
      <v-row class="ma-0">
        <v-radio-group v-model="DossiersOrTexts" row>
          <v-radio label="Dossiers" value="Dossiers"></v-radio>
          <v-radio label="Texts" value="Texts"></v-radio>
        </v-radio-group>
      </v-row>
      <v-row class="ma-0">
        <v-col cols="4">
          <v-text-field
            v-model="search"
            label="Search"
            single-line
            hide-details
            clearable
            class="test-search"
            autofocus
          />
        </v-col>
      </v-row>
      <archive-texts-dossiers
        :texts="texts"
        :dossiersInfo="dossiersInfo"
        :DossiersOrTexts="DossiersOrTexts"
        :totalTexts="totalTexts"
        :totalDossiers="totalDossiers"
        :page="Number(page)"
        @update:page="page = `${$event}`"
        :rows="Number(rows)"
        @update:rows="rows = `${$event}`"
      ></archive-texts-dossiers>
    </oare-content-view>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { Text, DossierInfo } from '@oare/types';
import ArchiveTextsDossiers from './ArchiveTextsDossiers.vue';
import useQueryParam from '@/hooks/useQueryParam';
import _ from 'underscore';

export default defineComponent({
  name: 'ArchiveView',
  components: {
    ArchiveTextsDossiers,
  },
  props: {
    archiveUuid: {
      type: String,
      required: true,
    },
  },

  setup({ archiveUuid }) {
    const loading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const DossiersOrTexts = ref('Dossiers');
    const archive = ref();
    const archiveName = ref('');
    const texts: Ref<Text[] | null> = ref([]);
    const dossiersInfo: Ref<DossierInfo[] | null> = ref([]);
    const totalTexts = ref(0);
    const totalDossiers = ref(0);
    const page = useQueryParam('page', '1', false);
    const rows = useQueryParam('rows', '10', true);
    const search = useQueryParam('query', '', true);

    const getArchive = async () => {
      if (loading.value) {
        return;
      }
      loading.value = true;
      try {
        archive.value = await server.getArchive(archiveUuid, {
          page: Number(page.value),
          limit: Number(rows.value),
          filter: search.value,
        });
        archiveName.value = archive.value.name;
        texts.value = archive.value.texts;
        dossiersInfo.value = archive.value.dossiersInfo;
        totalTexts.value = archive.value.totalTexts;
        totalDossiers.value = archive.value.totalDossiers;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading archive dossiers and texts. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    watch(
      [page, rows],
      () => {
        getArchive();
      },
      { immediate: true }
    );

    watch(
      search,
      _.debounce(function () {
        page.value = '1';
        getArchive();
      }, 1000),
      {
        immediate: false,
      }
    );

    watch(DossiersOrTexts, () => {
      page.value = '1';
    });

    return {
      loading,
      texts,
      rows,
      page,
      dossiersInfo,
      archiveName,
      DossiersOrTexts,
      search,
      totalTexts,
      totalDossiers,
    };
  },
});
</script>

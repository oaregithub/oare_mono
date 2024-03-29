<template>
  <div>
    <oare-content-view :title="dossierName" :loading="loading">
      <v-container>
        <v-row
          ><v-col
            ><router-link :to="`/archives/${archiveUuid}`"
              >Back to Parent Archive</router-link
            >
          </v-col>
        </v-row>
        <v-row>
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
      </v-container>
      <dossier-texts
        :texts="texts"
        :page="Number(page)"
        @update:page="page = `${$event}`"
        :rows="Number(rows)"
        @update:rows="rows = `${$event}`"
        :totalTexts="totalTexts"
        :dossierUuid="dossierUuid"
        @refresh-page="getDossier"
      ></dossier-texts>
    </oare-content-view>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import sl from '@/serviceLocator';
import DossierTexts from './DossierTexts.vue';
import useQueryParam from '@/hooks/useQueryParam';
import _ from 'underscore';

export default defineComponent({
  name: 'DossierView',
  components: {
    DossierTexts,
  },
  props: {
    dossierUuid: {
      type: String,
      required: true,
    },
  },

  setup({ dossierUuid }) {
    const loading = ref(false);
    const dossier = ref();
    const dossierName = ref('');
    const archiveUuid = ref('');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const totalTexts = ref(0);
    const texts = ref<Text[]>([]);
    const page = useQueryParam('page', '1', false);
    const rows = useQueryParam('rows', '10', true);
    const search = useQueryParam('query', '', true);

    const getDossier = async () => {
      loading.value = true;
      try {
        dossier.value = await server.getDossier(dossierUuid, {
          page: Number(page.value),
          limit: Number(rows.value),
          filter: search.value,
        });
        texts.value = dossier.value.texts;
        dossierName.value = dossier.value.name;
        totalTexts.value = dossier.value.totalTexts;
        archiveUuid.value = dossier.value.parentUuid;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading archive contents. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    watch(
      [page, rows],
      () => {
        getDossier();
      },
      { immediate: true }
    );

    watch(
      search,
      _.debounce(function () {
        page.value = '1';
        getDossier();
      }, 1000),
      {
        immediate: false,
      }
    );

    return {
      loading,
      dossierName,
      archiveUuid,
      texts,
      page,
      totalTexts,
      rows,
      search,
      getDossier,
    };
  },
});
</script>

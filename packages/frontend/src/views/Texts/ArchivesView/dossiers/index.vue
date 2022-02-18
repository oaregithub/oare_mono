<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate />
    <oare-content-view :title="dossier.name">
      <v-container>
        <v-row>
          <v-col cols="4">
            <v-text-field
              v-model="search"
              label="Search"
              single-line
              hide-details
              clearable
              class="test-search"
            />
          </v-col>
        </v-row>
      </v-container>
      <dossier-texts
        :texts="dossier.texts"
        :page="Number(page)"
        @update:page="page = `${$event}`"
        :rows="Number(rows)"
        @update:rows="rows = `${$event}`"
        :search="search"
        :totalTexts="totalTexts"
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
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const totalTexts = ref(0);
    const page = useQueryParam('page', '1');
    const rows = useQueryParam('rows', '10');
    const search = useQueryParam('query', '');

    const getDossier = async () => {
      loading.value = true;
      try {
        dossier.value = await server.getDossier(dossierUuid, {
          page: Number(page.value),
          limit: Number(rows.value),
          filter: search.value,
        });
        totalTexts.value = dossier.value.totalTexts;
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
      }, 500),
      {
        immediate: false,
      }
    );

    return {
      loading,
      dossier,
      page,
      totalTexts,
      rows,
      search,
    };
  },
});
</script>

<template>
  <v-row class="mt-4">
    <v-col cols="12">
      <router-link v-if="showRouterLink" :to="`/archives/${archive.uuid}`"
        ><div>
          {{ archive.name }} ({{ archive.totalTexts }} texts |
          {{ archive.totalDossiers }} dossiers)
        </div>
      </router-link>
      <div :class="{ 'ml-5': !allowCUD }">
        <description
          :allowCUD="allowCUD"
          :descriptions="archive.descriptions"
          :referenceUuid="archive.uuid"
          @refresh-page="refreshPage"
        />
      </div>
      <div
        :class="{ 'ml-5': !allowCUD }"
        v-if="archive.bibliographyUuid && canViewBibliography"
      >
        <span v-show="!loading" v-html="bibliography"></span>
        <v-progress-circular v-show="loading" indeterminate />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import Description from '@/components/Description/index.vue';
import { ArchiveInfo, BibliographyResponse } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'ArchiveInfo',
  components: {
    Description,
  },
  props: {
    archive: {
      type: Object as PropType<ArchiveInfo>,
      required: true,
    },
    showRouterLink: {
      type: Boolean,
      default: true,
    },
    allowCUD: {
      type: Boolean,
      default: false,
    },
  },
  setup({ archive }, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const loading = ref(false);
    const bibliography = ref('');

    const canViewBibliography = computed(() =>
      store.hasPermission('BIBLIOGRAPHY')
    );

    const refreshPage = () => {
      emit('refresh-page');
    };

    onMounted(async () => {
      if (archive.bibliographyUuid && canViewBibliography.value) {
        loading.value = true;
        try {
          const bibliographyResponse: BibliographyResponse = await server.getBibliography(
            archive.bibliographyUuid
          );
          bibliography.value = bibliographyResponse.bibliography.bib!!;
        } catch (err) {
          actions.showErrorSnackbar(
            'Unable to get bibliography information',
            err as Error
          );
        } finally {
          loading.value = false;
        }
      }
    });
    return {
      canViewBibliography,
      loading,
      bibliography,
      refreshPage,
    };
  },
});
</script>

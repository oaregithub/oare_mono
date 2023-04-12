<template>
  <OareContentView title="Archives" :loading="loading">
    <archives-list :archives="archives"></archives-list>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import { ArchiveInfo } from '@oare/types';
import sl from '@/serviceLocator';
import ArchivesList from './archives/components/ArchivesList.vue';

export default defineComponent({
  name: 'ArchivesView',
  components: {
    ArchivesList,
  },

  setup() {
    const loading = ref(false);
    const archives: Ref<ArchiveInfo[]> = ref([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    onMounted(async () => {
      loading.value = true;
      try {
        archives.value = await server.getAllArchives();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading collections. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      archives,
    };
  },
});
</script>

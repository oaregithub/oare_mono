<template>
  <OareContentView title="Admin Settings" :loading="loading">
    <v-divider class="mt-2 primary" />
    <h3 class="mt-4">Cache Status</h3>
    <v-list>
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Disable Cache</v-list-item-title>
          <v-list-item-subtitle>
            Temporarily disables cache for development purposes. If not manually
            re-enabled, cache will automatically be re-enabled after 10 minutes.
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-switch
            :input-value="cacheStatus"
            @change="updateCacheStatus($event)"
            class="cache-status-switch"
          >
          </v-switch>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);

    const cacheStatus = ref(false);

    onMounted(async () => {
      try {
        loading.value = true;
        cacheStatus.value = await server.getCacheStatus();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading admin settings. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const updateCacheStatus = async (enable: boolean) => {
      try {
        if (enable) {
          await server.enableCache();
        } else {
          await server.disableCache();
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error updating cache status. Please try again',
          err as Error
        );
      }
    };

    return {
      loading,
      cacheStatus,
      updateCacheStatus,
    };
  },
});
</script>

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
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Environment Info</v-list-item-title>
          <v-list-item-subtitle>
            Elastic Beanstalk Region:
            {{
              environmentInfo && environmentInfo.elasticBeanstalkRegion
                ? environmentInfo.elasticBeanstalkRegion
                : 'Development'
            }}
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Database Read Region:
            {{
              environmentInfo && environmentInfo.databaseReadRegion
                ? environmentInfo.databaseReadRegion
                : 'Coming Soon'
            }}</v-list-item-subtitle
          >
          <v-list-item-subtitle>
            Database Write Region:
            {{
              environmentInfo && environmentInfo.databaseWriteRegion
                ? environmentInfo.databaseWriteRegion
                : 'Coming Soon'
            }}</v-list-item-subtitle
          >
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { EnvironmentInfo } from '@oare/types';

export default defineComponent({
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);

    const cacheStatus = ref(false);
    const environmentInfo = ref<EnvironmentInfo>();

    onMounted(async () => {
      try {
        loading.value = true;
        cacheStatus.value = await server.getCacheStatus();
        environmentInfo.value = await server.getEnvironmentInfo();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading admin setting information. Please try again.',
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
      environmentInfo,
    };
  },
});
</script>

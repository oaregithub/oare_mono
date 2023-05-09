<template>
  <OareContentView title="Admin Settings" :loading="loading">
    <v-divider class="mt-2 primary" />
    <h3 class="mt-4">Backend Cache</h3>
    <v-list>
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Apply Cache</v-list-item-title>
          <v-list-item-subtitle>
            Temporarily toggles the backend cache for development purposes. If
            not manually re-enabled, the cache will automatically be re-enabled
            after 10 minutes.
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            The toggle switch's position corresponds to the cache's current
            status.
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
      <v-divider />
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Flush All Cache Entries</v-list-item-title>
          <v-list-item-subtitle>
            Flushes all current entries from the Redis cache instance.
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <oare-dialog
            v-model="flushCacheDialog"
            title="Flush Cache?"
            submitText="Yes"
            cancelText="Cancel"
            @submit="flushCache"
          >
            <template v-slot:activator="{ on }">
              <v-btn color="primary" v-on="on">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
            Are you sure you want to flush all cache entries? This cannot be
            undone.
          </oare-dialog>
        </v-list-item-action>
      </v-list-item>
      <v-divider />
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Clear Individual Cache Entries</v-list-item-title>
          <v-list-item-subtitle>
            Clear cache entries for a selected backend route. Will open a dialog
            where individual route(s) can be selected for clearing.
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <individual-cache-clear-dialog
            v-model="individualClearDialog"
            :key="individualClearDialogKey"
          />
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-divider class="mt-2 primary" />
    <h3 class="mt-4">Localization</h3>
    <v-list>
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Clear Default Localization</v-list-item-title>
          <v-list-item-subtitle>
            <b>Current Locale Preference:</b>
            {{ currentLocale }}
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Removes stored localization preferences from the browser's local
            storage. This will be stored again when a language preference is
            again selected.
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn color="primary" @click="clearLocalization">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-divider class="mt-2 primary" />
    <h3 class="mt-4">Environment</h3>
    <v-list>
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Environment Info</v-list-item-title>
          <v-list-item-subtitle v-if="environmentInfo">
            <b>Elastic Beanstalk Region:</b>
            {{ environmentInfo.elasticBeanstalkRegion }}
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="environmentInfo">
            <b>Database Read Region:</b>
            {{ environmentInfo.databaseReadRegion }}</v-list-item-subtitle
          >
          <v-list-item-subtitle v-if="environmentInfo">
            <b>Database Write Region:</b>
            {{ environmentInfo.databaseWriteRegion }}</v-list-item-subtitle
          >
          <v-list-item-subtitle v-if="environmentInfo">
            <b>Database Connection Type:</b>
            {{
              environmentInfo.databaseReadOnly ? 'Read-Only' : 'Read/Write'
            }}</v-list-item-subtitle
          >
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { EnvironmentInfo } from '@oare/types';
import IndividualCacheClearDialog from './components/IndividualCacheClearDialog.vue';

export default defineComponent({
  components: {
    IndividualCacheClearDialog,
  },
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
        getLocale();
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
          actions.showSnackbar('Cache successfully enabled.');
        } else {
          await server.disableCache();
          actions.showSnackbar('Cache successfully disabled.');
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error updating cache status. Please try again',
          err as Error
        );
      }
    };

    const flushCacheDialog = ref(false);
    const flushCache = async () => {
      try {
        await server.flushCache();
        actions.showSnackbar('Cache flushed successfully');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error flushing cache. Please try again.',
          err as Error
        );
      } finally {
        flushCacheDialog.value = false;
      }
    };

    const individualClearDialog = ref(false);
    const individualClearDialogKey = ref(false);

    watch(individualClearDialog, () => {
      if (individualClearDialog.value) {
        individualClearDialogKey.value = !individualClearDialogKey.value;
      }
    });

    const currentLocale = ref('');
    const getLocale = () => {
      const storedLocale = localStorage.getItem('locale');
      if (storedLocale) {
        if (storedLocale === 'en') {
          currentLocale.value = 'English';
        } else if (storedLocale === 'tr') {
          currentLocale.value = 'Türkçe';
        } else {
          currentLocale.value = 'Unknown Preference Set. Please clear.';
        }
      } else if (navigator.language.includes('tr')) {
        currentLocale.value =
          'Not Set - Defaulting to Türkçe based on browser language settings';
      } else {
        currentLocale.value = 'Not Set - Defaulting to English';
      }
    };
    const clearLocalization = () => {
      localStorage.removeItem('locale');
      getLocale();
      actions.showSnackbar('Localization cleared successfully.');
    };

    return {
      loading,
      cacheStatus,
      updateCacheStatus,
      environmentInfo,
      flushCache,
      flushCacheDialog,
      individualClearDialog,
      individualClearDialogKey,
      clearLocalization,
      getLocale,
      currentLocale,
    };
  },
});
</script>

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
          <v-list-item-title>Repopulate All Cache Entries</v-list-item-title>
          <v-list-item-subtitle>
            Repopulates the Redis cache instance with data for all cached
            routes.
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            <b>NOTE:</b> This will flush all existing cache entries and send a
            request to repopulate each route's data, resulting in many data
            requests. This may take several minutes to complete.
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <oare-dialog
            v-model="repopulateCacheDialog"
            title="Repopulate All Cache Entries?"
            submitText="Yes"
            cancelText="Cancel"
            @submit="populateCache(true)"
            :submitLoading="populateFlushLoading"
          >
            <template v-slot:activator="{ on }">
              <v-btn color="primary" v-on="on">
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </template>
            Are you sure you want to repopulate all cache entries? This will
            flush all exising cache entries and send a request to repopulate
            each route's data. This will result in thousand of requests which
            may result in increased costs and load on the server. This should
            not be done regularly.
          </oare-dialog>
        </v-list-item-action>
      </v-list-item>
      <v-divider />
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Fill In Missing Cache Entries</v-list-item-title>
          <v-list-item-subtitle>
            Fills in missing cache entries in the Redis cache instance.
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            <b>NOTE:</b> This will send a request to all cached routes to fill
            in missing entries. However, unlike the option above, it will not
            flush existing entries. This may take several minutes to complete.
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <oare-dialog
            v-model="fillMissingCacheDialog"
            title="Fill In Missing Cache Entries?"
            submitText="Yes"
            cancelText="Cancel"
            @submit="populateCache(false)"
            :submitLoading="populateLoading"
          >
            <template v-slot:activator="{ on }">
              <v-btn color="primary" v-on="on">
                <v-icon>mdi-database-sync</v-icon>
              </v-btn>
            </template>
            Are you sure you want to fill in all missing cache entries? This
            will send a request to each cached route, triggering a cache event
            for those that do not have an existing entry. This will result in
            thousand of requests which may result in increased costs and load on
            the server. This should not be done regularly.
          </oare-dialog>
        </v-list-item-action>
      </v-list-item>
      <v-divider />
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Clear Individual Cache Entries</v-list-item-title>
          <v-list-item-subtitle>
            Clear cache entries for a selected backend route. Will open a dialog
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <oare-dialog
            v-model="individualClearDialog"
            title="Clear Individual Cache Entry"
            @submit="clearRoute"
            :submitLoading="individualClearLoading"
            :submitDisabled="!routeToClear || numMatchingKeys === 0"
          >
            <template v-slot:activator="{ on }">
              <v-btn color="primary" v-on="on">
                <v-icon>mdi-text-search-variant</v-icon>
              </v-btn>
            </template>
            <v-text-field
              v-model="routeToClear"
              outlined
              label="Backend Route URL To Clear"
              placeholder="Ex: /words/A"
              hide-details
              class="mt-2"
            />
            <span>
              <b>Note: </b>Do not include the API prefix <i>/api/v2</i>
            </span>
            <v-radio-group v-model="selectedLevel" hide-details class="mb-2">
              <v-radio label="Exact" :value="'exact'" />
              <v-radio label="Starts With" :value="'startsWith'" />
            </v-radio-group>
            <v-row class="ma-0 mt-6">
              <span
                :class="{
                  'red--text': numMatchingKeys === 0,
                  'primary--text': numMatchingKeys !== 0,
                }"
              >
                <b>{{ numMatchingKeys }}</b> matching key{{
                  numMatchingKeys !== 1 ? 's' : ''
                }}</span
              >
            </v-row>
          </oare-dialog>
        </v-list-item-action>
      </v-list-item>
    </v-list>
    <v-divider class="mt-2 primary" />
    <h3 class="mt-4">Environment</h3>
    <v-list>
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Environment Info</v-list-item-title>
          <v-list-item-subtitle>
            Elastic Beanstalk Region:
            {{
              environmentInfo && environmentInfo.elasticBeanstalkRegion
                ? environmentInfo.elasticBeanstalkRegion
                : 'Development (localhost)'
            }}
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Database Read Region:
            {{
              environmentInfo && environmentInfo.databaseReadRegion
                ? environmentInfo.databaseReadRegion
                : 'Development (Docker)'
            }}</v-list-item-subtitle
          >
          <v-list-item-subtitle>
            Database Write Region:
            {{
              environmentInfo && environmentInfo.databaseWriteRegion
                ? environmentInfo.databaseWriteRegion
                : 'Development (Docker)'
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
import { EnvironmentInfo, CollectionResponse, Word } from '@oare/types';
import { AkkadianLetterGroupsUpper } from '@oare/oare';

export default defineComponent({
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');

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

    const repopulateCacheDialog = ref(false);
    const fillMissingCacheDialog = ref(false);
    const populateFlushLoading = ref(false);
    const populateLoading = ref(false);
    const populateCache = async (flush: boolean) => {
      try {
        if (flush) {
          populateFlushLoading.value = true;
          await server.flushCache();
          actions.showSnackbar('Cache flushed successfully.');
        } else {
          populateLoading.value = true;
        }

        const collections = await server.getAllCollections();
        actions.showSnackbar('Collections Lists Cached');

        const textsByCollectionPromises = await Promise.allSettled(
          collections.map(collection =>
            server.getCollectionTexts(collection.uuid)
          )
        );
        actions.showSnackbar('Collection Texts Lists Cached');
        const textsByCollection = textsByCollectionPromises
          .filter(text => text.status === 'fulfilled')
          .map(
            text => (text as PromiseFulfilledResult<CollectionResponse>).value
          );
        const textUuids = textsByCollection
          .map(collectionTexts => collectionTexts.texts.map(text => text.uuid))
          .flat();

        await Promise.allSettled(
          textUuids.map(textUuid => server.getEpigraphicInfo(textUuid))
        );
        actions.showSnackbar('Text Epigraphic Info Cached');

        if (process.env.NODE_ENV === 'production') {
          await Promise.allSettled(
            textUuids.map(textUuid => server.getTextSourceFile(textUuid))
          );
          actions.showSnackbar('Text Source Files Cached');
        }

        await Promise.allSettled(
          ['home', 'about'].map(page => server.getPageContent(page))
        );
        actions.showSnackbar('Page Content Cached');

        const letters = Object.keys(AkkadianLetterGroupsUpper);
        const wordsPromises = await Promise.allSettled(
          letters.map(letter => server.getDictionaryWords(letter))
        );
        actions.showSnackbar('Words Cached');
        const words = wordsPromises
          .filter(word => word.status === 'fulfilled')
          .map(word => (word as PromiseFulfilledResult<Word[]>).value)
          .flat();

        const namesPromises = await Promise.allSettled(
          letters.map(letter => server.getNames(letter))
        );
        actions.showSnackbar('Names Cached');
        const names = namesPromises
          .filter(word => word.status === 'fulfilled')
          .map(word => (word as PromiseFulfilledResult<Word[]>).value)
          .flat();

        const placesPromises = await Promise.allSettled(
          letters.map(letter => server.getPlaces(letter))
        );
        actions.showSnackbar('Places Cached');
        const places = placesPromises
          .filter(word => word.status === 'fulfilled')
          .map(word => (word as PromiseFulfilledResult<Word[]>).value)
          .flat();

        const dictionaryItems = [...words, ...names, ...places];

        await Promise.allSettled(
          dictionaryItems.map(word => server.getDictionaryInfo(word.uuid))
        );
        actions.showSnackbar('Dictionary Entries Cached');

        await server.getTaxonomyTree();
        actions.showSnackbar('Taxonomy Tree Cached');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error populating cache. Please try again.',
          err as Error
        );
      } finally {
        populateFlushLoading.value = false;
        populateLoading.value = false;
        repopulateCacheDialog.value = false;
        fillMissingCacheDialog.value = false;
      }
    };

    const individualClearDialog = ref(false);
    const individualClearLoading = ref(false);
    const routeToClear = ref('/');

    const selectedLevel = ref<'exact' | 'startsWith'>('exact');
    const clearRoute = async () => {
      try {
        individualClearLoading.value = true;
        await server.clearCacheRoute(routeToClear.value, selectedLevel.value);
        actions.showSnackbar('Successfully cleared specified cache route(s).');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error clearing individual cache route(s). Please try again.',
          err as Error
        );
      } finally {
        individualClearLoading.value = false;
        individualClearDialog.value = false;
        routeToClear.value = '/';
        selectedLevel.value = 'exact';
      }
    };

    const numMatchingKeys = ref(0);
    const getMatchingKeys = async () => {
      try {
        numMatchingKeys.value = await server.getNumKeys(
          routeToClear.value,
          selectedLevel.value
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error getting matching keys. Please try again.',
          err as Error
        );
      }
    };

    watch([routeToClear, selectedLevel], _.debounce(getMatchingKeys, 200));

    return {
      loading,
      cacheStatus,
      updateCacheStatus,
      environmentInfo,
      flushCache,
      populateCache,
      populateLoading,
      populateFlushLoading,
      flushCacheDialog,
      repopulateCacheDialog,
      fillMissingCacheDialog,
      individualClearDialog,
      clearRoute,
      individualClearLoading,
      routeToClear,
      selectedLevel,
      numMatchingKeys,
    };
  },
});
</script>

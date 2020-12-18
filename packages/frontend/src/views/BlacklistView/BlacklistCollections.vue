<template>
  <OareContentView :loading="loading">
    <div class="d-flex">
      <router-link to="/addblacklist/collections">
        <v-btn color="primary" class="mr-3 test-add">
          <span> <v-icon>mdi-plus</v-icon>Add collections</span>
        </v-btn>
      </router-link>
      <OareDialog
        v-model="confirmRemoveDialog"
        title="Confirm Removal"
        cancelText="No, don't remove"
        submitText="Yes, remove"
        @submit="removeCollections"
        :submitLoading="removeCollectionsLoading"
      >
        The following collection(s) will be removed from the public blacklist
        and will be available to all users unless individual group restrictions
        apply. Are you sure you want to remove them?
        <ul>
          <li v-for="collection in selectedCollections" :key="collection.uuid">
            {{ collection.name }}
          </li>
        </ul>
      </OareDialog>
      <v-menu>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            color="info"
            class="ml-3 test-actions"
            :disabled="selectedCollections.length < 1"
            data-actions-btn
            >Actions</v-btn
          >
        </template>
        <v-list>
          <v-list-item @click="confirmRemoveDialog = true" data-del-group-btn>
            <v-list-item-title class="test-remove-collections"
              >Remove From Blacklist</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-data-table
      :headers="blacklistHeaders"
      :items="publicBlacklist"
      item-key="uuid"
      class="mt-3"
      show-select
      v-model="selectedCollections"
    >
      <template #[`item.name`]="{ item }">
        <router-link
          :to="`/collections/name/${item.uuid}`"
          class="test-collection-name"
          >{{ item.name }}</router-link
        >
      </template>
    </v-data-table>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  watch,
  computed,
} from '@vue/composition-api';
import { CollectionListItem } from '@oare/types';
import OareContentView from '@/components/base/OareContentView.vue';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

export default defineComponent({
  components: { OareContentView },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const blacklistHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);

    const publicBlacklist: Ref<CollectionListItem[]> = ref([]);
    const selectedCollections: Ref<CollectionListItem[]> = ref([]);

    const loading = ref(true);
    const confirmRemoveDialog = ref(false);
    const removeCollectionsLoading = ref(false);

    onMounted(async () => {
      try {
        publicBlacklist.value = await server.getBlacklistCollections();
        publicBlacklist.value = publicBlacklist.value.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading blacklisted collection(s). Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    const removeCollections = async () => {
      try {
        removeCollectionsLoading.value = true;
        let removeCollectionIds = selectedCollections.value.map(
          collection => collection.uuid
        );

        await server.removeTextsFromPublicBlacklist(removeCollectionIds);
        publicBlacklist.value = publicBlacklist.value.filter(
          collection => !removeCollectionIds.includes(collection.uuid)
        );
        actions.showSnackbar('Successfully removed collection(s).');
        selectedCollections.value = [];
      } catch {
        actions.showErrorSnackbar(
          'Error removing collection(s). Please try again.'
        );
      } finally {
        confirmRemoveDialog.value = false;
        removeCollectionsLoading.value = false;
      }
    };

    return {
      loading,
      publicBlacklist,
      blacklistHeaders,
      selectedCollections,
      confirmRemoveDialog,
      removeCollectionsLoading,
      removeCollections,
    };
  },
});
</script>

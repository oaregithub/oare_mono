<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    Collections here affect all members of this group. You may restrict read and
    write access on collections added here.
    <div class="flex mt-2">
      <router-link :to="`/addgroupcollections/${groupId}`">
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
        Are you sure you want to remove the following collection(s) from this
        group? Members of this group will no longer be able to view or edit the
        following collection(s) if their visibility is restricted in another
        group that they belong to.
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
              >Remove From Group</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-data-table
      :headers="collectionListHeaders"
      :items="groupCollections"
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
      <template #[`item.canRead`]="{ item }">
        <v-switch
          :input-value="item.canRead"
          @change="updateCollectionRead(item.uuid, $event)"
          :label="item.canRead ? 'Yes' : 'No'"
          class="test-toggle-view"
        />
      </template>
      <template #[`item.canWrite`]="{ item }">
        <v-switch
          :input-value="item.canWrite"
          @change="updateCollectionEdit(item.uuid, $event)"
          :label="item.canWrite ? 'Yes' : 'No'"
          :disabled="!item.canRead"
          class="test-toggle-edit"
        />
      </template>
    </v-data-table>
  </div>
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
import { CollectionPermissionsItem } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup({ groupId }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const collectionListHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
      { text: 'Can view?', value: 'canRead' },
      { text: 'Can edit?', value: 'canWrite' },
    ]);

    const groupCollections: Ref<CollectionPermissionsItem[]> = ref([]);
    const selectedCollections: Ref<CollectionPermissionsItem[]> = ref([]);

    const loading = ref(true);
    const confirmRemoveDialog = ref(false);
    const removeCollectionsLoading = ref(false);

    onMounted(async () => {
      try {
        groupCollections.value = await server.getGroupCollections(
          Number(groupId)
        );
        groupCollections.value = groupCollections.value.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading group collection(s). Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    const removeCollections = async () => {
      try {
        removeCollectionsLoading.value = true;
        let uuidsToRemove = selectedCollections.value.map(
          collection => collection.uuid
        );

        await server.removeGroupCollections(Number(groupId), uuidsToRemove);
        groupCollections.value = groupCollections.value.filter(
          collection => !uuidsToRemove.includes(collection.uuid)
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

    const updateCollectionRead = async (uuid: string, canRead: boolean) => {
      const index = groupCollections.value.map(item => item.uuid).indexOf(uuid);
      groupCollections.value[index].canRead = canRead;

      if (!canRead) {
        groupCollections.value[index].canWrite = false;
      }

      const collection = groupCollections.value[index];
      try {
        await server.updateCollectionPermissions(Number(groupId), {
          uuid,
          canRead: collection.canRead,
          canWrite: collection.canWrite,
        });
      } catch {
        actions.showErrorSnackbar(
          'Error updating viewing permissions. Please try again.'
        );
        groupCollections.value[index].canRead = !canRead;
      }
    };

    const updateCollectionEdit = async (uuid: string, canWrite: boolean) => {
      const index = groupCollections.value.map(item => item.uuid).indexOf(uuid);

      groupCollections.value[index].canWrite = canWrite;
      const collection = groupCollections.value[index];
      try {
        await server.updateCollectionPermissions(Number(groupId), {
          uuid,
          canRead: collection.canRead,
          canWrite: collection.canWrite,
        });
      } catch {
        actions.showErrorSnackbar(
          'Error updating editing permissions. Please try again.'
        );
        groupCollections.value[index].canWrite = !canWrite;
      }
    };

    return {
      loading,
      groupCollections,
      collectionListHeaders,
      selectedCollections,
      confirmRemoveDialog,
      removeCollectionsLoading,
      removeCollections,
      updateCollectionRead,
      updateCollectionEdit,
    };
  },
});
</script>

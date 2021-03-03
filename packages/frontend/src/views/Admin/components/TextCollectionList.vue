<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <span v-if="groupId">
      {{ itemType }}s here affect all members of this group. You may restrict
      read and write access on {{ itemType.toLowerCase() }}s added here.
    </span>
    <div class="d-flex mt-2">
      <router-link :to="addUrl">
        <v-btn color="primary" class="mr-3 test-add">
          <span> <v-icon>mdi-plus</v-icon>Add {{ itemType }}s</span>
        </v-btn>
      </router-link>
      <OareDialog
        v-model="confirmRemoveDialog"
        title="Confirm Removal"
        cancelText="No, don't remove"
        submitText="Yes, remove"
        @submit="removeListItems"
        :submitLoading="removeItemsLoading"
      >
        {{ confirmRemoveMessage }}
        <ul>
          <li v-for="item in selectedItems" :key="item.uuid">
            {{ item.name }}
          </li>
        </ul>
      </OareDialog>
      <v-menu>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            color="info"
            class="ml-3 test-actions"
            :disabled="selectedItems.length < 1"
            data-actions-btn
            >Actions</v-btn
          >
        </template>
        <v-list>
          <v-list-item @click="confirmRemoveDialog = true">
            <v-list-item-title class="test-remove-items"
              >Remove {{ itemType }}s</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-data-table
      :headers="listHeaders"
      :items="items"
      item-key="uuid"
      class="mt-3"
      show-select
      v-model="selectedItems"
    >
      <template #[`item.name`]="{ item }">
        <router-link
          v-if="item.hasEpigraphy || itemType === 'Collection'"
          :to="`${itemLink}${item.uuid}`"
          class="test-item-name"
          >{{ item.name }}</router-link
        >
        <span v-else>{{ item.name }}</span>
      </template>
      <template v-if="updatePermissions" #[`item.canRead`]="{ item }">
        <v-switch
          :input-value="item.canRead"
          @change="updateItemRead(item.uuid, $event)"
          :label="item.canRead ? 'Yes' : 'No'"
          class="test-toggle-view"
        />
      </template>
      <template v-if="updatePermissions" #[`item.canWrite`]="{ item }">
        <v-switch
          :input-value="item.canWrite"
          @change="updateItemEdit(item.uuid, $event)"
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
  computed,
  PropType,
} from '@vue/composition-api';
import {
  CollectionPermissionsItem,
  Text,
  UpdateTextCollectionListPayload,
  PermissionsListType,
} from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    groupId: {
      type: String,
      required: false,
    },
    itemType: {
      type: String as PropType<PermissionsListType>,
      required: true,
    },
    getItems: {
      type: Function as PropType<
        (groupId?: string) => Text[] | CollectionPermissionsItem[]
      >,
      required: true,
    },
    removeItems: {
      type: Function as PropType<(uuids: string[], groupId?: string) => void>,
      required: true,
    },
    updatePermissions: {
      type: Function as PropType<
        (groupId: number, payload: UpdateTextCollectionListPayload) => void
      >,
      required: false,
    },
  },
  setup({ groupId, itemType, getItems, removeItems, updatePermissions }) {
    const actions = sl.get('globalActions');

    const listHeaders: Ref<DataTableHeader[]> = updatePermissions
      ? ref([
          { text: 'Name', value: 'name' },
          { text: 'Can view?', value: 'canRead' },
          { text: 'Can edit?', value: 'canWrite' },
        ])
      : ref([{ text: 'Name', value: 'name' }]);

    const items: Ref<Text[] | CollectionPermissionsItem[]> = ref([]);
    const selectedItems: Ref<Text[] | CollectionPermissionsItem[]> = ref([]);

    const addUrl = computed(() =>
      groupId
        ? `/addgroup${itemType.toLowerCase()}s/${groupId}`
        : `/addblacklist/${itemType.toLowerCase()}s`
    );
    const itemLink = computed(() =>
      itemType === 'Collection' ? '/collections/name/' : '/epigraphies/'
    );

    const loading = ref(true);
    const confirmRemoveDialog = ref(false);
    const removeItemsLoading = ref(false);

    const confirmRemoveMessage = computed(() => {
      if (groupId) {
        return `Are you sure you want to remove the following
        ${itemType.toLowerCase()}(s) from this group? Members of this group
        will no longer be able to view or edit the following
        ${itemType.toLowerCase()}(s) if their visibility is restricted in
        another group that they belong to.`;
      } else {
        return `The following ${itemType.toLowerCase()}(s) will be removed 
        from the public blacklist and will be available to all users unless 
        individual group permissions apply. Are you sure you want to remove them?`;
      }
    });

    onMounted(async () => {
      try {
        if (groupId) {
          items.value = await getItems(groupId);
        } else {
          items.value = await getItems();
        }
        items.value = items.value.sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        actions.showErrorSnackbar(
          `Error loading group ${itemType}(s). Please try again.`
        );
      } finally {
        loading.value = false;
      }
    });

    const removeListItems = async () => {
      try {
        removeItemsLoading.value = true;
        let uuidsToRemove = selectedItems.value.map(item => item.uuid);

        if (groupId) {
          await removeItems(uuidsToRemove, groupId);
        } else {
          await removeItems(uuidsToRemove);
        }
        items.value = items.value.filter(
          item => !uuidsToRemove.includes(item.uuid)
        );
        actions.showSnackbar(
          `Successfully removed ${itemType.toLowerCase()}(s).`
        );
        selectedItems.value = [];
      } catch {
        actions.showErrorSnackbar(
          `Error removing ${itemType.toLowerCase()}(s). Please try again.`
        );
      } finally {
        confirmRemoveDialog.value = false;
        removeItemsLoading.value = false;
      }
    };

    const updateItemRead = async (uuid: string, canRead: boolean) => {
      if (updatePermissions) {
        const index = items.value.map(item => item.uuid).indexOf(uuid);
        items.value[index].canRead = canRead;

        if (!canRead) {
          items.value[index].canWrite = false;
        }

        const item = items.value[index];
        try {
          await updatePermissions(Number(groupId), {
            uuid,
            canRead: item.canRead!,
            canWrite: item.canWrite!,
          });
        } catch {
          actions.showErrorSnackbar(
            'Error updating viewing permissions. Please try again.'
          );
          items.value[index].canRead = !canRead;
        }
      }
    };

    const updateItemEdit = async (uuid: string, canWrite: boolean) => {
      if (updatePermissions) {
        const index = items.value.map(item => item.uuid).indexOf(uuid);

        items.value[index].canWrite = canWrite;
        const item = items.value[index];
        try {
          await updatePermissions(Number(groupId), {
            uuid,
            canRead: item.canRead!,
            canWrite: item.canWrite!,
          });
        } catch {
          actions.showErrorSnackbar(
            'Error updating editing permissions. Please try again.'
          );
          items.value[index].canWrite = !canWrite;
        }
      }
    };

    return {
      loading,
      items,
      listHeaders,
      selectedItems,
      confirmRemoveDialog,
      removeItemsLoading,
      removeListItems,
      updateItemRead,
      updateItemEdit,
      addUrl,
      itemLink,
      confirmRemoveMessage,
    };
  },
});
</script>

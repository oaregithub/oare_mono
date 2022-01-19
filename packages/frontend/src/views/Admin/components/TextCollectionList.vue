<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <span v-if="addingEditPermissions"
      >{{ itemType }}s here affect all members of this group. Here, you can
      grant edit permission for {{ itemType.toLowerCase() }}s for group
      members.</span
    >
    <span v-else-if="groupId">
      {{ itemType }}s here affect all members of this group. Here, you may allow
      denylisted {{ itemType.toLowerCase() }}s to be seen.
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
      :search="search"
      :options.sync="searchOptions"
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
  watch,
} from '@vue/composition-api';
import { PermissionsListType, DenylistAllowlistItem } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    groupId: {
      type: String,
      required: false,
    },
    search: {
      type: String,
      required: false,
    },
    itemType: {
      type: String as PropType<PermissionsListType>,
      required: true,
    },
    getItems: {
      type: Function as PropType<
        (groupId?: string, search?: string) => DenylistAllowlistItem[]
      >,
      required: true,
    },
    removeItems: {
      type: Function as PropType<(uuids: string[], groupId?: string) => void>,
      required: true,
    },
    addingEditPermissions: {
      type: Boolean,
      default: false,
    },
    page: {
      type: Number,
      default: 1,
    },
    rows: {
      type: Number,
      default: 10,
    },
  },
  setup(
    {
      groupId,
      search,
      itemType,
      getItems,
      removeItems,
      addingEditPermissions,
      page,
      rows,
    },
    { emit }
  ) {
    const actions = sl.get('globalActions');

    const listHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);

    const items: Ref<DenylistAllowlistItem[]> = ref([]);
    const selectedItems: Ref<DenylistAllowlistItem[]> = ref([]);

    const addUrl = computed(() => {
      if (groupId) {
        return addingEditPermissions
          ? `/admin/add_edit/${itemType.toLowerCase()}s/${groupId}`
          : `/admin/add_allowlist/${itemType.toLowerCase()}s/${groupId}`;
      }
      return `/admin/add_denylist/${itemType.toLowerCase()}s`;
    });
    const itemLink = computed(() =>
      itemType === 'Collection' ? '/collections/name/' : '/epigraphies/'
    );

    const loading = ref(true);
    const confirmRemoveDialog = ref(false);
    const removeItemsLoading = ref(false);
    const searchOptions = ref({
      page: page,
      itemsPerPage: rows,
    });

    watch(
      () => search,
      () => {
        emit('update:search', search);
      }
    );

    watch(
      () => searchOptions.value.page,
      () => {
        emit('update:page', searchOptions.value.page);
      }
    );

    watch(
      () => searchOptions.value.itemsPerPage,
      () => {
        emit('update:rows', searchOptions.value.itemsPerPage);
      }
    );

    const confirmRemoveMessage = computed(() => {
      if (groupId) {
        return `Are you sure you want to remove the following
        ${itemType.toLowerCase()}(s) from this group? Members of this group
        will no longer be able to view this ${itemType.toLowerCase()} if it is denylisted.`;
      } else {
        return `The following ${itemType.toLowerCase()}(s) will be removed
        from the public denylist and will be visible to all users. Are you sure you want to remove them?`;
      }
    });

    onMounted(async () => {
      try {
        if (groupId) {
          items.value = await getItems(groupId);
        } else {
          items.value = await getItems();
        }
        items.value = items.value.sort((a, b) =>
          a.name && b.name ? a.name.localeCompare(b.name) : -1
        );
      } catch (err) {
        actions.showErrorSnackbar(
          `Error loading group ${itemType}(s). Please try again.`,
          err as Error
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
      } catch (err) {
        actions.showErrorSnackbar(
          `Error removing ${itemType.toLowerCase()}(s). Please try again.`,
          err as Error
        );
      } finally {
        confirmRemoveDialog.value = false;
        removeItemsLoading.value = false;
      }
    };

    return {
      loading,
      items,
      listHeaders,
      selectedItems,
      search,
      searchOptions,
      confirmRemoveDialog,
      removeItemsLoading,
      removeListItems,
      addUrl,
      itemLink,
      confirmRemoveMessage,
    };
  },
});
</script>

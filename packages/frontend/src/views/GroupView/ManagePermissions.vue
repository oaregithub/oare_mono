<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <span>Permissions set here affect all members of this group.</span>
    <div>
      <div v-for="(value, name) in allPermissionsOptions" :key="name">
        <v-divider class="mt-4 primary" />
        <h2 class="my-4">
          {{ name.charAt(0).toUpperCase() + name.slice(1) }}
        </h2>
        <!-- <v-data-table :headers="listHeaders" :items="value" hide-default-footer>
          <template #[`item.name`]="{ item }">
            <div>
              <span>{{ formatName(item) }}</span>
            </div>
          </template>
          <template #[`item.permission`]="{ item }">
            <v-switch
              :input-value="allGroupPermissions.includes(item)"
              @change="updatePermission(item, name, $event)"
            ></v-switch>
          </template>
        </v-data-table> -->
        <v-list v-if="value">
          <v-list-item v-for="(permission, index) in value" :key="index">
            <v-list-item-content>
              <v-list-item-title
                >{{ formatName(permission) }}
              </v-list-item-title>
              <v-list-item-action>
                <v-switch
                  :input-value="allGroupPermissions.includes(permission)"
                  @change="updatePermission(permission, name, $event)"
                >
                </v-switch>
              </v-list-item-action>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  Ref,
  computed,
} from '@vue/composition-api';
import {
  DictionaryPermission,
  PagesPermission,
  PermissionResponse,
  UpdatePermissionPayload,
} from '@oare/types';
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

    const listHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name', width: '75%' },
      { text: 'Allow?', value: 'permission' },
    ]);

    const loading = ref(false);

    const allPermissionsOptions: Ref<Partial<PermissionResponse>> = ref({});

    const groupPermissions: Ref<Partial<PermissionResponse>> = ref({});

    const allGroupPermissions: Ref<string[]> = computed(() => {
      const permissions: string[] = [];
      Object.values(groupPermissions.value).map(type => {
        if (type) {
          type.forEach((permission: string) => permissions.push(permission));
        }
      });
      return permissions;
    });

    const formatName = (name: string) => {
      const lowerCase = name.replace(/_/g, ' ').toLowerCase();
      return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1);
    };

    const updatePermission = async (
      permission: string,
      type: string,
      isAllowed: boolean
    ) => {
      try {
        if (isAllowed) {
          const payload: UpdatePermissionPayload = {
            type,
            permission,
          };
          await server.addPermission(groupId, payload);
        } else {
          await server.removePermission(groupId, permission);
        }
      } catch {
        actions.showErrorSnackbar(
          'Error updating permission. Please try again.'
        );
      }
    };

    onMounted(async () => {
      try {
        loading.value = true;

        groupPermissions.value = await server.getGroupPermissions(
          Number(groupId)
        );
        allPermissionsOptions.value = await server.getAllPermissions();
      } catch {
        actions.showErrorSnackbar(
          'Error loading group permissions. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      allPermissionsOptions,
      groupPermissions,
      allGroupPermissions,
      formatName,
      listHeaders,
      updatePermission,
    };
  },
});
</script>

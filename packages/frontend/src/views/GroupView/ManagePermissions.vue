<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <span>Permissions set here affect all members of this group.</span>
    <div>
      <div v-for="(value, name) in allPermissionsOptions" :key="name">
        <v-divider class="mt-2 primary" />
        <h2 class="mt-4">
          {{ name.charAt(0).toUpperCase() + name.slice(1) }}
        </h2>
        <v-list v-if="value">
          <div v-for="(permission, index) in value" :key="index">
            <v-divider v-if="Number(index) !== 0" />
            <v-list-item class="ma-2">
              <v-list-item-content>
                <v-list-item-title
                  >{{ formatName(permission.name) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ permission.description }}
                </v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-switch
                  :input-value="allGroupPermissions.includes(permission.name)"
                  @change="updatePermission(permission.name, name, $event)"
                >
                </v-switch>
              </v-list-item-action>
            </v-list-item>
          </div>
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
  AllPermissions,
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

    const loading = ref(false);

    const allPermissionsOptions: Ref<Partial<AllPermissions>> = ref({});

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
      updatePermission,
    };
  },
});
</script>

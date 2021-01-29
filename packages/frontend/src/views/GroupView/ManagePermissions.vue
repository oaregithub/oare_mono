<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <span>Permissions set here affect all members of this group.</span>
    <div>
      <div v-for="(type, index) in allPermissionTypes" :key="index">
        <v-divider class="mt-2 primary" />
        <h2 class="mt-4">
          {{ type.charAt(0).toUpperCase() + type.slice(1) }}
        </h2>
        <v-list>
          <div
            v-for="(permission, index) in allPermissionsOptions.filter(
              permission => permission.type === type
            )"
            :key="index"
          >
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
                <v-tooltip
                  left
                  :disabled="
                    !permission.dependency ||
                      groupPermissionNames.includes(permission.dependency)
                  "
                >
                  <template v-slot:activator="{ on, attrs }">
                    <div v-bind="attrs" v-on="on">
                      <v-switch
                        :input-value="
                          groupPermissionNames.includes(permission.name)
                        "
                        @change="updatePermission(permission, $event)"
                        :disabled="
                          permission.dependency &&
                            !groupPermissionNames.includes(
                              permission.dependency
                            )
                        "
                        class="test-switch"
                      >
                      </v-switch>
                    </div>
                  </template>
                  <span v-if="permission.dependency"
                    >To enable, the
                    {{ formatName(permission.dependency) }} permission must be
                    enabled</span
                  >
                </v-tooltip>
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
  PermissionItem,
  UpdatePermissionPayload,
  PermissionName,
} from '@oare/types';
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

    const allPermissionsOptions: Ref<PermissionItem[]> = ref([]);

    const allPermissionTypes = computed(() => {
      const types = allPermissionsOptions.value.map(
        permission => permission.type
      );
      return [...new Set(types)];
    });

    const groupPermissions: Ref<PermissionItem[]> = ref([]);

    const groupPermissionNames: Ref<PermissionName[]> = computed(() => {
      return groupPermissions.value.map(permission => permission.name);
    });

    const formatName = (name: string) => {
      const lowerCase = name.replace(/_/g, ' ').toLowerCase();
      return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1);
    };

    const updatePermission = async (
      permission: PermissionItem,
      isAllowed: boolean
    ) => {
      try {
        if (isAllowed) {
          const payload: UpdatePermissionPayload = {
            permission,
          };
          await server.addGroupPermission(groupId, payload);
        } else {
          await server.removePermission(groupId, permission.name);
        }
        groupPermissions.value = await server.getGroupPermissions(
          Number(groupId)
        );
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
      allPermissionTypes,
      groupPermissions,
      groupPermissionNames,
      formatName,
      updatePermission,
    };
  },
});
</script>

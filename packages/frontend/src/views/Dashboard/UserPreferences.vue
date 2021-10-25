<template>
  <OareContentView title="User Preferences">
    <div v-if="!isAdmin">Coming Soon</div>
    <div v-if="isAdmin">
      <v-list-item class="ma-2">
        <v-list-item-content>
          <v-list-item-title>Enable Beta Features</v-list-item-title>
          <v-list-item-subtitle
            >Get access to features currently in beta (Creating Texts,
            etc.)</v-list-item-subtitle
          >
        </v-list-item-content>
        <v-list-item-action>
          <v-switch
            :input-value="hasBetaAccess"
            @change="updateBetaStatus($event)"
            class="test-beta-switch"
          >
          </v-switch>
        </v-list-item-action>
      </v-list-item>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const isAdmin = computed(() => store.getters.isAdmin);

    const hasBetaAccess = ref(false);

    const updateBetaStatus = async (allowBetaAccess: boolean) => {
      try {
        if (allowBetaAccess) {
          await server.allowBetaAccess();
        } else {
          await server.revokeBetaAccess();
        }
        store.setBetaAccess(allowBetaAccess);
      } catch {
        actions.showErrorSnackbar(
          'Error updating beta access status. Please try again.'
        );
      }
    };

    onMounted(() => {
      try {
        hasBetaAccess.value = store.getters.user
          ? store.getters.user.betaAccess
          : false;
      } catch {
        actions.showErrorSnackbar(
          'Error getting current preferences. Please try again.'
        );
      }
    });
    return {
      hasBetaAccess,
      updateBetaStatus,
      isAdmin,
    };
  },
});
</script>
<template>
  <OareCard title="Create new password">
    <v-text-field
      outlined
      v-model="newPassword"
      label="New password"
      type="password"
    />
    <v-text-field
      outlined
      v-model="confirmNewPassword"
      label="Confirm new password"
      type="password"
    />
    <span class="subtitle error--text" v-if="!passwordsMatch">
      Passwords do not match
    </span>

    <template #actions>
      <OareLoaderButton
        color="primary"
        :loading="loading"
        :disabled="!newPassword || !confirmNewPassword || !passwordsMatch"
        >Submit</OareLoaderButton
      >
    </template>
  </OareCard>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';

export default defineComponent({
  props: {
    uuid: {
      type: String,
      required: true,
    },
  },
  setup() {
    const newPassword = ref('');
    const confirmNewPassword = ref('');
    const loading = ref(false);

    const passwordsMatch = computed(
      () => newPassword.value === confirmNewPassword.value
    );

    return {
      newPassword,
      confirmNewPassword,
      loading,
      passwordsMatch,
    };
  },
});
</script>

<style></style>

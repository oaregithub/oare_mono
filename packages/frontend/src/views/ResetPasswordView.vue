<template>
  <OareCard :title="title">
    <v-col v-if="!submitted">
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
    </v-col>
    <v-col v-else>
      <span class="mb-3">{{
        serverError || 'Your password has successfully been reset.'
      }}</span>
    </v-col>

    <template #actions>
      <OareLoaderButton
        v-if="!submitted"
        color="primary"
        :loading="loading"
        :disabled="!newPassword || !confirmNewPassword || !passwordsMatch"
        @click="resetPassword"
        >Submit</OareLoaderButton
      >

      <v-btn
        color="primary"
        v-else-if="serverError"
        to="/send_reset_password_email"
        >Try again</v-btn
      >
      <v-btn color="primary" v-else to="/login">Login</v-btn>
    </template>
  </OareCard>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    uuid: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const newPassword = ref('');
    const confirmNewPassword = ref('');
    const serverError = ref('');
    const loading = ref(false);
    const submitted = ref(false);
    const title = ref('Create new password');

    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const passwordsMatch = computed(
      () => newPassword.value === confirmNewPassword.value
    );

    const resetPassword = async () => {
      try {
        loading.value = true;
        await server.resetPassword({
          resetUuid: props.uuid,
          newPassword: newPassword.value,
        });
      } catch (err) {
        if (err && err.response && err.response.status === 400) {
          serverError.value = err.response.data.message;
          title.value = 'Failed to reset password';
        } else {
          actions.showErrorSnackbar('Failed to reset password');
        }
      } finally {
        loading.value = false;
        submitted.value = true;
      }
    };

    return {
      newPassword,
      confirmNewPassword,
      loading,
      resetPassword,
      submitted,
      passwordsMatch,
      title,
      serverError,
    };
  },
});
</script>

<style></style>

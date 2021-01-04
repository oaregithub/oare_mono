<template>
  <OareCard :title="title">
    <v-col v-if="!submitted">
      <v-text-field
        outlined
        v-model="newPassword"
        label="New password"
        type="password"
        class="test-new-password"
        autofocus
      />
      <v-text-field
        outlined
        v-model="confirmNewPassword"
        label="Confirm new password"
        type="password"
        class="test-confirm-new-password"
      />
      <span class="subtitle error--text" v-if="formError">
        {{ formError }}
      </span>
    </v-col>
    <v-col v-else>
      <span v-if="serverError" v-html="serverError" class="test-error-msg" />
      <span v-else>Your password has successfully been reset.</span>
    </v-col>

    <template #actions>
      <OareLoaderButton
        v-if="!submitted"
        class="test-submit"
        color="primary"
        :loading="loading"
        :disabled="!newPassword || !confirmNewPassword || Boolean(formError)"
        @click="resetPassword"
        >Submit</OareLoaderButton
      >

      <v-btn
        color="primary"
        v-else-if="serverError"
        to="/send_reset_password_email"
        class="test-action"
        >Try again</v-btn
      >
      <v-btn class="test-action" color="primary" v-else to="/login"
        >Login</v-btn
      >
    </template>
  </OareCard>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import sl from '@/serviceLocator';
import serverProxy from '@/serverProxy';

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

    const formError = computed(() => {
      if (newPassword.value !== confirmNewPassword.value) {
        return 'Passwords do not match';
      }

      if (newPassword.value.length < 8) {
        return 'Passwords must be at least 8 characters long';
      }

      return '';
    });

    const resetPassword = async () => {
      try {
        loading.value = true;
        await server.resetPassword({
          resetUuid: props.uuid,
          newPassword: newPassword.value,
        });
      } catch (err) {
        title.value = 'Failed to reset password';
        if (err && err.response && err.response.status === 400) {
          serverError.value = err.response.data.message;
        } else {
          serverError.value =
            'There was a server-side error. Please try again, and if the problem persists, contact us at <a href="mailto:oarefeedback@byu.edu">oarefeedback@byu.edu</a>.';
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
      formError,
      title,
      serverError,
    };
  },
});
</script>

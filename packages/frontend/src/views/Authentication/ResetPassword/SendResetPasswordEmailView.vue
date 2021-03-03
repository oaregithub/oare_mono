<template>
  <OareCard :title="title">
    <div class="d-flex flex-column" v-if="!emailSent">
      <span
        >Enter your email below. A link will be sent to you allowing you to
        reset your password.</span
      >
      <v-text-field
        class="test-email-field mt-2"
        autofocus
        v-model="email"
        outlined
        label="Email"
      />
    </div>
    <div v-else class="d-flex flex-column">
      If there is an account associated with that email, a message has been sent
      to your inbox with a link to reset your password. The link will expire in
      30 minutes.
    </div>
    <template #actions>
      <OareLoaderButton
        class="test-submit-btn"
        color="primary"
        :loading="loading"
        :disabled="!email"
        @click="sendEmail"
        v-if="!emailSent"
        >Submit</OareLoaderButton
      >
    </template>
  </OareCard>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const email = ref('');
    const loading = ref(false);
    const emailSent = ref(false);

    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const sendEmail = async () => {
      try {
        loading.value = true;
        await server.sendResetPasswordEmail(email.value);
        emailSent.value = true;
      } catch {
        actions.showErrorSnackbar(
          'Failed to send reset email. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    };

    const title = computed(() =>
      emailSent.value ? 'Check your email' : 'Reset password'
    );
    return {
      email,
      loading,
      emailSent,
      title,
      sendEmail,
    };
  },
});
</script>

<style></style>

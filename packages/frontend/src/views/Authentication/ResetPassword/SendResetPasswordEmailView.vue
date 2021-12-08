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
        @keypress.enter="sendEmail"
      />
    </div>
    <div v-else class="d-flex flex-column">
      Please check your inbox. A link has been sent to you that will help you
      reset your password.
      <router-link to="/login">Go back to login</router-link>
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
      } catch (err) {
        const { code, message } = err;
        if (code === 'auth/invalid-email') {
          actions.showErrorSnackbar(
            'The email you have provided is invalid. Please try again.',
            err as Error
          );
        } else if (code === 'auth/user-not-found') {
          actions.showErrorSnackbar(
            'There is no user associated with the given email address.',
            err as Error
          );
        } else {
          actions.showErrorSnackbar(message, err as Error);
        }
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

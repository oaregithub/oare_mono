<template>
  <v-progress-linear v-if="verifyingCode" indeterminate />
  <OareCard v-else :title="title">
    <v-col v-if="serverError" class="test-error-msg">
      {{ serverError }}
    </v-col>
    <v-col v-else-if="!submitted">
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
    <v-col v-else> Your password has successfully been reset. </v-col>

    <template #actions>
      <v-btn
        color="primary"
        v-if="serverError"
        to="/send_reset_password_email"
        class="test-action"
        >Try again</v-btn
      >
      <OareLoaderButton
        v-else-if="!submitted"
        class="test-submit"
        color="primary"
        :loading="loading"
        :disabled="!newPassword || !confirmNewPassword || Boolean(formError)"
        @click="resetPassword"
        >Submit</OareLoaderButton
      >

      <v-btn class="test-action" color="primary" v-else to="/login"
        >Log In</v-btn
      >
    </template>
  </OareCard>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  onMounted,
} from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const newPassword = ref('');
    const confirmNewPassword = ref('');
    const serverError = ref('');
    const loading = ref(false);
    const submitted = ref(false);
    const verifyingCode = ref(true);
    const resettingEmail = ref('');

    const server = sl.get('serverProxy');
    const router = sl.get('router');

    const oobCode = router.currentRoute.query.oobCode as string;

    const title = computed(() =>
      serverError.value
        ? 'Cannot reset password'
        : `Resetting password for ${resettingEmail.value}`
    );

    const handleAuthError = (err: { code: string; message: string }) => {
      const { code } = err;
      if (code === 'auth/expired-action-code') {
        serverError.value = 'The code you have provided is expired.';
      } else if (code === 'auth/invalid-action-code') {
        serverError.value = 'The code you have provided is invalid.';
      } else if (code === 'auth/user-not-found') {
        serverError.value = 'No user was found for the given code.';
      } else {
        serverError.value = 'There was an unknown error.';
      }
    };

    onMounted(async () => {
      try {
        const email = await server.verifyPasswordResetCode(oobCode);
        resettingEmail.value = email;
      } catch (err) {
        handleAuthError(err as any);
      } finally {
        verifyingCode.value = false;
      }
    });

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

        await server.resetPassword(oobCode, newPassword.value);
      } catch (err) {
        handleAuthError(err as any);
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
      resettingEmail,
    };
  },
});
</script>

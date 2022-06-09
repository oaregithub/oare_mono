<template>
  <OareDialog
    :value="value"
    @input="$emit('input', $event)"
    title="Verify Password"
    @submit="verifyPassword"
    :submitDisabled="!confirmedPassword"
    :submitLoading="confirmPasswordLoading"
    :persistent="false"
  >
    <span v-if="description"> {{ description }} </span>
    <v-text-field
      v-model="confirmedPassword"
      placeholder="Password"
      outlined
      autofocus
      type="password"
      class="test-confirm-password mt-4"
      @keypress.enter="confirmedPassword && verifyPassword()"
    />
  </OareDialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: false,
    },
  },
  setup(_, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const confirmPasswordLoading = ref(false);
    const confirmedPassword = ref('');

    const verifyPassword = async () => {
      confirmPasswordLoading.value = true;
      try {
        await server.reauthenticateUser(confirmedPassword.value);
        confirmedPassword.value = '';
        emit('reauthenticated');
        emit('input', false);
      } catch (err) {
        if (err && (err as any).code) {
          if ((err as any).code === 'auth/wrong-password') {
            actions.showErrorSnackbar(
              'The password you have provided is invalid.',
              err as Error
            );
          }
        }
      } finally {
        confirmPasswordLoading.value = false;
      }
    };
    return {
      confirmPasswordLoading,
      confirmedPassword,
      verifyPassword,
    };
  },
});
</script>

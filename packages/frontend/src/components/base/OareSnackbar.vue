<template>
  <v-snackbar v-model="showSnackbar" :color="snackbarColor">
    {{ message }}
    <template #action="{ attrs }">
      <v-btn
        :color="buttonColor"
        text
        v-bind="attrs"
        @click="showSnackbar = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from '@vue/composition-api';
import EventBus, { ACTIONS } from '@/EventBus';

export interface SnackbarOptions {
  text: string;
  error?: boolean;
}

export default defineComponent({
  setup() {
    const message = ref('');
    const showSnackbar = ref(false);
    const snackbarColor: Ref<string | undefined> = ref(undefined);
    const buttonColor = ref('info');

    onMounted(() => {
      EventBus.$on(ACTIONS.TOAST, (options: SnackbarOptions) => {
        showSnackbar.value = true;
        message.value = options.text;
        snackbarColor.value = options.error ? 'error' : undefined;
        buttonColor.value = snackbarColor.value === 'error' ? 'white' : 'info';
      });
    });

    return {
      showSnackbar,
      message,
      snackbarColor,
      buttonColor,
    };
  },
});
</script>

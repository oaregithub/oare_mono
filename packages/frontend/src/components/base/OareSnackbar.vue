<template>
  <v-snackbar
    v-model="showSnackbar"
    :color="snackbarColor"
    :top="top"
    content-class="pa-2 pl-3 pr-0"
  >
    <v-row class="ma-0" align="center">
      <span class="mr-2">{{ message }}</span>
      <v-spacer />
      <v-btn
        v-if="errorMessage"
        :color="buttonColor"
        text
        @click="showDetails = !showDetails"
      >
        {{ showDetails ? 'Hide Details' : 'Show Details' }}
      </v-btn>
      <v-btn
        :color="buttonColor"
        text
        @click="
          showSnackbar = false;
          onAction();
        "
      >
        {{ actionText }}
      </v-btn>
    </v-row>
    <v-row class="ma-0 mt-2 errorMessage" v-if="showDetails">{{
      errorMessage
    }}</v-row>
  </v-snackbar>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  watch,
} from '@vue/composition-api';
import EventBus, { ACTIONS } from '@/EventBus';

export interface SnackbarOptions {
  text: string;
  errorMessage?: string;
  error?: boolean;
  onAction?: () => void;
  actionText?: string;
}

export default defineComponent({
  setup() {
    const message = ref('');
    const errorMessage = ref<string | null>('');
    const showSnackbar = ref(false);
    const snackbarColor: Ref<string | undefined> = ref(undefined);
    const buttonColor = ref('info');
    const top = ref(false);
    const actionText = ref('Close');
    const onAction: Ref<() => void> = ref(() => {});
    const showDetails = ref(false);

    onMounted(() => {
      EventBus.$on(ACTIONS.TOAST, (options: SnackbarOptions) => {
        showSnackbar.value = true;
        message.value = options.text;
        errorMessage.value = options.errorMessage || null;
        snackbarColor.value = options.error ? 'error' : undefined;
        top.value = !!options.error;
        buttonColor.value = snackbarColor.value === 'error' ? 'white' : 'info';
        onAction.value = options.onAction || (() => {});
        actionText.value = options.actionText || 'Close';
      });

      EventBus.$on(ACTIONS.CLOSE_TOAST, () => {
        showSnackbar.value = false;
      });
    });

    watch(showSnackbar, () => {
      if (!showSnackbar.value) {
        showDetails.value = false;
      }
    });

    return {
      showSnackbar,
      message,
      errorMessage,
      snackbarColor,
      buttonColor,
      top,
      actionText,
      onAction,
      showDetails,
    };
  },
});
</script>

<style scoped>
.errorMessage {
  font-size: 8pt;
}
</style>

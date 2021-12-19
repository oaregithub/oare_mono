<template>
  <v-row class="ma-0 pa-0 pl-4" align="center">
    <v-btn v-if="showBackButton" text @click="previous" class="mr-3">
      Back
    </v-btn>
    <OareLoaderButton
      :disabled="blockContinue"
      :loading="continueLoading"
      color="primary"
      @click="next"
    >
      {{ continueButtonText }}
    </OareLoaderButton>
    <span v-if="blockContinue" class="red--text ml-4">{{
      blockContinueText
    }}</span>
  </v-row>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    showBackButton: {
      type: Boolean,
      default: true,
    },
    continueButtonText: {
      type: String,
      default: 'Continue',
    },
    blockContinue: {
      type: Boolean,
      default: false,
    },
    blockContinueText: {
      type: String,
      required: false,
    },
    continueAction: {
      type: Function as PropType<() => Promise<void>>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');

    const continueLoading = ref(false);

    const previous = () => {
      emit('previous');
    };

    const next = async () => {
      try {
        continueLoading.value = true;
        if (props.continueAction) {
          await props.continueAction();
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error continuing to next step. Please try again.',
          err as Error
        );
      } finally {
        continueLoading.value = false;
        emit('next');
      }
    };

    return {
      previous,
      next,
      continueLoading,
    };
  },
});
</script>

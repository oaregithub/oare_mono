<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    width="500"
    :persistent="persistent"
  >
    <template v-slot:activator="{ on }">
      <slot name="activator" :on="on"></slot>
    </template>

    <v-card>
      <v-card-title data-testid="dialog-title" class="test-dialog-title">{{
        title
      }}</v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          @click="$emit('input', false)"
          color="error"
          text
          data-testid="cancel-btn"
          >{{ cancelText }}</v-btn
        >

        <slot v-if="showSubmit" name="submit-button" :on="{ click: submit }">
          <OareLoaderButton
            class="test-submit-btn"
            @click="submit"
            color="primary"
            :loading="submitLoading"
          >
            {{ submitText }}
          </OareLoaderButton>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OareDialog',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    showSubmit: {
      type: Boolean,
      default: true,
    },
    persistent: {
      type: Boolean,
      default: true,
    },
    submitText: {
      type: String,
      default: 'Submit',
    },
    cancelText: {
      type: String,
      default: 'Cancel',
    },
    submitLoading: {
      type: Boolean,
      default: false,
    },
    submitDisabled: {
      type: Boolean,
      default: false,
    },
    closeOnSubmit: {
      type: Boolean,
      default: false,
    },
  },
  setup({ closeOnSubmit }, { emit }) {
    function submit() {
      if (closeOnSubmit) {
        emit('input', false);
      }
      emit('submit');
    }

    return {
      submit,
    };
  },
});
</script>

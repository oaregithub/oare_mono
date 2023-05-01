<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :width="width"
    :persistent="persistent"
    :eager="eager"
  >
    <template v-slot:activator="{ on }">
      <slot name="activator" :on="on"></slot>
    </template>

    <v-card>
      <div v-if="closeButton || showActionsBar || actionTitle">
        <v-card-actions>
          <slot name="pre-actions" />
          <h2 class="ml-3" v-if="actionTitle">{{ actionTitle }}</h2>
          <v-spacer />
          <slot name="action-options" />
          <v-btn
            v-if="closeButton"
            @click="$emit('input', false)"
            text
            color="error"
            >Close</v-btn
          >
        </v-card-actions>
        <v-divider />
      </div>
      <v-card-title data-testid="dialog-title" class="test-dialog-title">
        <slot name="title">{{ title }}</slot>
      </v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <div
        v-if="showCancel || showSubmit"
        :class="{ 'sticky-submit': stickyAction }"
      >
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="showCancel"
            @click="$emit('input', false)"
            color="error"
            text
            :disabled="cancelDisabled"
            data-testid="cancel-btn"
            >{{ cancelText }}</v-btn
          >

          <v-btn
            v-if="showActionButton"
            @click="$emit('action')"
            color="primary"
            text
            :disabled="actionButtonDisabled"
            >{{ actionButtonText }}</v-btn
          >

          <slot v-if="showSubmit" name="submit-button" :on="{ click: submit }">
            <OareLoaderButton
              class="test-submit-btn"
              @click="submit"
              color="primary"
              :loading="submitLoading"
              :disabled="submitLoading || submitDisabled"
            >
              {{ submitText }}
            </OareLoaderButton>
          </slot>
        </v-card-actions>
      </div>
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
      default: '',
    },
    showSubmit: {
      type: Boolean,
      default: true,
    },
    showCancel: {
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
    cancelDisabled: {
      type: Boolean,
      default: false,
    },
    closeOnSubmit: {
      type: Boolean,
      default: false,
    },
    width: {
      type: Number,
      default: 500,
    },
    closeButton: {
      type: Boolean,
      default: false,
    },
    actionTitle: {
      type: String,
      required: false,
    },
    eager: {
      type: Boolean,
      default: false,
    },
    showActionsBar: {
      type: Boolean,
      defaault: false,
    },
    showActionButton: {
      type: Boolean,
      default: false,
    },
    actionButtonText: {
      type: String,
      default: 'Action',
    },
    actionButtonDisabled: {
      type: Boolean,
      default: false,
    },
    stickyAction: {
      type: Boolean,
      default: false,
    },
  },
  setup({ closeOnSubmit }, { emit }) {
    const submit = () => {
      if (closeOnSubmit) {
        emit('input', false);
      }
      emit('submit');
    };

    return {
      submit,
    };
  },
});
</script>
<style>
.sticky-submit {
  position: sticky;
  bottom: 0;
  background: white;
}
</style>

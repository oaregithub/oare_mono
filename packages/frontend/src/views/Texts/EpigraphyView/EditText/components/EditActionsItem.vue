<template>
  <v-tooltip left :disabled="canPerformAction" open-delay="500">
    <template #activator="{ on, attrs }">
      <v-list-item
        @click="canPerformAction ? $emit('set-action', action) : undefined"
        :inactive="!canPerformAction"
        :class="`test-${action}`"
        :ripple="canPerformAction"
        v-bind="attrs"
        v-on="on"
      >
        <v-list-item-content>
          <v-list-item-title
            :class="{
              'grey--text': !canPerformAction,
            }"
          >
            <v-icon small class="mr-1">{{ icon }}</v-icon>
            {{ label }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
    <span v-if="disabledMessage"> {{ disabledMessage }} </span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { EditTextAction } from '@oare/types';

export default defineComponent({
  props: {
    canPerformAction: {
      type: Boolean,
      required: true,
    },
    action: {
      type: String as PropType<EditTextAction>,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    disabledMessage: {
      type: String,
      required: false,
    },
  },
});
</script>

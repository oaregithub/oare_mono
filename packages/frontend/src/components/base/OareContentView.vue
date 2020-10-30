<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <slot name="header"></slot>

    <v-card-title
      v-if="title !== null && title !== undefined"
      class="oare-header d-flex justify-space-between align-center test-content-title"
    >
      <div class="d-flex align-center">
        <slot name="title:pre"></slot>
        <span class="font-weight-bold">{{ title }}</span>
      </div>
      <slot name="title:post"> </slot>
    </v-card-title>
    <v-card-text class="black--text">
      <slot></slot>
    </v-card-text>
    <v-card-actions>
      <slot name="actions"></slot>
    </v-card-actions>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
  name: 'OareContentView',
  props: {
    title: {
      type: String,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

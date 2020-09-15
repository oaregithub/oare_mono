<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <slot name="header"></slot>

    <v-card-title
      v-if="title"
      class="oare-header font-weight-bold d-flex justify-space-between align-start test-content-title"
    >
      {{ title }}
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

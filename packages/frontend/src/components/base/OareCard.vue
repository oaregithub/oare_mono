<template>
  <v-card class="mt-12 pa-3 mx-auto" max-width="600" elevation="24">
    <v-card-title>
      <h3 class="oare-header mb-2">{{ title }}</h3>
    </v-card-title>
    <v-card-text class="d-flex flex-column">
      <slot></slot>
    </v-card-text>

    <v-card-actions>
      <slot name="actions"></slot>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
  },
});
</script>

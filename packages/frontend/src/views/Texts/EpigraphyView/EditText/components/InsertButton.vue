<template>
  <v-hover v-slot="{ hover }">
    <v-btn
      v-if="!showCheck"
      fab
      x-small
      dark
      :elevation="hover ? 5 : 0"
      :color="hover ? 'grey darken-3' : 'grey lighten-2'"
      width="25px"
      height="25px"
      @click="$emit('insert')"
      class="test-insert-button"
    >
      <v-icon> mdi-plus </v-icon>
    </v-btn>
    <v-btn
      v-else
      fab
      x-small
      dark
      color="info"
      width="25px"
      height="25px"
      elevation="0"
      class="test-insert-button"
    >
      <v-icon> mdi-check </v-icon>
    </v-btn>
  </v-hover>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    showCheck: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    return {};
  },
});
</script>
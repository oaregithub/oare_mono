<template>
  <v-hover v-slot="{ hover }">
    <v-btn
      fab
      x-small
      dark
      :elevation="hover ? 5 : 0"
      :color="hover ? 'grey darken-3' : 'grey lighten-2'"
      width="25px"
      height="25px"
      @click="$emit('insert')"
    >
      <v-icon> mdi-plus </v-icon>
    </v-btn>
  </v-hover>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  setup() {
    return {};
  },
});
</script>
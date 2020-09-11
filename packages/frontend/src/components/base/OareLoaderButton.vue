<template>
  <v-btn v-bind="$attrs" :disabled="loading" @click="$emit('click', $event)">
    <v-progress-circular
      v-if="loading"
      indeterminate
      size="25"
      width="3"
      class="test-spinner"
    />
    <slot v-else></slot>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "OareLoaderButton",
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

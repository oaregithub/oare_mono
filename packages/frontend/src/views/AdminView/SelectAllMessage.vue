<template>
  <v-card color="grey lighten-3" class="my-2" elevation="0">
    <v-container>
      <v-row>
        <v-spacer />
        <span class="px-2"
          >All <b>{{ rows }}</b> {{ itemType.toLowerCase() }}s on this page are
          selected.</span
        >
        <a @click="emitSelectAll" class="px-2"
          >Select all {{ serverCount }} {{ itemType.toLowerCase() }}s.</a
        >
        <v-spacer />
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'SelectAllMessage',
  props: {
    itemType: {
      type: String,
      required: true,
    },
    serverCount: {
      type: Number,
      required: true,
    },
    rows: {
      type: String,
      required: true,
    },
  },
  setup({}, { emit }) {
    const emitSelectAll = () => emit('select-full-list');

    return {
      emitSelectAll,
    };
  },
});
</script>

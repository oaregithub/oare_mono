<template>
  <v-hover v-slot="{ hover }">
    <div>
      <v-row
        :class="{ 'my-1': showDivider, 'mt-1': !showDivider }"
        class="mx-1"
      >
        <v-menu offset-y>
          <template #activator="{ on, attrs }">
            <v-btn
              fab
              x-small
              dark
              :elevation="hover || !hasAddedRow ? 5 : 0"
              :color="
                hover || !hasAddedRow ? 'grey darken-3' : 'grey lighten-2'
              "
              class="ml-n5 mt-n4 test-insert-button"
              width="25px"
              height="25px"
              v-on="on"
              v-bind="attrs"
            >
              <v-icon> mdi-plus </v-icon>
            </v-btn>
          </template>
          <v-list dense>
            <v-list-item
              v-for="(option, idx) in insertOptions"
              class="test-insert-option"
              :key="idx"
              @click="$emit('add-row', option)"
            >
              <v-list-item-title>{{ option }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-row>
      <v-divider
        v-if="showDivider"
        :color="hover ? 'gray' : 'white'"
        class="mt-n4"
      />
    </div>
  </v-hover>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { RowTypes } from '@oare/types';

export default defineComponent({
  props: {
    hasAddedRow: {
      type: Boolean,
      required: true,
    },
    showDivider: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    const insertOptions = ref<RowTypes[]>([
      'Line',
      'Broken Line(s)',
      'Ruling(s)',
      'Seal Impression',
      'Broken Area',
      'Uninscribed Line(s)',
    ]);
    return {
      insertOptions,
    };
  },
});
</script>
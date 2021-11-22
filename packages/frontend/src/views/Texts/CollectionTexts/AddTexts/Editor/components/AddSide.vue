<template>
  <v-card outlined rounded :min-height="100" class="my-4">
    <v-row>
      <v-spacer />
      <v-btn
        text
        color="primary"
        @click="$emit('cancel-add-side')"
        class="ma-4"
      >
        Cancel</v-btn
      >
    </v-row>
    <v-row justify="center" class="mt-7">
      {{
        `Choose a side to ${changing ? 'change to' : 'add'}. ${
          changing ? '' : `Additional sides can be added later.`
        }`
      }}
    </v-row>
    <v-row justify="center" class="mb-12">
      <side-selector
        v-for="(side, idx) in usableSides"
        :key="idx"
        :side="side"
        @selected="$emit('side-selected', side)"
        class="ma-2 cursor-display test-side-option"
      />
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { SideOption } from '@oare/types';
import { defineComponent, PropType } from '@vue/composition-api';
import SideSelector from './SideSelector.vue';

export default defineComponent({
  props: {
    usableSides: {
      type: Array as PropType<SideOption[]>,
      required: true,
    },
    changing: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    SideSelector,
  },
  setup() {
    return {};
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>

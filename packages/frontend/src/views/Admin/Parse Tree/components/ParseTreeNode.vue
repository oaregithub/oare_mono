<template>
  <v-expansion-panels focusable flat v-if="node.children">
    <v-expansion-panel
      v-for="child in node.children"
      :key="child.uuid"
      :disabled="!child.children"
    >
      <v-expansion-panel-header class="font-weight-bold">
        {{ child.variableName || child.valueName }}
        <div class="text--disabled">
          &nbsp;
          <span v-if="child.varAbbreviation"
            >({{ child.varAbbreviation }})</span
          >
          <span v-else-if="child.valAbbreviation">
            ({{ child.valAbbreviation }})</span
          >
        </div>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <parse-tree-node :node="child" />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { ParseTree } from '@oare/types';

export default defineComponent({
  name: 'ParseTreeNode',
  props: {
    node: {
      type: Object as PropType<ParseTree>,
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>
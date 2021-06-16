<template>
  <v-expansion-panels focusable flat v-if="node.children">
    <v-expansion-panel
      v-for="child in node.children"
      :key="child.uuid"
      :readonly="!child.children"
    >
      <v-expansion-panel-header :disable-icon-rotate="allowSelections">
        <template #default="{ open }">
          <v-checkbox
            v-if="!child.children && child.valueName && allowSelections"
            class="mt-0 pt-0"
            hide-details
            v-model="selected"
            :value="child"
          >
            <template #label>
              {{ child.valueName }}
              <span class="text--disabled">
                &nbsp;
                <span v-if="child.valAbbreviation">
                  ({{ child.valAbbreviation }})</span
                >
              </span>
            </template>
          </v-checkbox>
          <template v-else>
            <span>
              <template v-if="allowSelections">
                <v-icon v-if="open">mdi-chevron-up</v-icon>
                <v-icon v-else>mdi-chevron-down</v-icon>
              </template>
              {{ child.variableName || child.valueName }}
              <span class="text--disabled">
                &nbsp;
                <span v-if="child.varAbbreviation"
                  >({{ child.varAbbreviation }})</span
                >
                <span v-else-if="child.valAbbreviation">
                  ({{ child.valAbbreviation }})</span
                >
              </span>
            </span>
          </template>
        </template>
        <template #actions>
          <v-icon v-if="!child.children"></v-icon>
          <v-icon v-else-if="showCheck(child) && allowSelections" color="green"
            >mdi-check-circle-outline</v-icon
          >
          <template v-else-if="allowSelections">
            <v-checkbox
              label="Ignore"
              hide-details
              class="mt-0 pt-0 mr-3"
              dense
              @click.native="$event.cancelBubble = true"
              v-model="ignoredSubtrees"
              :value="child"
            ></v-checkbox>
            <v-menu
              offset-y
              open-on-hover
              v-if="!ignoredSubtrees.includes(child)"
            >
              <template #activator="{ on, attrs }">
                <v-icon color="orange" v-bind="attrs" v-on="on"
                  >mdi-information-outline
                </v-icon></template
              ><v-card class="pa-1"
                >This subtree has not been completed</v-card
              ></v-menu
            >
            <v-icon v-else color="green">mdi-check-circle-outline</v-icon>
          </template>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <parse-tree-node
          :node="child"
          :allowSelections="allowSelections"
          @update:node="updateCompletedSubtrees"
          @update:properties="updateProperties"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  watch,
  computed,
} from '@vue/composition-api';
import { ParseTree } from '@oare/types';

export default defineComponent({
  name: 'ParseTreeNode',
  props: {
    node: {
      type: Object as PropType<ParseTree>,
      required: true,
    },
    allowSelections: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const selected = ref<ParseTree[]>([]);
    const completedSubtrees = ref<ParseTree[]>([]);
    const ignoredSubtrees = ref<ParseTree[]>([]);

    const nodeComplete = computed(() => {
      const numSubtrees = props.node.children
        ? props.node.children.filter(child => child.children).length
        : 0;
      const itemSelected =
        props.node.children &&
        props.node.children.filter(child => !child.children).length > 0
          ? selected.value.length > 0
          : true;
      return (
        itemSelected &&
        numSubtrees ===
          completedSubtrees.value.length + ignoredSubtrees.value.length
      );
    });

    watch(nodeComplete, () => {
      emit('update:node', {
        node: props.node,
        status: nodeComplete.value,
      });
    });

    const updateCompletedSubtrees = (args: {
      node: ParseTree;
      status: boolean;
    }) => {
      if (args.status) {
        completedSubtrees.value.push(args.node);
      } else {
        completedSubtrees.value = completedSubtrees.value.filter(
          node => node !== args.node
        );
      }
    };

    const showCheck = (node: ParseTree) =>
      completedSubtrees.value.includes(node);

    const properties = ref<
      {
        properties: { variable: ParseTree; value: ParseTree }[];
        source: ParseTree;
      }[]
    >([]);

    watch([selected, properties], () => {
      emit('update:properties', {
        properties: [
          ...selected.value.map(value => ({
            variable: props.node,
            value,
          })),
          ...properties.value.flatMap(prop => prop.properties),
        ],
        source: props.node,
      });
    });

    const updateProperties = (args: {
      properties: { variable: ParseTree; value: ParseTree }[];
      source: ParseTree;
    }) => {
      properties.value = properties.value.filter(
        prop => prop.source !== args.source && prop.source !== props.node
      );
      properties.value.push(args);
      const subProperties = properties.value.flatMap(prop => prop.properties);
      if (props.node.variableUuid && subProperties.length > 0) {
        properties.value.push({
          properties: [
            {
              variable: props.node,
              value: args.source,
            },
          ],
          source: props.node,
        });
      }
    };

    return {
      selected,
      ignoredSubtrees,
      showCheck,
      updateCompletedSubtrees,
      updateProperties,
    };
  },
});
</script>
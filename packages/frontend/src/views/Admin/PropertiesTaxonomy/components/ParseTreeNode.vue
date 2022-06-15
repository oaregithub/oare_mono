<template>
  <v-expansion-panels
    focusable
    flat
    v-if="node.children"
    multiple
    :active-class="wordsInTextSearch ? '' : 'v-item--active'"
    v-model="openPanels"
  >
    <v-expansion-panel
      v-for="(child, idx) in node.children"
      :key="child.uuid"
      :readonly="!child.children"
    >
      <v-expansion-panel-header
        :disable-icon-rotate="allowSelections"
        :hide-actions="wordsInTextSearch"
      >
        <template #default="{ open }">
          <v-checkbox
            v-if="!child.children && child.valueName && allowSelections"
            class="mt-0 pt-0"
            hide-details
            v-model="selected"
            :value="child"
            :disabled="
              disableChildren && !selected.includes(child) && !wordsInTextSearch
            "
            @change="$emit('child-selected')"
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
                <v-icon v-if="open && child.children">mdi-chevron-up</v-icon>
                <v-icon v-else-if="!open && child.children"
                  >mdi-chevron-down</v-icon
                >
                <v-menu v-else offset-y open-on-hover bottom>
                  <template #activator="{ on, attrs }">
                    <v-icon
                      small
                      v-bind="attrs"
                      v-on="on"
                      class="pa-1"
                      color="red"
                      >mdi-block-helper</v-icon
                    >
                  </template>
                  <v-card class="pa-3">
                    <span> Not available. Coming soon. </span>
                  </v-card>
                </v-menu>
              </template>
              <mark v-if="nodesToHighlight.includes(child.uuid)">
                {{ child.variableName || child.valueName || child.aliasName }}
              </mark>
              <span v-else>
                {{ child.variableName || child.valueName || child.aliasName }}
              </span>
              <i
                v-if="
                  !child.variableName && !child.valueName && !child.aliasName
                "
                >NO NAME</i
              >
              <b
                v-if="open && child.custom === 1 && !wordsInTextSearch"
                class="text--disabled ml-7"
                ><br />Only one selection permitted</b
              >
              <span class="text--disabled">
                &nbsp;
                <span v-if="child.varAbbreviation"
                  >({{ child.varAbbreviation }})
                </span>
                <span v-else-if="child.valAbbreviation">
                  ({{ child.valAbbreviation }})</span
                >
                <span
                  v-if="!open && allowSelections && child.variableUuid"
                  class="info--text"
                >
                  {{ selectionDisplay[child.variableUuid] }}
                </span>
                <span
                  v-if="showUUID && !allowSelections"
                  class="blue--text mr-3"
                  >UUID: {{ child.uuid }}
                  <v-btn icon @click="copyUUID(child.uuid)" @click.native.stop>
                    <v-icon small>mdi-content-copy</v-icon>
                  </v-btn>
                </span>
                <span v-if="showUUID && !allowSelections">
                  <span v-if="child.variableUuid" class="blue--text">
                    Variable UUID: {{ child.variableUuid }}
                    <v-btn
                      icon
                      @click="copyUUID(child.variableUuid || '')"
                      @click.native.stop
                      ><v-icon small>mdi-content-copy </v-icon>
                    </v-btn>
                  </span>
                  <span v-else class="blue--text">
                    Value UUID: {{ child.valueUuid }}
                    <v-btn
                      icon
                      @click="copyUUID(child.valueUuid || '')"
                      @click.native.stop
                    >
                      <v-icon small>mdi-content-copy</v-icon>
                    </v-btn>
                  </span>
                </span>
              </span>
            </span>
          </template>
        </template>
        <template #actions v-if="!wordsInTextSearch">
          <v-icon v-if="!child.children"></v-icon>
          <v-icon v-else-if="showCheck(child) && allowSelections" color="green"
            >mdi-check-circle-outline</v-icon
          >
          <template v-else-if="allowSelections">
            <v-checkbox
              label="Ignore"
              hide-details
              class="mt-0 pt-0 mr-3 test-ignore"
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
      <v-expansion-panel-content eager>
        <parse-tree-node
          :node="child"
          :allowSelections="allowSelections"
          :nodesToHighlight="nodesToHighlight"
          :openSearchResults="openSearchResults"
          :existingProperties="existingProperties"
          :showUUID="showUUID"
          :wordsInTextSearch="wordsInTextSearch"
          @update:node="updateCompletedSubtrees"
          @update:properties="updateProperties"
          @update:selection-display="
            setSelectionDisplay($event, child.variableUuid)
          "
          @child-selected="handleSelections(child, idx)"
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
  onMounted,
} from '@vue/composition-api';
import { TaxonomyTree, ParseTreeProperty, ItemPropertyRow } from '@oare/types';
import sl from '@/serviceLocator';

export interface ParseTreePropertyEvent {
  properties: ParseTreeProperty[];
  source: TaxonomyTree;
}

export default defineComponent({
  name: 'ParseTreeNode',
  props: {
    node: {
      type: Object as PropType<TaxonomyTree>,
      required: true,
    },
    allowSelections: {
      type: Boolean,
      default: false,
    },
    nodesToHighlight: {
      type: Array as PropType<String[]>,
      default: () => [],
    },
    openSearchResults: {
      type: Boolean,
      default: false,
    },
    existingProperties: {
      type: Array as PropType<ItemPropertyRow[]>,
      required: false,
    },
    showUUID: {
      type: Boolean,
      default: false,
    },
    wordsInTextSearch: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const selected = ref<TaxonomyTree[]>([]);
    const completedSubtrees = ref<TaxonomyTree[]>([]);
    const ignoredSubtrees = ref<TaxonomyTree[]>([]);
    const actions = sl.get('globalActions');

    onMounted(() => {
      if (props.existingProperties && props.node.variableUuid) {
        const childrenValueUuids = props.node.children
          ? props.node.children
              .map(child => child.valueUuid)
              .filter(valueUuid => valueUuid)
          : [];
        const childLevel = props.node.children
          ? props.node.children[0].level
          : null;
        const relevantExistingProperties = props.existingProperties.filter(
          prop => {
            const parentProperty = props.existingProperties
              ? props.existingProperties.filter(
                  exis => exis.uuid === prop.parentUuid
                ).length > 0
                ? props.existingProperties.filter(
                    exis => exis.uuid === prop.parentUuid
                  )[0]
                : undefined
              : undefined;

            const hasValidParentRelationship = parentProperty
              ? props.node.objParentUuid === parentProperty.valueUuid
              : true;

            return (
              prop.variableUuid === props.node.variableUuid &&
              childrenValueUuids.includes(prop.valueUuid) &&
              prop.level === childLevel &&
              hasValidParentRelationship
            );
          }
        );
        const childrenToBeSelected = props.node.children
          ? props.node.children.filter(
              child =>
                child.valueUuid &&
                !child.children &&
                relevantExistingProperties
                  .map(prop => prop.valueUuid)
                  .includes(child.valueUuid)
            )
          : [];

        childrenToBeSelected.forEach(child => {
          selected.value.push(child);
        });
      }
    });

    const nodeComplete = computed(() => {
      const numSubtrees = props.node.children
        ? props.node.children.filter(child => child.children).length
        : 0;
      const itemSelected =
        props.node.children &&
        props.node.children.filter(child => !child.children).length > 0
          ? selected.value.length > 0
          : true;
      if (numSubtrees === 0) {
        return itemSelected;
      } else {
        return (
          numSubtrees <=
          completedSubtrees.value.length + ignoredSubtrees.value.length
        );
      }
    });

    watch(nodeComplete, () => {
      emit('update:node', {
        node: props.node,
        status: nodeComplete.value,
      });
    });

    const updateCompletedSubtrees = (args: {
      node: TaxonomyTree;
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

    const showCheck = (node: TaxonomyTree) =>
      completedSubtrees.value.includes(node);

    const properties = ref<ParseTreePropertyEvent[]>([]);

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

    watch(selected, () => {
      emit(
        'update:selection-display',
        selected.value.map(val => val.valueName || val.aliasName).join(', ')
      );
    });
    const selectionDisplay = ref<{ [key: string]: string }>({});
    const setSelectionDisplay = (
      display: string,
      variableUuid: string | null
    ) => {
      if (variableUuid) {
        selectionDisplay.value[variableUuid] = display;
      }
    };

    const copyUUID = (uuid: string) => {
      navigator.clipboard.writeText(uuid);
      actions.showSnackbar('Copied Successfully');
    };

    const updateProperties = (args: ParseTreePropertyEvent) => {
      properties.value = properties.value.filter(
        prop => prop.source !== args.source
      );
      properties.value = properties.value.map(prop => {
        if (prop.source === props.node) {
          const filteredProps = prop.properties.filter(
            subProp => subProp.value !== args.source
          );
          return {
            ...prop,
            properties: filteredProps,
          };
        }
        return prop;
      });
      properties.value.push(args);
      if (props.node.variableUuid && args.properties.length > 0) {
        properties.value.unshift({
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

    watch(
      () => props.openSearchResults,
      () => {
        if (props.node.children) {
          props.node.children.forEach((child, idx) => {
            if (props.nodesToHighlight.includes(child.uuid)) {
              openPanels.value.push(idx);
            }
          });
        }
      }
    );

    const disableChildren = computed(() => {
      return selected.value.length > 0 && props.node.custom === 1;
    });

    const openPanels = ref<number[]>([]);

    const handleSelections = (child: TaxonomyTree, idx: number) => {
      if (child.custom === 1) {
        const indexToRemove = openPanels.value.indexOf(idx);
        openPanels.value.splice(indexToRemove, 1);
        openPanels.value.push(idx + 1);
      }
    };

    return {
      selected,
      ignoredSubtrees,
      showCheck,
      updateCompletedSubtrees,
      updateProperties,
      copyUUID,
      disableChildren,
      selectionDisplay,
      setSelectionDisplay,
      openPanels,
      handleSelections,
    };
  },
});
</script>

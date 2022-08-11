<template>
  <v-expansion-panels
    focusable
    flat
    v-if="node.children"
    multiple
    v-model="openPanels"
  >
    <v-expansion-panel
      v-for="(child, idx) in node.children"
      :key="child.uuid"
      :readonly="!child.children"
    >
      <v-expansion-panel-header
        :disable-icon-rotate="allowSelections"
        :hide-actions="hideActions"
      >
        <template #default="{ open }">
          <v-row
            class="ma-0"
            v-if="child.valueName && allowSelections"
            align="center"
          >
            <v-checkbox
              class="mt-0 pt-0"
              hide-details
              v-model="selected"
              :value="child"
              :disabled="
                (disableChildren && !selected.includes(child)) ||
                properties.filter(
                  prop =>
                    prop.sourceUuid === child.uuid && prop.properties.length > 0
                ).length > 0
              "
              @change="$emit('child-selected')"
              @click.stop
            >
            </v-checkbox>
            <span>
              {{ child.valueName }}
              <span class="text--disabled">
                &nbsp;
                <span v-if="child.valAbbreviation">
                  ({{ child.valAbbreviation }})</span
                >
              </span>
            </span>
          </v-row>
          <template v-else>
            <span>
              <template v-if="allowSelections && !child.children">
                <v-menu offset-y open-on-hover bottom>
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
              <property-info
                v-if="
                  (child.variableUuid || child.valueUuid) &&
                  showFieldInfo &&
                  child.fieldInfo
                "
                :name="
                  child.variableName ||
                  child.valueName ||
                  child.aliasName ||
                  'No Name'
                "
                :description="child.fieldInfo.field || ''"
                :primacy="child.fieldInfo.primacy || 0"
                :fieldUuid="child.fieldInfo.uuid || ''"
                :language="
                  child.fieldInfo.language === 'default'
                    ? 'English'
                    : child.fieldInfo.language || 'n/a'
                "
                :type="child.variableType || ''"
                :tableReference="child.variableTableReference || ''"
                :variableOrValueUuid="
                  child.variableUuid || child.valueUuid || ''
                "
              ></property-info>
              <b
                v-if="
                  open &&
                  child.custom === 1 &&
                  !selectMultiple &&
                  allowSelections
                "
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
                  {{
                    selectionDisplay
                      .filter(disp => disp.variableUuid === child.variableUuid)
                      .map(disp => disp.display)[0]
                  }}
                </span>
                <span
                  v-if="showUUID && !allowSelections"
                  class="info--text mr-3"
                  >UUID: {{ child.uuid }}
                  <v-btn icon @click="copyUUID(child.uuid)" @click.native.stop>
                    <v-icon small>mdi-content-copy</v-icon>
                  </v-btn>
                </span>
                <span v-if="showUUID && !allowSelections">
                  <span v-if="child.variableUuid" class="info--text">
                    Variable UUID: {{ child.variableUuid }}
                    <v-btn
                      icon
                      @click="copyUUID(child.variableUuid || '')"
                      @click.native.stop
                      ><v-icon small>mdi-content-copy </v-icon>
                    </v-btn>
                  </span>
                  <span v-else class="info--text">
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
        <template #actions v-if="!hideActions">
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
          <v-icon v-if="openPanels.includes(idx) && child.children"
            >mdi-chevron-up</v-icon
          >
          <v-icon v-else-if="!openPanels.includes(idx) && child.children"
            >mdi-chevron-down</v-icon
          >
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
          :hideActions="hideActions"
          :selectMultiple="selectMultiple"
          :showFieldInfo="showFieldInfo"
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
import PropertyInfo from './PropertyInfo.vue';
import { TaxonomyTree, ParseTreeProperty, ItemPropertyRow } from '@oare/types';
import sl from '@/serviceLocator';

export interface ParseTreePropertyEvent {
  properties: ParseTreeProperty[];
  sourceUuid: string;
}

export default defineComponent({
  name: 'ParseTreeNode',
  components: {
    PropertyInfo,
  },
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
    hideActions: {
      type: Boolean,
      default: false,
    },
    selectMultiple: {
      type: Boolean,
      default: false,
    },
    showFieldInfo: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');

    const selected = ref<TaxonomyTree[]>([]);
    const completedSubtrees = ref<TaxonomyTree[]>([]);
    const ignoredSubtrees = ref<TaxonomyTree[]>([]);

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
        sourceUuid: props.node.uuid,
      });
    });

    watch(selected, () => {
      emit(
        'update:selection-display',
        selected.value.map(val => val.valueName || val.aliasName).join(', ')
      );
    });

    const selectionDisplay = ref<{ display: string; variableUuid: string }[]>(
      []
    );
    const setSelectionDisplay = (
      display: string,
      variableUuid: string | null
    ) => {
      if (variableUuid) {
        selectionDisplay.value = selectionDisplay.value.filter(
          disp => disp.variableUuid !== variableUuid
        );
        selectionDisplay.value.push({ display, variableUuid });
      }
    };

    const copyUUID = (uuid: string) => {
      navigator.clipboard.writeText(uuid);
      actions.showSnackbar('Copied Successfully');
    };

    const updateProperties = (args: ParseTreePropertyEvent) => {
      properties.value = properties.value.filter(
        prop => prop.sourceUuid !== args.sourceUuid
      );
      properties.value = properties.value.map(prop => {
        if (prop.sourceUuid === props.node.uuid) {
          const filteredProps = prop.properties.filter(
            subProp => subProp.value.uuid !== args.sourceUuid
          );
          return {
            ...prop,
            properties: filteredProps,
          };
        }
        return prop;
      });
      properties.value.push(args);
      if (
        props.node.variableUuid &&
        args.properties.length > 0 &&
        props.node.children &&
        !selected.value
          .map(selection => selection.uuid)
          .includes(args.sourceUuid)
      ) {
        selected.value.push(
          props.node.children.filter(child => {
            return child.uuid === args.sourceUuid;
          })[0]
        );
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
      properties,
    };
  },
});
</script>

<template>
  <v-progress-linear v-if="loading" indeterminate />
  <v-row v-else>
    <v-col v-if="!readonly" cols="4">
      <h3 class="primary--text mb-5">
        Properties
        <v-menu offset-y open-on-hover v-if="!isShowingWholeTree">
          <template #activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="ml-1" small>
              mdi-information-outline
            </v-icon>
          </template>
          <v-card class="pa-3" width="400">
            This summary of item properties does not necessarily contain all
            properties assigned to this item. Any assigned properties
            originating from a higher part of the taxonomy tree may not appear
            here.
            <span v-if="isAdmin"
              >You can use the "Show Whole Tree" button to view those portions
              of the tree and their associated properties.</span
            >
          </v-card>
        </v-menu>
      </h3>

      <span v-if="appliedProperties.length === 0">No Properties Selected</span>

      <properties-display :properties="appliedProperties" />
    </v-col>
    <v-col :cols="readonly ? 12 : 8">
      <v-row class="ma-0">
        <h3 v-if="!readonly" class="primary--text">Select Properties</h3>

        <v-spacer />

        <v-btn
          v-if="!readonly && isAdmin && !isShowingWholeTree"
          @click="showWholeTree"
          text
          color="info"
          class="mr-2"
          small
        >
          <v-icon x-small class="mr-1">mdi-arrow-expand-up</v-icon>Show Whole
          Tree</v-btn
        >
      </v-row>

      <v-expansion-panels :flat="!readonly" v-model="panel" class="test-tree">
        <v-expansion-panel readonly>
          <v-expansion-panel-header class="font-weight-bold" hide-actions>
            {{ treeTitle }}
          </v-expansion-panel-header>
          <v-expansion-panel-content
            :eager="!!existingProperties || !!valuesToPreselect"
          >
            <v-expansion-panels
              v-if="variablesToDisplay"
              flat
              v-model="openPanels"
              focusable
            >
              <property-variable-display
                v-for="(variable, idx) in variablesToDisplay"
                :key="variable.hierarchy.uuid"
                :variable="variable"
                :showUuid="showUuid"
                :nodesToHighlight="nodesToHighlight"
                :openSearchResults="openSearchResults"
                @update-properties="updateProperties($event, variable)"
                @completed="handleCompleted(variable.hierarchy.uuid, $event)"
                @ignored="handleIgnored(idx, $event)"
                :readonly="readonly"
                :overrideCustom="overrideCustom"
                :showValidation="showValidation"
                :existingProperties="existingProperties"
                :valuesToPreselect="valuesToPreselect"
              />
            </v-expansion-panels>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  watch,
  computed,
  PropType,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import {
  AppliedProperty,
  HierarchyTopNode,
  PropertyValue,
  PropertyVariable,
  TaxonomyPropertyTree,
  ItemPropertyRow,
  PreselectionProperty,
} from '@oare/types';
import PropertyVariableDisplay from './PropertyVariableDisplay.vue';
import PropertiesDisplay from './PropertiesDisplay.vue';

export default defineComponent({
  props: {
    showUuid: {
      type: Boolean,
      default: false,
    },
    search: {
      type: String,
      required: false,
    },
    readonly: {
      type: Boolean,
      required: true,
    },
    startingValueHierarchyUuid: {
      type: String,
      required: false,
    },
    overrideCustom: {
      type: Boolean,
      default: false,
    },
    showValidation: {
      type: Boolean,
      default: true,
    },
    existingProperties: {
      type: Array as PropType<ItemPropertyRow[]>,
      required: false,
    },
    valuesToPreselect: {
      type: Array as PropType<PreselectionProperty[]>,
      required: false,
    },
  },
  components: {
    PropertyVariableDisplay,
    PropertiesDisplay,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const store = sl.get('store');

    const loading = ref(false);
    const variablesToDisplay = ref<PropertyVariable[]>([]);
    const treeTitle = ref('');

    const panel = ref(0);

    const taxonomyTree = ref<TaxonomyPropertyTree>();

    const isAdmin = computed(() => store.getters.isAdmin);

    onMounted(async () => {
      try {
        loading.value = true;
        taxonomyTree.value = await server.getTaxonomyPropertyTree();
        variablesToDisplay.value = getStartingVariables(
          taxonomyTree.value.tree,
          props.startingValueHierarchyUuid
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading properties taxonomy. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const searchPaths = ref<string[][]>([]);
    const existingFinds = ref<string[]>([]);

    watch(
      () => props.search,
      _.debounce(() => {
        searchPaths.value = [];
        existingFinds.value = [];
        if (taxonomyTree.value && props.search) {
          let result:
            | HierarchyTopNode
            | PropertyValue
            | PropertyVariable
            | null = taxonomyTree.value.tree;
          while (result) {
            result = searchTree(
              taxonomyTree.value.tree,
              props.search,
              existingFinds.value
            );
            if (result) {
              existingFinds.value.push(result.hierarchy.uuid);
            }
          }
        }
      }, 500)
    );

    const searchTree = (
      node: PropertyVariable | PropertyValue | HierarchyTopNode,
      searchValue: string,
      existingFinds: string[]
    ): PropertyVariable | PropertyValue | HierarchyTopNode | null => {
      if (
        node.name &&
        node.name.toLowerCase().includes(searchValue.toLowerCase()) &&
        !existingFinds.includes(node.hierarchy.uuid)
      ) {
        searchPaths.value.push([node.hierarchy.uuid]);
        return node;
      } else if (
        (node as PropertyVariable).values &&
        (node as PropertyVariable).values.length > 0
      ) {
        let result = null;
        for (
          let i = 0;
          result === null && i < (node as PropertyVariable).values.length;
          i++
        ) {
          result = searchTree(
            (node as PropertyVariable).values[i],
            searchValue,
            existingFinds
          );
          if (result) {
            searchPaths.value[0].unshift(node.hierarchy.uuid);
          }
        }
        return result;
      } else if (
        (node as PropertyValue).variables &&
        (node as PropertyValue).variables.length > 0
      ) {
        let result = null;
        for (
          let i = 0;
          result === null && i < (node as PropertyValue).variables.length;
          i++
        ) {
          result = searchTree(
            (node as PropertyValue).variables[i],
            searchValue,
            existingFinds
          );
          if (result) {
            searchPaths.value[0].unshift(node.hierarchy.uuid);
          }
        }
        return result;
      }
      return null;
    };

    const nodesToHighlight = computed(() =>
      searchPaths.value.flatMap(path => path)
    );
    const openSearchResults = computed(() => searchPaths.value.length === 1);

    const openPanels = ref<number>();

    watch(
      openSearchResults,
      () => {
        if (openSearchResults.value && variablesToDisplay.value) {
          variablesToDisplay.value.forEach((variable, idx) => {
            if (
              nodesToHighlight.value.includes(variable.hierarchy.uuid) &&
              variable.values.length > 0
            ) {
              openPanels.value = idx;
            }
          });
        } else {
          openPanels.value = undefined;
        }
      },
      { immediate: true }
    );

    const appliedProperties = ref<AppliedProperty[]>([]);
    const updateProperties = (
      childProperties: AppliedProperty[],
      variable: PropertyVariable
    ) => {
      appliedProperties.value = appliedProperties.value.filter(
        p => p.sourceUuid !== variable.hierarchy.uuid
      );
      appliedProperties.value.push(...childProperties);
    };

    const completedSubtrees = ref<string[]>([]);

    const handleCompleted = (uuid: string, isCompleted: boolean) => {
      if (isCompleted) {
        completedSubtrees.value.push(uuid);
      } else {
        completedSubtrees.value = completedSubtrees.value.filter(
          u => u !== uuid
        );
      }
    };
    const handleIgnored = (idx: number, isIgnored: boolean) => {
      if (isIgnored && idx === openPanels.value) {
        openPanels.value = undefined;
      }
    };

    const treeComplete = computed(() => {
      if (!variablesToDisplay.value) {
        return false;
      }
      const numSubtrees = variablesToDisplay.value.filter(
        variable => variable.values.length > 0
      ).length;
      const numSubvariablesWithoutSubtrees = variablesToDisplay.value.filter(
        variable => variable.values.length === 0
      ).length;
      return (
        numSubtrees + numSubvariablesWithoutSubtrees ===
        completedSubtrees.value.length
      );
    });

    watch(appliedProperties, () =>
      emit('set-properties', appliedProperties.value)
    );
    watch(treeComplete, () => emit('set-complete', treeComplete.value));

    const getStartingVariables = (
      tree: HierarchyTopNode,
      startingUuid?: string
    ): PropertyVariable[] => {
      if (!startingUuid) {
        treeTitle.value = tree.name || '';
        return tree.variables;
      }
      const matchingStartingValue = searchForValue(tree, startingUuid);
      treeTitle.value = matchingStartingValue
        ? matchingStartingValue.name || ''
        : '';
      return matchingStartingValue ? matchingStartingValue.variables : [];
    };
    const searchForValue = (
      child: PropertyVariable | PropertyValue | HierarchyTopNode,
      valueHierarchyUuid: string
    ): PropertyValue | null => {
      if (child.hierarchy.uuid === valueHierarchyUuid) {
        return child as PropertyValue;
      } else if (
        (child as PropertyVariable).values &&
        (child as PropertyVariable).values.length > 0
      ) {
        let result: PropertyValue | null = null;
        for (
          let i = 0;
          result === null && i < (child as PropertyVariable).values.length;
          i++
        ) {
          result = searchForValue(
            (child as PropertyVariable).values[i],
            valueHierarchyUuid
          );
          if (result) {
            appliedProperties.value.unshift({
              variableRow: child as PropertyVariable,
              valueRow: (child as PropertyVariable).values[i],
              value: null,
              sourceUuid: (child as PropertyVariable).hierarchy.uuid,
              objectUuid: null,
              objectDisplay: null,
            });
          }
        }
        return result;
      } else if (
        (child as PropertyValue).variables &&
        (child as PropertyValue).variables.length > 0
      ) {
        let result: PropertyValue | null = null;
        for (
          let i = 0;
          result === null && i < (child as PropertyValue).variables.length;
          i++
        ) {
          result = searchForValue(
            (child as PropertyValue).variables[i],
            valueHierarchyUuid
          );
        }
        return result;
      }
      return null;
    };

    const showWholeTree = () => {
      if (taxonomyTree.value) {
        appliedProperties.value = [];
        variablesToDisplay.value = getStartingVariables(
          taxonomyTree.value.tree
        );
        isShowingWholeTree.value = true;
      }
    };
    const isShowingWholeTree = ref(
      props.startingValueHierarchyUuid ? false : true
    );

    return {
      loading,
      panel,
      searchPaths,
      nodesToHighlight,
      openSearchResults,
      openPanels,
      appliedProperties,
      updateProperties,
      completedSubtrees,
      handleCompleted,
      handleIgnored,
      treeComplete,
      variablesToDisplay,
      treeTitle,
      showWholeTree,
      isAdmin,
      isShowingWholeTree,
      taxonomyTree,
    };
  },
});
</script>


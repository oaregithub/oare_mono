<template>
  <v-progress-linear v-if="loading" indeterminate />
  <v-row v-else>
    <v-col cols="4">
      <h3 class="primary--text mb-5">
        Properties<v-menu
          v-if="existingProperties && !hideInfo"
          offset-y
          open-on-hover
        >
          <template #activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1" small>
              mdi-information-outline
            </v-icon>
          </template>
          <v-card class="pa-3" width="400">
            This summary of item properties does not necessarily contain all
            properties assigned to this item. Any assigned properties
            originating from a higher part of the taxonomy tree may not appear
            here unless you use the "Move Up Tree Level" button to view those
            portions of the tree.
          </v-card>
        </v-menu>
      </h3>
      <v-chip
        v-for="(property, index) in propertyList"
        :key="index"
        class="my-1 mr-1"
        color="info"
        outlined
        :title="propertyText(property)"
        >{{ propertyText(property) }}</v-chip
      >
    </v-col>
    <v-col cols="8">
      <h3 class="primary--text">Select Properties</h3>
      <oare-dialog
        v-model="expandDialog"
        title="Are you sure?"
        submitText="Yes"
        cancelText="No"
        closeOnSubmit
        @submit="expandUpward"
        ><div class="mb-12">
          Moving up a tree level will clear all unsaved properties selections
          and force you to start over. Any previously saved properties will
          persist. Are you sure you'd like to continue?
        </div>
        <div class="grey--text mt-2 mb-n2">
          Note: Expanding the tree may take a few moments. Please wait.
        </div>
      </oare-dialog>
      <v-tooltip
        bottom
        open-delay="800"
        v-if="
          filteredTree && filteredTree.role !== 'tree' && !disableMoveUpTree
        "
      >
        <template #activator="{ on, attrs }">
          <v-btn
            @click="expandDialog = true"
            text
            color="info"
            class="mt-2"
            small
            v-bind="attrs"
            v-on="on"
          >
            <v-icon small class="mr-1">mdi-arrow-up</v-icon>Move up tree
            level</v-btn
          >
        </template>
        <span
          >If you'd like to access properties above the current starting point,
          <br />
          click this button to move the starting point one level up the
          tree.</span
        >
      </v-tooltip>
      <v-expansion-panels flat v-model="panel">
        <v-expansion-panel>
          <v-expansion-panel-header class="font-weight-bold">{{
            filteredTree
              ? filteredTree.valueName ||
                filteredTree.variableName ||
                filteredTree.aliasName
              : ''
          }}</v-expansion-panel-header>
          <v-expansion-panel-content eager>
            <parse-tree-node
              v-if="filteredTree"
              :node="filteredTree"
              :existingProperties="existingProperties"
              :hideActions="hideActions"
              :selectMultiple="selectMultiple"
              allowSelections
              @update:node="formComplete = $event.status"
              @update:properties="updateProperties"
              class="test-tree"
              :key="filteredTree.objectUuid"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
  ComputedRef,
  watch,
  PropType,
} from '@vue/composition-api';
import { TaxonomyTree, ParseTreeProperty, ItemPropertyRow } from '@oare/types';
import ParseTreeNode, {
  ParseTreePropertyEvent,
} from '@/views/Admin/PropertiesTaxonomy/components/ParseTreeNode.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'AddProperties',
  components: {
    ParseTreeNode,
  },
  props: {
    startingUuid: {
      type: String,
      required: false,
    },
    requiredNodeValueName: {
      type: String,
      required: false,
    },
    existingProperties: {
      type: Array as PropType<ItemPropertyRow[]>,
      required: false,
    },
    hideActions: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectMultiple: {
      type: Boolean,
      required: false,
      default: false,
    },
    hideInfo: {
      type: Boolean,
      required: false,
      default: false,
    },
    disableMoveUpTree: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);
    const panel = ref(0);
    const formComplete = ref(false);
    const taxonomyTree = ref<TaxonomyTree | null>(null);
    const filteredTree = ref<TaxonomyTree | null>(null);
    const properties = ref<ParseTreePropertyEvent[]>([]);
    const foundRequiredNode = ref(props.requiredNodeValueName ? false : true);

    onMounted(async () => {
      try {
        loading.value = true;
        taxonomyTree.value = await server.getTaxonomyTree();
        filteredTree.value = props.startingUuid
          ? searchTree(taxonomyTree.value, props.startingUuid)
          : taxonomyTree.value;
        if (filteredTree.value && !filteredTree.value.children) {
          formComplete.value = true;
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading parse tree. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const searchTree = (
      node: TaxonomyTree,
      startingUuid: string
    ): TaxonomyTree | null => {
      if (
        (node.variableUuid === startingUuid ||
          node.valueUuid === startingUuid ||
          node.objectUuid === startingUuid) &&
        foundRequiredNode.value
      ) {
        return node;
      } else if (node.children !== null) {
        let result: TaxonomyTree | null = null;

        if (
          props.requiredNodeValueName &&
          node.valueName === props.requiredNodeValueName
        ) {
          foundRequiredNode.value = true;
        }

        for (let i = 0; result === null && i < node.children.length; i++) {
          result = searchTree(node.children[i], startingUuid);
          if (result && node.children[i].valueUuid) {
            properties.value.unshift({
              properties: [{ variable: node, value: node.children[i] }],
              sourceUuid: node.uuid,
            });
          }
        }
        return result;
      }
      return null;
    };

    const updateProperties = (args: ParseTreePropertyEvent) => {
      properties.value = properties.value.filter(
        prop => prop.sourceUuid !== args.sourceUuid
      );
      properties.value.push(args);
    };

    const propertyList: ComputedRef<ParseTreeProperty[]> = computed(() => {
      const combinedProperties = properties.value.flatMap(
        prop => prop.properties
      );
      const combinedPropertiesWithoutChildren = combinedProperties.map(
        prop => ({
          variable: {
            ...prop.variable,
            children: null,
          },
          value: {
            ...prop.value,
            children: null,
          },
        })
      );
      return combinedPropertiesWithoutChildren;
    });

    const propertyText = (property: ParseTreeProperty) => {
      return `${property.variable.variableName} - ${property.value.valueName}`;
    };

    watch(propertyList, () => emit('export-properties', propertyList.value));

    watch(formComplete, () => emit('form-complete', formComplete.value));

    const expandDialog = ref(false);
    const expandUpward = () => {
      if (taxonomyTree.value && filteredTree.value) {
        const parentUuid = filteredTree.value.objParentUuid;
        properties.value = [];

        filteredTree.value = searchTree(taxonomyTree.value, parentUuid);
      }
    };

    return {
      loading,
      filteredTree,
      panel,
      formComplete,
      updateProperties,
      properties,
      propertyList,
      propertyText,
      expandUpward,
      expandDialog,
    };
  },
});
</script>

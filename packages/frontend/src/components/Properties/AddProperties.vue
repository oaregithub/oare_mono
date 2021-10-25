<template>
  <v-progress-linear v-if="loading" indeterminate />
  <v-row v-else>
    <v-col cols="4">
      <h3 class="primary--text mb-5">Properties</h3>
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
      <h3 class="primary--text">Add Properties</h3>
      <v-expansion-panels flat v-model="panel">
        <v-expansion-panel>
          <v-expansion-panel-header class="font-weight-bold">{{
            filteredTree
              ? filteredTree.valueName || filteredTree.variableName
              : ''
          }}</v-expansion-panel-header>
          <v-expansion-panel-content>
            <parse-tree-node
              v-if="filteredTree"
              :node="filteredTree"
              allowSelections
              @update:node="formComplete = $event.status"
              @update:properties="updateProperties"
              class="test-tree"
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
} from '@vue/composition-api';
import { TaxonomyTree, ParseTreeProperty } from '@oare/types';
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
    valueUuid: {
      type: String,
      required: false,
    },
    requiredNodeValueName: {
      type: String,
      required: false,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);
    const panel = ref(0);
    const formComplete = ref(false);
    const filteredTree = ref<TaxonomyTree | null>(null);
    const properties = ref<ParseTreePropertyEvent[]>([]);
    const foundRequiredNode = ref(props.requiredNodeValueName ? false : true);

    onMounted(async () => {
      try {
        loading.value = true;
        const taxonomyTree = await server.getTaxonomyTree();
        filteredTree.value = props.valueUuid
          ? searchTree(taxonomyTree, props.valueUuid)
          : taxonomyTree;
        if (filteredTree.value && !filteredTree.value.children) {
          formComplete.value = true;
        }
      } catch {
        actions.showErrorSnackbar(
          'Error loading parse tree. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    const searchTree = (
      node: TaxonomyTree,
      valueUuid: string
    ): TaxonomyTree | null => {
      if (node.valueUuid === valueUuid && foundRequiredNode.value) {
        return node;
      } else if (node.children !== null) {
        let result = null;

        if (
          props.requiredNodeValueName &&
          node.valueName === props.requiredNodeValueName
        ) {
          foundRequiredNode.value = true;
        }

        for (let i = 0; result === null && i < node.children.length; i++) {
          result = searchTree(node.children[i], valueUuid);
          if (result && node.children[i].valueUuid) {
            properties.value.unshift({
              properties: [{ variable: node, value: node.children[i] }],
              source: node,
            });
          }
        }
        return result;
      }
      return null;
    };

    const updateProperties = (args: ParseTreePropertyEvent) => {
      properties.value = properties.value.filter(
        prop => prop.source !== args.source
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

    return {
      loading,
      filteredTree,
      panel,
      formComplete,
      updateProperties,
      properties,
      propertyList,
      propertyText,
    };
  },
});
</script>

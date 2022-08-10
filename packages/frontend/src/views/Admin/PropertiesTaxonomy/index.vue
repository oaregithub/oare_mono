<template>
  <OareContentView :loading="loading" title="Properties Taxonomy">
    <v-container>
      <v-row>
        <v-spacer />
        <v-col cols="4">
          <v-text-field
            v-model="search"
            label="Search"
            single-line
            hide-details
            clearable
            class="test-search"
          />
          <v-switch
            label="Show UUIDs"
            color="primary"
            v-model="showUUID"
            hide-details
          ></v-switch>
        </v-col>
      </v-row>
    </v-container>
    <v-expansion-panels v-model="panel">
      <v-expansion-panel>
        <v-expansion-panel-header class="font-weight-bold">{{
          taxonomyTree ? taxonomyTree.aliasName : ''
        }}</v-expansion-panel-header>
        <v-expansion-panel-content>
          <parse-tree-node
            v-if="taxonomyTree"
            :node="taxonomyTree"
            :nodesToHighlight="nodesToHightlight"
            :openSearchResults="openSearchResults"
            :showUUID="showUUID"
            :showFieldInfo="true"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  computed,
} from '@vue/composition-api';
import { TaxonomyTree } from '@oare/types';
import sl from '@/serviceLocator';
import ParseTreeNode from './components/ParseTreeNode.vue';

export default defineComponent({
  name: 'ParseTree',
  components: {
    ParseTreeNode,
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');

    const loading = ref(false);
    const taxonomyTree = ref<TaxonomyTree>();
    const panel = ref(0);

    const search = ref('');
    const searchPath = ref<string[][]>([]);
    const existingFinds = ref<string[]>([]);

    const showUUID = ref(true);

    const nodesToHightlight = computed(() =>
      searchPath.value.flatMap(path => path)
    );
    const openSearchResults = computed(() => searchPath.value.length === 1);

    onMounted(async () => {
      try {
        loading.value = true;
        taxonomyTree.value = await server.getTaxonomyTree();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading properties taxonomy. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const searchTree = (
      node: TaxonomyTree,
      searchText: string,
      existingFinds: string[]
    ): TaxonomyTree | null => {
      if (
        ((node.variableName &&
          node.variableName.toLowerCase().includes(searchText.toLowerCase())) ||
          (node.valueName &&
            node.valueName.toLowerCase().includes(searchText.toLowerCase())) ||
          (node.aliasName &&
            node.aliasName.toLowerCase().includes(searchText.toLowerCase()))) &&
        !existingFinds.includes(node.uuid)
      ) {
        searchPath.value.unshift([node.uuid]);
        return node;
      } else if (node.children !== null) {
        let result = null;

        for (let i = 0; result === null && i < node.children.length; i++) {
          result = searchTree(node.children[i], searchText, existingFinds);
          if (result) {
            searchPath.value[0].unshift(node.children[i].uuid);
          }
        }
        return result;
      }
      return null;
    };

    watch(
      search,
      _.debounce(async () => {
        searchPath.value = [];
        existingFinds.value = [];
        if (taxonomyTree.value && search.value) {
          let result: TaxonomyTree | null = taxonomyTree.value;

          while (result) {
            result = searchTree(
              taxonomyTree.value,
              search.value,
              existingFinds.value
            );
            if (result) {
              existingFinds.value.push(result.uuid);
            }
          }
        }
      }, 500),
      {
        immediate: false,
      }
    );
    return {
      showUUID,
      loading,
      taxonomyTree,
      panel,
      search,
      searchPath,
      nodesToHightlight,
      openSearchResults,
    };
  },
});
</script>

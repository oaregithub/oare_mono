<template>
  <OareContentView :loading="loading" title="Properties Taxonomy">
    <v-expansion-panels v-model="panel">
      <v-expansion-panel>
        <v-expansion-panel-header class="font-weight-bold">{{
          taxonomyTree ? taxonomyTree.aliasName : ''
        }}</v-expansion-panel-header>
        <v-expansion-panel-content>
          <parse-tree-node v-if="taxonomyTree" :node="taxonomyTree" />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
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

    const loading = ref(false);
    const taxonomyTree = ref<TaxonomyTree>();
    const panel = ref(0);

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
    return {
      loading,
      taxonomyTree,
      panel,
    };
  },
});
</script>

<template>
  <OareContentView :loading="loading" title="Parse Tree">
    <v-expansion-panels v-model="panel">
      <v-expansion-panel>
        <v-expansion-panel-header class="font-weight-bold">{{
          parseTree ? parseTree.variableName : ''
        }}</v-expansion-panel-header>
        <v-expansion-panel-content>
          <parse-tree-node v-if="parseTree" :node="parseTree" />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import { ParseTree } from '@oare/types';
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
    const parseTree = ref<ParseTree>();
    const panel = ref(0);

    onMounted(async () => {
      try {
        loading.value = true;
        parseTree.value = await server.getParseTree();
      } catch {
        actions.showErrorSnackbar(
          'Error loading parse tree. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });
    return {
      loading,
      parseTree,
      panel,
    };
  },
});
</script>

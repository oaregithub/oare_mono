<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Form"
    :width="1000"
    :persistent="false"
    :submitDisabled="!formComplete || !newFormSpelling"
  >
    <OareContentView :loading="loading">
      <template #title>
        <v-row class="px-3">
          <strong>{{ word.word }}</strong>
        </v-row>
      </template>
      <word-grammar :word="word" />
      <v-text-field v-model="newFormSpelling" placeholder="New form spelling" />
      <v-container>
        <v-row>
          <v-col cols="3">
            <h3 class="primary--text mb-5">Properties</h3>
            <v-chip
              v-for="(prop, index) in formattedProps"
              :key="index"
              class="my-1 mr-1"
              >{{ prop.variable.variableName }} -
              {{ prop.value.valueName }}</v-chip
            >
          </v-col>
          <v-col cols="9">
            <h3 class="primary--text">Add Properties</h3>
            <v-expansion-panels flat v-model="panel">
              <v-expansion-panel>
                <v-expansion-panel-header class="font-weight-bold">{{
                  filteredTree ? filteredTree.valueName : ''
                }}</v-expansion-panel-header>
                <v-expansion-panel-content>
                  <parse-tree-node
                    v-if="filteredTree"
                    :node="filteredTree"
                    allowSelections
                    @update:node="formComplete = $event.status"
                    @update:properties="updateProperties"
                  />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-container>
    </OareContentView>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import { Word, ParseTree } from '@oare/types';
import WordGrammar from './WordGrammar.vue';
import ParseTreeNode from '@/views/Admin/ParseTree/components/ParseTreeNode.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'AddFormDialog',
  components: {
    WordGrammar,
    ParseTreeNode,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    word: {
      type: Object as PropType<Word>,
      required: true,
    },
  },
  setup({ word }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);
    const panel = ref(0);
    const formComplete = ref(false);
    const filteredTree = ref<ParseTree | null>(null);
    const newFormSpelling = ref('');

    onMounted(async () => {
      try {
        loading.value = true;
        const parseTree = await server.getParseTree();
        filteredTree.value = searchTree(
          parseTree,
          word.partsOfSpeech[0].valueUuid
        );
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
      node: ParseTree,
      valueUuid: string
    ): ParseTree | null => {
      if (node.valueUuid === valueUuid) {
        return node;
      } else if (node.children !== null) {
        let result = null;
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

    const properties = ref<
      {
        properties: { variable: ParseTree; value: ParseTree }[];
        source: ParseTree;
      }[]
    >([]);

    const updateProperties = (args: {
      properties: { variable: ParseTree; value: ParseTree }[];
      source: ParseTree;
    }) => {
      properties.value = properties.value.filter(
        prop => prop.source !== args.source
      );
      properties.value.push(args);
    };

    const formattedProps = computed(() => {
      return properties.value.flatMap(prop => prop.properties);
    });

    return {
      loading,
      filteredTree,
      panel,
      formComplete,
      newFormSpelling,
      updateProperties,
      properties,
      formattedProps,
    };
  },
});
</script>

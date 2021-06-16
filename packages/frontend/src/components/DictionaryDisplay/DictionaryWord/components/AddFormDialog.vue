<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Form"
    :width="1150"
    :persistent="false"
    :submitDisabled="!formComplete || !newFormSpelling || formAlreadyExists"
  >
    <OareContentView :loading="loading">
      <template #title>
        <v-row class="px-3">
          <strong>{{ word.word }}</strong>
        </v-row>
      </template>
      <word-grammar :word="word" />
      <v-text-field v-model="newFormSpelling" placeholder="New form spelling" />
      <span
        v-if="formAlreadyExists"
        class="red--text text--darken-2 font-weight-bold"
        >A form with this spelling already exists on this word</span
      >
      <v-container>
        <v-row>
          <v-col cols="2">
            <h3 class="primary--text mb-5">Existing Forms</h3>
            <h4 v-for="(form, index) in word.forms" :key="index">
              {{ form.form }}
            </h4>
          </v-col>
          <v-col cols="3">
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
          <v-col cols="7">
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
  ComputedRef,
} from '@vue/composition-api';
import { Word, ParseTree, ParseTreeProperty } from '@oare/types';
import WordGrammar from './WordGrammar.vue';
import ParseTreeNode, {
  ParseTreePropertyEvent,
} from '@/views/Admin/ParseTree/components/ParseTreeNode.vue';
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
    const properties = ref<ParseTreePropertyEvent[]>([]);

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

    const updateProperties = (args: ParseTreePropertyEvent) => {
      properties.value = properties.value.filter(
        prop => prop.source !== args.source
      );
      properties.value.push(args);
    };

    const propertyList: ComputedRef<ParseTreeProperty[]> = computed(() => {
      return properties.value.flatMap(prop => prop.properties);
    });

    const propertyText = (property: ParseTreeProperty) => {
      return `${property.variable.variableName} - ${property.value.valueName}`;
    };

    const formAlreadyExists = computed(() => {
      const existingForms = word.forms.map(form => form.form);
      return existingForms.includes(newFormSpelling.value);
    });

    return {
      loading,
      filteredTree,
      panel,
      formComplete,
      newFormSpelling,
      updateProperties,
      properties,
      propertyList,
      propertyText,
      formAlreadyExists,
    };
  },
});
</script>

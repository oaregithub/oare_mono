<template>
  <OareContentView :loading="loading" title="Properties Taxonomy">
    <v-container class="pl-0 pt-0 ml-0">
      <v-row class="ma-0">
        <v-btn color="primary" @click="bulkPropertiesDialog = true"
          >Add Properties in Bulk</v-btn
        >
        <oare-dialog
          v-model="bulkPropertiesDialog"
          title="Add Properties in Bulk"
          :width="1300"
          :submitDisabled="!canSubmit"
          submitText="Submit"
          closeOnSubmit
          @submit="updateBulkProperties"
        >
          <v-container>
            <v-row>
              <v-col cols="3">
                <h3 class="primary--text mb-5">Item UUIDs</h3>
                <v-textarea
                  v-model="bulkUuidInput"
                  outlined
                  rows="20"
                  no-resize
                  label="UUIDs..."
                  placeholder="Enter a comma-separated list of the UUIDs for all items you would like to bulk add the selected properties to. All items must be of the same type."
                  :error-messages="errorMessages"
                />
              </v-col>
              <v-col cols="9">
                <add-properties
                  @export-properties="setProperties($event)"
                  @form-complete="formComplete = $event"
                  :key="addPropertiesKey"
                />
              </v-col>
            </v-row>
          </v-container>
        </oare-dialog>
      </v-row>
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
import { TaxonomyTree, ParseTreeProperty } from '@oare/types';
import sl from '@/serviceLocator';
import ParseTreeNode from './components/ParseTreeNode.vue';
import AddProperties from '@/components/Properties/AddProperties.vue';

export default defineComponent({
  name: 'ParseTree',
  components: {
    ParseTreeNode,
    AddProperties,
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

    const bulkPropertiesDialog = ref(false);
    const formComplete = ref(false);
    const addPropertiesKey = ref(false);
    watch(bulkPropertiesDialog, () => {
      if (bulkPropertiesDialog.value) {
        addPropertiesKey.value = !addPropertiesKey.value;
        properties.value = [];
        bulkUuidInput.value = '';
      }
    });

    const properties = ref<ParseTreeProperty[]>([]);
    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const updateBulkProperties = async () => {
      try {
        await Promise.all(
          bulkUuidList.value.map(uuid =>
            server.editPropertiesByReferenceUuid(uuid, properties.value)
          )
        );
      } catch {
        actions.showErrorSnackbar('Error adding properties. Please try again');
      }
    };

    const bulkUuidInput = ref('');
    const bulkUuidList = computed(() =>
      bulkUuidInput.value.split(',').map(uuid => uuid.trim())
    );

    const hasValidUuidInput = ref(true);
    const errorMessages = ref<string[]>([]);

    watch(
      bulkUuidList,
      _.debounce(async () => {
        hasValidUuidInput.value = await server.haveSameTableReference(
          bulkUuidList.value
        );
      }, 500),
      { immediate: false }
    );

    watch(hasValidUuidInput, () => {
      if (hasValidUuidInput.value) {
        errorMessages.value = [];
      } else {
        errorMessages.value = [
          'All UUIDs must point to items of the same type. One or more of the provided UUIDs do not match the others.',
        ];
      }
    });

    const canSubmit = computed(
      () => hasValidUuidInput.value && formComplete.value
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
      bulkPropertiesDialog,
      formComplete,
      addPropertiesKey,
      properties,
      setProperties,
      updateBulkProperties,
      bulkUuidInput,
      bulkUuidList,
      hasValidUuidInput,
      errorMessages,
      canSubmit,
    };
  },
});
</script>

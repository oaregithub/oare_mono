<template>
  <div>
    <v-tooltip bottom open-delay="800">
      <template #activator="{ on, attrs }">
        <v-btn
          v-if="allowEditing && canEditParseInfo"
          icon
          class="test-property-pencil edit-button"
          @click="editPropertiesDialog = true"
          small
          v-bind="attrs"
          v-on="on"
        >
          <v-icon size="20">mdi-pencil</v-icon>
        </v-btn>
      </template>
      <span>Edit Parse Info</span>
    </v-tooltip>
    <span class="mr-1" v-if="formGrammar === '' && canEditParseInfo"
      >(No parse info yet)</span
    >
    <span class="mr-1" v-else-if="formGrammar !== ''">({{ formGrammar }})</span>
    <oare-dialog
      v-if="allowEditing && canEditParseInfo"
      v-model="editPropertiesDialog"
      :title="`Edit Form Parse Information - ${form.form}`"
      :width="1400"
      :submitDisabled="!formComplete"
      submitText="Submit"
      closeOnSubmit
      @submit="updateFormProperties"
    >
      <properties-tree
        :readonly="false"
        startingValueHierarchyUuid="b745f8d1-55f2-11eb-bf9e-024de1c1cc1d"
        @set-properties="setProperties($event)"
        @set-complete="formComplete = $event"
        :existingProperties="form.properties"
        :key="addPropertiesKey"
      />
    </oare-dialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  watch,
  inject,
} from '@vue/composition-api';
import { AppliedProperty, DictionaryForm, Word } from '@oare/types';
import utils from '@/utils';
import { ReloadKey } from '../../../../../index.vue';
import sl from '@/serviceLocator';
import PropertiesTree from '@/components/Properties/PropertiesTree.vue';

export default defineComponent({
  props: {
    word: {
      type: Object as PropType<Word>,
      required: false,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    PropertiesTree,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const reload = inject(ReloadKey);

    const editPropertiesDialog = ref(false);
    const formComplete = ref(false);

    const formGrammar = computed(() => utils.formGrammarString(props.form));

    const properties = ref<AppliedProperty[]>([]);
    const setProperties = (propertyList: AppliedProperty[]) => {
      properties.value = propertyList;
    };

    const addPropertiesKey = ref(false);
    watch(editPropertiesDialog, () => {
      if (editPropertiesDialog.value) {
        addPropertiesKey.value = !addPropertiesKey.value;
        properties.value = [];
      }
    });

    const updateFormProperties = async () => {
      try {
        await server.editPropertiesByReferenceUuid(
          props.form.uuid,
          properties.value,
          props.word ? props.word.uuid : undefined
        );
        actions.showSnackbar(
          `Successfully updated form parse info for ${props.form.form}`
        );
        reload && reload();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error updating form parse information.',
          err as Error
        );
      } finally {
        properties.value = [];
      }
    };

    const canEditParseInfo = computed(() =>
      store.hasPermission('EDIT_ITEM_PROPERTIES')
    );

    return {
      formGrammar,
      editPropertiesDialog,
      formComplete,
      properties,
      setProperties,
      addPropertiesKey,
      updateFormProperties,
      canEditParseInfo,
    };
  },
});
</script>

<style scoped>
.edit-button {
  margin-top: -11px;
  margin-bottom: -7px;
}
</style>

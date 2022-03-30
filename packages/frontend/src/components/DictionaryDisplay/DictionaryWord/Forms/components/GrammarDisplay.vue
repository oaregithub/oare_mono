<template>
  <div>
    <v-btn
      v-if="allowEditing && canEditParseInfo"
      icon
      class="test-property-pencil edit-button"
      @click="editPropertiesDialog = true"
    >
      <v-icon>mdi-pencil</v-icon>
    </v-btn>
    <span class="mr-1" v-if="formGrammar === ''">(No parse info yet)</span>
    <span class="mr-1" v-else-if="formGrammar !== ''">({{ formGrammar }})</span>
    <oare-dialog
      v-if="allowEditing && canEditParseInfo"
      v-model="editPropertiesDialog"
      :title="`Edit Form Parse Information - ${form.form}`"
      :width="1000"
      :submitDisabled="!formComplete"
      submitText="Submit"
      closeOnSubmit
      @submit="updateFormProperties"
    >
      <add-properties
        :valueUuid="partOfSpeechValueUuid"
        requiredNodeValueName="Parse"
        @export-properties="setProperties($event)"
        @form-complete="formComplete = $event"
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
import { DictionaryForm, ParseTreeProperty, Word } from '@oare/types';
import utils from '@/utils';
import AddProperties from '@/components/Properties/AddProperties.vue';
import { ReloadKey } from '../../index.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    word: {
      type: Object as PropType<Word>,
      required: true,
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
    AddProperties,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const reload = inject(ReloadKey);

    const editPropertiesDialog = ref(false);
    const formComplete = ref(false);

    const formGrammar = computed(() => utils.formGrammarString(props.form));

    const properties = ref<ParseTreeProperty[]>([]);
    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const partOfSpeechValueUuid = computed(() => {
      const posProperties = props.word.properties.filter(
        prop => prop.variableName === 'Part of Speech'
      );
      return posProperties.length > 0 ? posProperties[0].valueUuid : undefined;
    });

    const addPropertiesKey = ref(false);
    watch(editPropertiesDialog, () => {
      if (editPropertiesDialog.value) {
        addPropertiesKey.value = !addPropertiesKey.value;
        properties.value = [];
      }
    });

    const updateFormProperties = async () => {
      try {
        await server.editFormParseInfo(props.form.uuid, properties.value);
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
      store.getters.permissions
        .map(permission => permission.name)
        .includes('EDIT_FORM_PARSE_INFO')
    );

    return {
      formGrammar,
      editPropertiesDialog,
      formComplete,
      properties,
      setProperties,
      partOfSpeechValueUuid,
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

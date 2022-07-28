<template>
  <div>
    <div class="d-flex">
      <word-grammar
        :word="wordInfo"
        :allowEditing="allowEditing"
        :updateWordInfo="updateWordInfo"
      />
    </div>
    <div v-if="wordInfo.forms.length < 1">
      No forms found for {{ wordInfo.word }}
    </div>

    <v-row v-if="wordInfo.forms.length > 1">
      <v-col cols="3">
        <v-text-field
          v-model="searchQuery"
          :placeholder="'Filter forms'"
          :width="100"
          clearable
          single-line
        />
      </v-col>
      <v-col cols="3">
        <v-btn
          v-if="!filterByProperties"
          class="ma-2"
          color="info"
          @click="filterByProperties = true"
        >
          Filter By Properties
        </v-btn>
        <v-btn
          v-if="filterByProperties"
          color="error"
          @click="cancelFilterByProperties"
          class="ma-1"
          >Cancel</v-btn
        >
      </v-col>
    </v-row>

    <add-properties
      v-if="wordInfo.forms.length > 1 && filterByProperties"
      :startingUuid="partOfSpeechValueUuid"
      requiredNodeValueName="Parse"
      @export-properties="setProperties($event)"
      @form-complete="formComplete = $event"
    />

    <form-display
      v-for="(form, index) in filteredForms"
      :key="index"
      :word="wordInfo"
      :form="form"
      :updateForm="newForm => updateForm(index, newForm)"
      :word-uuid="wordInfo.uuid"
      :uuid-to-highlight="uuidToHighlight"
      :cursor="cursor"
      :allow-editing="allowEditing"
    />
    <v-btn
      v-if="allowEditing && canAddForms"
      @click="addFormDialog = true"
      text
      class="mt-4"
      color="primary"
    >
      <v-icon>mdi-plus</v-icon>
      <h3>Add Form</h3>
    </v-btn>
    <edit-word-dialog
      v-if="editDialogForm"
      v-model="showSpellingDialog"
      :key="editDialogForm ? editDialogForm.uuid : ''"
      :form="editDialogForm"
      :spelling="editDialogSpelling"
      :allowDiscourseMode="editDialogDiscourse"
      @select-form="selectForm($event)"
    />
    <add-form-dialog
      v-if="allowEditing && canAddForms"
      v-model="addFormDialog"
      :word="wordInfo"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  onMounted,
} from '@vue/composition-api';
import {
  Word,
  DictionaryForm,
  FormSpelling,
  ParseTreeProperty,
} from '@oare/types';
import FormDisplay from './Forms/FormDisplay.vue';
import EventBus, { ACTIONS } from '@/EventBus';
import EditWordDialog from '@/components/DictionaryDisplay/DictionaryWord/Forms/components/EditWordDialog.vue';
import AddFormDialog from './components/AddFormDialog.vue';
import WordGrammar from './components/WordGrammar.vue';
import AddProperties from '@/components/Properties/AddProperties.vue';
import sl from '@/serviceLocator';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  props: {
    updateWordInfo: {
      type: Function as PropType<(newWord: Word) => void>,
      required: true,
    },
    wordUuid: {
      type: String,
      required: true,
    },
    wordInfo: {
      type: Object as PropType<Word>,
      required: true,
    },
    uuidToHighlight: {
      type: String,
      default: null,
    },
    cursor: {
      type: Boolean,
      default: true,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    FormDisplay,
    EditWordDialog,
    AddFormDialog,
    WordGrammar,
    AddProperties,
  },
  setup(props) {
    const store = sl.get('store');

    const editDialogForm = ref<DictionaryForm>();
    const editDialogSpelling = ref<FormSpelling>();
    const editDialogDiscourse = ref(false);
    const showSpellingDialog = ref(false);
    const addFormDialog = ref(false);
    const filterByProperties = ref(false);

    const searchQuery = useQueryParam('filter', '', true);

    const canAddForms = computed(() => store.hasPermission('ADD_FORM'));

    const updateForm = (index: number, form: DictionaryForm) => {
      const updatedForms = [...props.wordInfo.forms];
      updatedForms[index] = form;
      props.updateWordInfo({
        ...props.wordInfo,
        forms: updatedForms,
      });
    };

    const properties = ref<ParseTreeProperty[]>([]);
    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const partOfSpeechValueUuid = computed(() => {
      const posProperties = props.wordInfo.properties.filter(
        prop => prop.variableName === 'Part of Speech'
      );
      return posProperties.length > 0 ? posProperties[0].valueUuid : undefined;
    });

    onMounted(() => {
      EventBus.$on(
        ACTIONS.EDIT_WORD_DIALOG,
        (options: {
          form: DictionaryForm;
          spelling?: FormSpelling;
          allowDiscourseMode: boolean;
        }) => {
          editDialogForm.value = options.form;
          editDialogSpelling.value = options.spelling || undefined;
          editDialogDiscourse.value = options.allowDiscourseMode;
          showSpellingDialog.value = true;
        }
      );
    });

    const selectForm = (form: DictionaryForm) => {
      editDialogForm.value = form;
    };

    const filteredForms = computed(() => {
      return props.wordInfo.forms.filter(form => {
        return (
          form.form.includes(searchQuery.value) &&
          properties.value
            .map(el => el.value.valueName)
            .every(val => form.properties.map(el => el.valueName).includes(val))
        );
      });
    });

    const cancelFilterByProperties = () => {
      filterByProperties.value = !filterByProperties.value;
      setProperties([]);
    };

    return {
      updateForm,
      editDialogForm,
      partOfSpeechValueUuid,
      filterByProperties,
      editDialogSpelling,
      editDialogDiscourse,
      showSpellingDialog,
      addFormDialog,
      canAddForms,
      selectForm,
      setProperties,
      cancelFilterByProperties,
      searchQuery,
      filteredForms,
    };
  },
});
</script>

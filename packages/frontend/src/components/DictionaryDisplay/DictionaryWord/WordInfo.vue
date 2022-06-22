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

    <v-col v-if="wordInfo.forms.length > 1" cols="4" class="pt-0">
      <v-text-field
        v-model="searchQuery"
        :placeholder="'Filter forms'"
        clearable
        single-line
      />
    </v-col>

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
import { Word, DictionaryForm, FormSpelling } from '@oare/types';
import FormDisplay from './Forms/FormDisplay.vue';
import EventBus, { ACTIONS } from '@/EventBus';
import EditWordDialog from '@/components/DictionaryDisplay/DictionaryWord/Forms/components/EditWordDialog.vue';
import AddFormDialog from './components/AddFormDialog.vue';
import WordGrammar from './components/WordGrammar.vue';
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
  },
  setup(props) {
    const store = sl.get('store');

    const editDialogForm = ref<DictionaryForm>();
    const editDialogSpelling = ref<FormSpelling>();
    const editDialogDiscourse = ref(false);
    const showSpellingDialog = ref(false);
    const addFormDialog = ref(false);

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
        return form.form.includes(searchQuery.value);
      });
    });

    return {
      updateForm,
      editDialogForm,
      editDialogSpelling,
      editDialogDiscourse,
      showSpellingDialog,
      addFormDialog,
      canAddForms,
      selectForm,
      searchQuery,
      filteredForms,
    };
  },
});
</script>

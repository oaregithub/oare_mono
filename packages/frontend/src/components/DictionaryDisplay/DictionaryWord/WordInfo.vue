<template>
  <div>
    <div class="d-flex mb-3">
      <v-btn
        v-if="canEditTranslations && !isEditingTranslations && allowEditing"
        icon
        class="mt-n2"
        @click="isEditingTranslations = true"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>

      <edit-translations
        v-if="isEditingTranslations && allowEditing"
        @close-editor="isEditingTranslations = false"
        :translations="wordInfo.translations"
        @update:translations="updateTranslations"
        :wordUuid="wordUuid"
      />
      <word-grammar v-else :word="wordInfo" :allowEditing="allowEditing" />
    </div>
    <div v-if="wordInfo.forms.length < 1">
      No forms found for {{ wordInfo.word }}
    </div>

    <v-col v-if="wordInfo.forms.length > 1" cols="12" sm="6" md="4">
      <v-text-field
        v-model="searchQuery"
        :placeholder="'Filter forms'"
        clearable
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
      color="#ffffff"
      elevation="0"
      class="mt-4 px-2"
    >
      <v-icon color="primary">mdi-plus</v-icon>
      <h3 class="text--primary">Add Form</h3>
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
  DictionaryWordTranslation,
  FormSpelling,
} from '@oare/types';
import FormDisplay from './Forms/FormDisplay.vue';
import EditTranslations from './EditTranslations.vue';
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
    EditTranslations,
    EditWordDialog,
    AddFormDialog,
    WordGrammar,
  },
  setup(props) {
    const store = sl.get('store');
    const isEditingTranslations = ref(false);

    const editDialogForm = ref<DictionaryForm>();
    const editDialogSpelling = ref<FormSpelling>();
    const editDialogDiscourse = ref(false);
    const showSpellingDialog = ref(false);
    const addFormDialog = ref(false);

    const searchQuery = useQueryParam('filter', '');

    const canEditTranslations = computed(() =>
      store.hasPermission('UPDATE_TRANSLATION')
    );

    const canAddForms = computed(() => store.hasPermission('ADD_FORM'));

    const updateTranslations = (
      newTranslations: DictionaryWordTranslation[]
    ) => {
      props.updateWordInfo({
        ...props.wordInfo,
        translations: newTranslations,
      });
    };

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
      canEditTranslations,
      isEditingTranslations,
      updateTranslations,
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

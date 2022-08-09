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
        :placeholder="'Filter forms or spellings'"
        clearable
        single-line
        ><template slot="prepend"
          ><v-menu offset-y open-on-hover>
            <template #activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" class="ml-2">
                mdi-information-outline
              </v-icon>
            </template>
            <v-card class="pa-3">
              When filtering spellings, they must be strictly formatted. Here
              are the rules:
              <ol>
                <li>
                  Logograms in all uppercase, separated with periods, e.g.:
                  TÚG.ḪI.A.
                </li>
                <li>
                  Enclose determinatives in parentheses, e.g.: (m), (f), (d),
                  (ki). All these as lowercase. Logographic determinatives in
                  uppercase, with all elements including periods in their own
                  parens, e.g.: (TÚG)(.)(ḪI)(.)(A)ku-ta-nu.
                </li>
                <li>
                  Dashes between syllabic values and between syllabic and
                  logograms. No dashes between determinatives, e.g.:
                  a-šur-ANDUL.
                </li>
                <li>Dashes between elements of names, e.g.: (d)IŠTAR-ANDUL.</li>
                <li>
                  Subscript numerals are just entered as regular numerals, e.g.:
                  PUZUR4-a-šùr.
                </li>
                <li>
                  Don’t capitalize syllabic readings at the beginning of a name.
                </li>
                <li>
                  Render phonetic complements between curly brackets, e.g.
                  2{šé}{-}{ne}.
                </li>
              </ol>
              Thus enter spellings into the filter like this: 2{šé}{-}{ne} ANŠE
              ú 10+2 (TÚG)(.)(ḪI)ra-qu-ú ša (m)(d)UTU-(d)a-šur though in a
              printed publication they might look like this: 2šé-ne ANŠE ú 12
              TÚG.ḪIra-qu-ú ša mdUTU-dA-šur
            </v-card>
          </v-menu></template
        ></v-text-field
      >
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
  watch,
} from '@vue/composition-api';
import { Word, DictionaryForm, FormSpelling } from '@oare/types';
import FormDisplay from './Forms/FormDisplay.vue';
import EventBus, { ACTIONS } from '@/EventBus';
import EditWordDialog from '@/components/DictionaryDisplay/DictionaryWord/Forms/components/EditWordDialog.vue';
import AddFormDialog from './components/AddFormDialog.vue';
import WordGrammar from './components/WordGrammar.vue';
import sl from '@/serviceLocator';
import useQueryParam from '@/hooks/useQueryParam';
import { spellingHtmlReading } from '@oare/oare';
import _ from 'lodash';

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
    const filteredForms = ref(props.wordInfo.forms);

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

    watch(
      () => searchQuery.value,
      _.debounce(() => {
        filteredForms.value = props.wordInfo.forms.filter(form => {
          if (form.form.includes(searchQuery.value)) {
            return form;
          }
          if (
            form.spellings.some(spelling => {
              return (
                spelling.spelling.includes(searchQuery.value) ||
                spellingHtmlReading(spelling.spelling).includes(
                  spellingHtmlReading(searchQuery.value)
                )
              );
            })
          ) {
            form.spellings = form.spellings.filter(
              spelling =>
                spelling.spelling.includes(searchQuery.value) ||
                spellingHtmlReading(spelling.spelling).includes(
                  spellingHtmlReading(searchQuery.value)
                )
            );
            return form;
          }
        });
      }, 500)
    );

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

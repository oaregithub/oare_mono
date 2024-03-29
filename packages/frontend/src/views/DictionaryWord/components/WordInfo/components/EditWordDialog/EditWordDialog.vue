<template>
  <oare-dialog
    v-bind="$attrs"
    v-on="$listeners"
    :width="2000"
    :persistent="false"
    :closeButton="true"
    :showSubmit="false"
    :showCancel="false"
  >
    <template
      #action-options
      v-if="allowDiscourseMode && canInsertDiscourseRows"
    >
      <v-switch
        v-model="inDiscourseMode"
        label="Discourse Mode"
        class="mr-6 test-discourse-mode"
      />
    </template>

    <OareContentView>
      <template #title v-if="!inDiscourseMode">
        {{ spellingTitle }}
        <v-menu offset-y open-on-hover>
          <template #activator="{ on, attrs }">
            <v-icon v-bind="attrs" v-on="on" class="ml-2">
              mdi-information-outline
            </v-icon>
          </template>
          <v-card class="pa-3">
            Spellings must be strictly formatted. Here are the rules:
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
                logograms. No dashes between determinatives, e.g.: a-šur-ANDUL.
              </li>
              <li>Dashes between elements of names, e.g.: (d)IŠTAR-ANDUL.</li>
              <li>
                Subscript numerals are just entered as regular numerals, e.g.:
                PUZUR4-a-šùr.
              </li>
              <li>
                Don’t capitalize syllabic readings at the beginning of a name
                (the database takes care of this during display).
              </li>
              <li>
                Render phonetic complements between curly brackets, e.g.
                2{šé}{-}{ne}.
              </li>
            </ol>
            Thus enter spellings into this database like this: 2{šé}{-}{ne} ANŠE
            ú 10+2 (TÚG)(.)(ḪI)ra-qu-ú ša (m)(d)UTU-(d)a-šur though in a printed
            publication they might look like this: 2šé-ne ANŠE ú 12
            TÚG.ḪIra-qu-ú ša mdUTU-dA-šur
          </v-card>
        </v-menu>
        <v-spacer />
      </template>
      <template #title v-else-if="inDiscourseMode">
        Insert Discourse Rows
      </template>

      <v-row align="center">
        <v-col cols="6">
          <v-text-field
            v-model="spellingInput"
            autofocus
            class="test-spelling-field"
          />
        </v-col>
        <v-col cols="6" class="black--text">
          Preview:
          <span v-html="spellingHtmlReading(spellingInput)" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          This spelling appears in the following forms:
          <v-data-table
            :headers="spellingResultHeaders"
            :items="spellingSearchResults"
            :loading="searchSpellingLoading"
          >
            <template #[`item.word`]="{ item }">
              <v-row>
                <v-radio-group
                  v-model="selectedFormUuid"
                  @change="selectForm(item.form)"
                >
                  <v-radio :value="item.form.uuid" class="ml-2">
                    <template #label>
                      <router-link
                        :to="`/dictionaryWord/${item.wordUuid}`"
                        target="_blank"
                        class="ml-1"
                        >{{ item.word }}</router-link
                      >
                      <word-grammar
                        :word="item.wordInfo"
                        onlyShowFirstTranslation
                        class="ml-2"
                        :allowEditing="false"
                      />
                    </template>
                  </v-radio>
                </v-radio-group>
              </v-row>
            </template>
            <template #[`item.form`]="{ item }">
              <span>{{
                `${item.form.form} (${formGrammarString(item.form)})`
              }}</span>
            </template>
          </v-data-table>
        </v-col>
        <v-col cols="12" md="6">
          <insert-discourse-rows
            v-if="inDiscourseMode && canInsertDiscourseRows"
            v-model="$attrs.value"
            :form="form"
            :spelling="spelling"
            :spellingInput="spellingInput"
            :numFormOccurrences="spellingSearchResults.length"
          />
          <spelling-dialog
            v-if="!inDiscourseMode"
            v-model="$attrs.value"
            :form="form"
            :spelling="spelling"
            :spellingInput="spellingInput"
          />
        </v-col>
      </v-row>
    </OareContentView>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  watch,
  computed,
  Ref,
} from '@vue/composition-api';
import {
  DictionaryForm,
  FormSpelling,
  SearchSpellingResultRow,
} from '@oare/types';
import SpellingDialog from './components/SpellingDialog.vue';
import InsertDiscourseRows from './components/InsertDiscourseRows.vue';
import { spellingHtmlReading } from '@oare/oare';
import { DataTableHeader } from 'vuetify';
import utils from '@/utils';
import sl from '@/serviceLocator';
import WordGrammar from '@/views/DictionaryWord/components/WordInfo/components/WordGrammar/WordGrammar.vue';

export default defineComponent({
  name: 'EditWordDialog',
  components: {
    SpellingDialog,
    InsertDiscourseRows,
    WordGrammar,
  },
  props: {
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    spelling: {
      type: Object as PropType<FormSpelling | null>,
      default: null,
    },
    allowDiscourseMode: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, context) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const store = sl.get('store');

    const spellingInput = ref(props.spelling ? props.spelling.spelling : '');

    const inDiscourseMode = ref(false);
    const searchSpellingLoading = ref(false);

    const canInsertDiscourseRows = computed(() =>
      store.hasPermission('INSERT_DISCOURSE_ROWS')
    );

    const spellingSearchResults: Ref<SearchSpellingResultRow[]> = ref([]);
    const spellingResultHeaders: Ref<DataTableHeader[]> = ref([
      {
        text: 'Word',
        value: 'word',
      },
      {
        text: 'Form',
        value: 'form',
      },
    ]);

    const searchSpellings = async (newSpelling: string) => {
      try {
        searchSpellingLoading.value = true;
        spellingSearchResults.value = await server.searchSpellings(newSpelling);
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to search for spellings',
          err as Error
        );
      } finally {
        searchSpellingLoading.value = false;
      }
    };

    const spellingTitle = computed(() => {
      if (props.spelling) {
        return 'Editing existing spelling';
      }
      const grammarString = utils.formGrammarString(props.form);
      return (
        `Add Spelling to ${props.form.form}` +
        (grammarString ? ` (${grammarString})` : '')
      );
    });

    watch(
      () => context.attrs.value,
      open => {
        if (!open) {
          if (props.spelling) {
            spellingInput.value = props.spelling.spelling;
          } else {
            spellingInput.value = '';
          }
          spellingSearchResults.value = [];
        } else {
          if (props.spelling) {
            searchSpellings(spellingInput.value);
          }
        }
      },
      { immediate: true }
    );

    watch(
      spellingInput,
      _.debounce(async (newSpelling: string) => {
        if (newSpelling) {
          await searchSpellings(newSpelling);
        } else {
          spellingSearchResults.value = [];
        }
      }, 500)
    );

    watch(
      () => props.allowDiscourseMode,
      () => {
        if (!props.allowDiscourseMode) {
          inDiscourseMode.value = false;
        }
      }
    );

    const selectedFormUuid = ref<string>(props.form.uuid);
    const selectForm = (form: DictionaryForm) => {
      context.emit('select-form', form);
    };

    return {
      spellingInput,
      spellingHtmlReading,
      inDiscourseMode,
      SpellingDialog,
      spellingTitle,
      formGrammarString: utils.formGrammarString,
      spellingResultHeaders,
      searchSpellingLoading,
      spellingSearchResults,
      canInsertDiscourseRows,
      selectedFormUuid,
      selectForm,
    };
  },
});
</script>

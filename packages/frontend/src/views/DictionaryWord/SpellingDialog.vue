<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :width="2000"
    :persistent="false"
  >
    <template #title>
      {{ title }}
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
              Enclose determinatives in parentheses, e.g.: (m), (f), (d), (ki).
              All these as lowercase. Logographic determinatives in uppercase,
              with all elements including periods in their own parens, e.g.:
              (TÚG)(.)(ḪI)(.)(A)ku-ta-nu.
            </li>
            <li>
              Dashes between syllabic values and between syllabic and logograms.
              No dashes between determinatives, e.g.: a-šur-ANDUL.
            </li>
            <li>Dashes between elements of names, e.g.: (d)IŠTAR-ANDUL.</li>
            <li>
              Subscript numerals are just entered as regular numerals, e.g.:
              PUZUR4-a-šùr.
            </li>
            <li>
              Don’t capitalize syllabic readings at the beginning of a name (the
              database takes care of this during display).
            </li>
            <li>
              Render phonetic complements between curly brackets, e.g.
              2{šé}{-}{ne}.
            </li>
          </ol>
          Thus enter spellings into this database like this: 2{šé}{-}{ne} ANŠE ú
          10+2 (TÚG)(.)(ḪI)ra-qu-ú ša (m)(d)UTU-(d)a-šur though in a printed
          publication they might look like this: 2šé-ne ANŠE ú 12 TÚG.ḪIra-qu-ú
          ša mdUTU-dA-šur
        </v-card>
      </v-menu>
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
    <div class="red--text text--darken-2 font-weight-bold">
      <span v-if="spelling && submitDisabledMessage">{{
        submitDisabledMessage
      }}</span>
      <ul v-if="spellingErrors.length > 0">
        <li v-for="(error, idx) in spellingErrors" :key="idx">
          {{ error }}
        </li>
      </ul>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        This spelling appears in the following forms:
        <v-data-table
          :headers="spellingResultHeaders"
          :items="spellingSearchResults"
          :loading="searchSpellingLoading"
        >
          <template #[`item.word`]="{ item }">
            <router-link :to="`/dictionaryWord/${item.wordUuid}`">{{
              item.word
            }}</router-link>
          </template>
          <template #[`item.form`]="{ item }">
            {{ `${item.form.form} (${formGrammarString(item.form)})` }}
          </template>
        </v-data-table>
      </v-col>
      <v-col cols="12" md="6">
        This spelling appears in the following texts:
        <v-data-table
          v-model="selectedDiscourses"
          :headers="discourseResultHeaders"
          :items="discourseSearchResults"
          :loading="searchDiscourseLoading"
          :server-items-length="totalDiscourseResults"
          :options.sync="discourseOptions"
          :footer-props="{ 'items-per-page-options': [10, 25, 50, 100] }"
          item-key="uuid"
          show-select
        >
          <template #[`item.textName`]="{ item }">
            <router-link :to="`/epigraphies/${item.textUuid}`">{{
              item.textName
            }}</router-link>
          </template>
          <template #[`item.readings`]="{ item }">
            <span v-html="renderedReading(item)" />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <template #submit-button>
      <v-tooltip bottom :disabled="!submitDisabledMessage">
        <template v-slot:activator="{ on, attrs }">
          <span v-on="on">
            <OareLoaderButton
              color="primary"
              v-bind="attrs"
              :disabled="hasError || isTyping"
              :loading="submitLoading"
              @click="submit"
              class="test-submit-btn"
            >
              Submit
            </OareLoaderButton>
          </span>
        </template>
        <span>{{ submitDisabledMessage }}</span>
      </v-tooltip>
    </template>
  </oare-dialog>
</template>

<script lang="ts">
import OareDialog from '@/components/base/OareDialog.vue';
import {
  SearchSpellingResultRow,
  SearchDiscourseSpellingRow,
  DictionaryForm,
  FormSpelling,
} from '@oare/types';
import {
  defineComponent,
  ref,
  Ref,
  watch,
  PropType,
  computed,
  inject,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { DataTableHeader } from 'vuetify';
import utils from '@/utils';
import { ReloadKey } from './index.vue';
import { spellingHtmlReading } from '@oare/oare';

export default defineComponent({
  name: 'SpellingDialog',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
    spelling: {
      type: Object as PropType<FormSpelling | null>,
      default: null,
    },
  },
  components: {
    OareDialog,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const spellingInput = ref(props.spelling ? props.spelling.spelling : '');
    const searchedSpelling = ref('');
    const totalDiscourseResults = ref(0);
    const discourseOptions = ref({
      page: 1,
      itemsPerPage: 50,
    });
    const submitLoading = ref(false);
    const selectedDiscourses: Ref<SearchDiscourseSpellingRow[]> = ref([]);

    const spellingSearchResults: Ref<SearchSpellingResultRow[]> = ref([]);
    const discourseSearchResults: Ref<SearchDiscourseSpellingRow[]> = ref([]);
    const searchSpellingLoading = ref(false);
    const searchDiscourseLoading = ref(false);
    const spellingErrors = ref<string[]>([]);
    const isTyping = ref(false);

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

    const discourseResultHeaders: Ref<DataTableHeader[]> = ref([
      {
        text: 'Text',
        value: 'textName',
        width: 100,
      },
      {
        text: 'Line',
        value: 'line',
        width: 75,
      },
      {
        text: 'Reading',
        value: 'readings',
      },
    ]);

    const reload = inject(ReloadKey);

    const spellingExists = computed(
      () =>
        !props.spelling &&
        props.form.spellings.map(f => f.spelling).includes(spellingInput.value)
    );

    const submitDisabledMessage = computed(() => {
      if (spellingExists.value) {
        return 'The spelling you have typed already exists in the form';
      } else if (!spellingInput.value) {
        return 'You cannot submit an empty spelling';
      } else if (spellingErrors.value.length > 0) {
        return 'The spelling you entered contains errors';
      } else if (
        props.spelling &&
        spellingInput.value === props.spelling.spelling &&
        selectedDiscourses.value.length === 0
      ) {
        return 'You must link the text to unlinked discourses and/or update the spelling.';
      }
      return '';
    });

    const hasError = computed(
      () => !!submitDisabledMessage.value || spellingErrors.value.length > 0
    );

    const addSpelling = async () => {
      try {
        submitLoading.value = true;
        const { uuid } = await server.addSpelling({
          formUuid: props.form.uuid,
          spelling: spellingInput.value,
          discourseUuids: selectedDiscourses.value.map(row => row.uuid),
        });
        emit('input', false);
        actions.showSnackbar('Successfully added spelling');
        reload && reload();
      } catch {
        actions.showErrorSnackbar('Failed to add spelling to form');
      } finally {
        submitLoading.value = false;
      }
    };

    const editSpelling = async () => {
      if (!props.spelling) {
        actions.showErrorSnackbar(
          'Failed to update form spelling because spelling is null'
        );
        return;
      }

      try {
        submitLoading.value = true;
        await server.updateSpelling(
          props.spelling.uuid,
          spellingInput.value,
          selectedDiscourses.value.map(row => row.uuid)
        );
        actions.showSnackbar('Successfully updated spelling');
        reload && reload();
      } catch (err) {
        if (err.response && err.response.status === 400) {
          actions.showErrorSnackbar(err.response.data.message);
        } else {
          actions.showErrorSnackbar('Failed to update form spelling');
        }
      } finally {
        submitLoading.value = false;
      }
    };

    const submit = () => {
      if (props.spelling) {
        editSpelling();
      } else {
        addSpelling();
      }
    };

    const renderedReading = (row: SearchDiscourseSpellingRow) => {
      return row.readings
        .map(reading => ({
          ...reading,
          spelling: spellingHtmlReading(reading.spelling),
        }))
        .map(reading =>
          reading.wordOnTablet === row.wordOnTablet
            ? `<mark>${reading.spelling}</mark>`
            : reading.spelling
        )
        .join(' ');
    };

    const checkSpelling = async (spelling: string) => {
      try {
        const { errors } = await server.checkSpelling(spelling);
        spellingErrors.value = errors;
      } catch {
        actions.showErrorSnackbar('Failed to check spelling');
      }
    };

    const searchSpellings = async (newSpelling: string) => {
      try {
        searchSpellingLoading.value = true;
        searchedSpelling.value = newSpelling;
        spellingSearchResults.value = await server.searchSpellings(newSpelling);
      } catch {
        actions.showErrorSnackbar('Failed to search for spellings');
      } finally {
        searchSpellingLoading.value = false;
      }
    };

    const searchDiscourse = async (newSpelling: string) => {
      try {
        searchDiscourseLoading.value = true;
        discourseSearchResults.value = [];
        const { totalResults, rows } = await server.searchSpellingDiscourse(
          newSpelling,
          {
            page: discourseOptions.value.page - 1,
            limit: discourseOptions.value.itemsPerPage,
          }
        );

        discourseSearchResults.value = rows;
        totalDiscourseResults.value = totalResults;
      } catch {
        actions.showErrorSnackbar('Failed to search discourse spellings');
      } finally {
        searchDiscourseLoading.value = false;
      }
    };

    const title = computed(() => {
      if (props.spelling) {
        return 'Editing existing spelling';
      }

      const grammarString = utils.formGrammarString(props.form);
      return (
        `Add Spelling to ${props.form.form}` +
        (grammarString ? ` (${grammarString})` : '')
      );
    });

    watch(spellingInput, () => (isTyping.value = true));

    watch(
      spellingInput,
      _.debounce(async (newSpelling: string) => {
        if (newSpelling) {
          await searchSpellings(newSpelling);
          await searchDiscourse(newSpelling);
          await checkSpelling(newSpelling);
          isTyping.value = false;
        } else {
          spellingSearchResults.value = [];
          discourseSearchResults.value = [];
          spellingErrors.value = [];
        }
      }, 500)
    );

    watch(
      discourseOptions,
      () => {
        if (spellingInput.value) {
          searchDiscourse(spellingInput.value);
        }
      },
      { deep: true }
    );

    watch(
      () => props.value,
      open => {
        if (!open) {
          if (props.spelling) {
            spellingInput.value = props.spelling.spelling;
          } else {
            spellingInput.value = '';
          }
          spellingSearchResults.value = [];
          discourseSearchResults.value = [];
        } else {
          if (props.spelling) {
            searchSpellings(spellingInput.value);
            searchDiscourse(spellingInput.value);
            checkSpelling(spellingInput.value);
          }
        }
      },
      { immediate: true }
    );

    return {
      isTyping,
      spellingInput,
      spellingSearchResults,
      discourseSearchResults,
      spellingResultHeaders,
      discourseResultHeaders,
      searchSpellingLoading,
      searchDiscourseLoading,
      renderedReading,
      totalDiscourseResults,
      discourseOptions,
      spellingExists,
      submitDisabledMessage,
      submitLoading,
      addSpelling,
      selectedDiscourses,
      title,
      formGrammarString: utils.formGrammarString,
      submit,
      spellingErrors,
      hasError,
      spellingHtmlReading,
    };
  },
});
</script>

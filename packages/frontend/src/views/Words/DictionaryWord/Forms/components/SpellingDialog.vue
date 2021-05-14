<template>
  <div>
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
        <router-link :to="`/epigraphies/${item.textUuid}`" target="_blank">{{
          item.textName
        }}</router-link>
      </template>
      <template #[`item.line`]="{ item }">
        <span>{{ formatLineNumber(item.line, false) }}</span>
      </template>
      <template #[`item.readings`]="{ item }">
        <span v-html="renderedReading(item)" />
      </template>
    </v-data-table>
    <v-row>
      <v-spacer />
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
    </v-row>
  </div>
</template>

<script lang="ts">
import {
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
import { ReloadKey } from '../../index.vue';
import { spellingHtmlReading } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';

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
    spellingInput: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const totalDiscourseResults = ref(0);
    const discourseOptions = ref({
      page: 1,
      itemsPerPage: 50,
    });
    const submitLoading = ref(false);
    const selectedDiscourses: Ref<SearchDiscourseSpellingRow[]> = ref([]);

    const discourseSearchResults: Ref<SearchDiscourseSpellingRow[]> = ref([]);
    const searchDiscourseLoading = ref(false);
    const spellingErrors = ref<string[]>([]);
    const isTyping = ref(false);

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
        props.form.spellings.map(f => f.spelling).includes(props.spellingInput)
    );

    const submitDisabledMessage = computed(() => {
      if (spellingExists.value) {
        return 'The spelling you have typed already exists in the form';
      } else if (!props.spellingInput) {
        return 'You cannot submit an empty spelling';
      } else if (spellingErrors.value.length > 0) {
        return 'The spelling you entered contains errors';
      } else if (
        props.spelling &&
        props.spellingInput === props.spelling.spelling &&
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
        await server.addSpelling({
          formUuid: props.form.uuid,
          spelling: props.spellingInput,
          discourseUuids: selectedDiscourses.value.map(row => row.uuid),
        });
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
          props.spellingInput,
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

    watch(
      () => props.spellingInput,
      () => (isTyping.value = true)
    );

    watch(
      () => props.spellingInput,
      _.debounce(async (newSpelling: string) => {
        if (newSpelling) {
          await searchDiscourse(newSpelling);
          await checkSpelling(newSpelling);
          isTyping.value = false;
        } else {
          discourseSearchResults.value = [];
          spellingErrors.value = [];
        }
      }, 500)
    );

    watch(
      discourseOptions,
      () => {
        if (props.spellingInput) {
          searchDiscourse(props.spellingInput);
        }
      },
      { deep: true }
    );

    watch(
      () => props.value,
      open => {
        if (!open) {
          discourseSearchResults.value = [];
          selectedDiscourses.value = [];
          discourseOptions.value.page = 1;
        } else {
          if (props.spelling) {
            searchDiscourse(props.spellingInput);
            checkSpelling(props.spellingInput);
          }
        }
      },
      { immediate: true }
    );

    return {
      isTyping,
      discourseSearchResults,
      discourseResultHeaders,
      searchDiscourseLoading,
      renderedReading,
      totalDiscourseResults,
      discourseOptions,
      spellingExists,
      submitDisabledMessage,
      submitLoading,
      addSpelling,
      selectedDiscourses,
      formGrammarString: utils.formGrammarString,
      submit,
      spellingErrors,
      hasError,
      spellingHtmlReading,
      formatLineNumber,
    };
  },
});
</script>

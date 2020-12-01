<template>
  <oare-dialog
    :title="`Add Spelling to ${form.form} (${formGrammarString(form)})`"
    :value="value"
    @input="$emit('input', $event)"
    :width="1000"
  >
    <v-text-field
      v-model="spelling"
      autofocus
      clearable
      class="test-spelling-field"
    />
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
              :disabled="!spelling || spellingExists"
              :loading="addLoading"
              @click="addSpelling"
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
  SpellingText,
} from '@oare/types';
import {
  defineComponent,
  ref,
  reactive,
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

export default defineComponent({
  name: 'AddSpellingDialog',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
  },
  components: {
    OareDialog,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const spelling = ref('');
    const searchedSpelling = ref('');
    const totalDiscourseResults = ref(0);
    const discourseOptions = ref({
      page: 1,
      itemsPerPage: 10,
    });
    const addLoading = ref(false);
    const selectedDiscourses: Ref<SearchDiscourseSpellingRow[]> = ref([]);

    const spellingSearchResults: Ref<SearchSpellingResultRow[]> = ref([]);
    const discourseSearchResults: Ref<SearchDiscourseSpellingRow[]> = ref([]);
    const searchSpellingLoading = ref(false);
    const searchDiscourseLoading = ref(false);

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
      },
      {
        text: 'Line',
        value: 'line',
      },
      {
        text: 'Reading',
        value: 'readings',
      },
    ]);

    const reload = inject(ReloadKey);

    const spellingExists = computed(() =>
      props.form.spellings.map(f => f.spelling).includes(spelling.value)
    );

    const submitDisabledMessage = computed(() => {
      if (spellingExists.value) {
        return 'The spelling you have typed already exists on the form';
      } else if (!spelling.value) {
        return 'You cannot submit an empty spelling';
      }
      return '';
    });

    const addSpelling = async () => {
      try {
        addLoading.value = true;
        const { uuid } = await server.addSpelling({
          formUuid: props.form.uuid,
          spelling: spelling.value,
          discourseUuids: selectedDiscourses.value.map(row => row.uuid),
        });
        emit('input', false);
        actions.showSnackbar('Successfully added spelling');
        reload && reload();
      } catch {
        actions.showErrorSnackbar('Failed to add spelling to form');
      } finally {
        addLoading.value = false;
      }
    };

    const renderedReading = (row: SearchDiscourseSpellingRow) => {
      return row.readings
        .map(reading =>
          reading.wordOnTablet === row.wordOnTablet
            ? `<mark>${reading.spelling}</mark>`
            : reading.spelling
        )
        .join(' ');
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

    watch(
      spelling,
      _.debounce(async (newSpelling: string) => {
        if (newSpelling) {
          searchSpellings(newSpelling);
          searchDiscourse(newSpelling);
        } else {
          spellingSearchResults.value = [];
          discourseSearchResults.value = [];
        }
      }, 500)
    );

    watch(
      discourseOptions,
      () => {
        if (spelling.value) {
          searchDiscourse(spelling.value);
        }
      },
      { deep: true }
    );

    watch(
      () => props.value,
      open => {
        if (!open) {
          spelling.value = '';
          spellingSearchResults.value = [];
          discourseSearchResults.value = [];
        }
      }
    );

    return {
      spelling,
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
      addLoading,
      addSpelling,
      formGrammarString: utils.formGrammarString,
      selectedDiscourses,
    };
  },
});
</script>

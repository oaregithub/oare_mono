<template>
  <div>
    <OareDialog
      v-model="viewingMainDialog"
      :value="value"
      class="test-main-dialog"
      @input="$emit('input', false)"
      :title="`Matches for ${spelling}`"
      submitText="Connect"
      :closeOnSubmit="false"
      @submit="openConfirmationDialog"
      :showSubmit="canConnectSpellings"
      :submitDisabled="!connectSelections"
      cancelText="Close"
      :persistent="false"
      :width="1000"
    >
      <span
        class="test-one-or-more-results"
        v-if="connectSpellingOccurenceObjs.length > 0"
        >This spelling occurs in the following forms</span
      >
      <span class="test-results" v-else
        >This spelling has no matches in the dictionary</span
      >
      <v-data-table
        :headers="headers"
        :items="connectSpellingOccurenceObjs"
        :loading="referencesLoading"
        :server-items-length="spellingOccurrencesLength"
        :options.sync="tableOptions"
        :footer-props="{
          'items-per-page-options': [10, 25, 50, 100],
        }"
      >
        <template #[`item.word`]="{ item }">
          <router-link
            :to="`/dictionaryWord/${item.dictionaryInfo.wordUuid}`"
            class="test-word"
            target="_blank"
            >{{ item.dictionaryInfo.word }}</router-link
          >
        </template>
        <template #[`item.form`]="{ item }">
          <span class="test-form">{{
            item.dictionaryInfo.form.form
          }}</span> </template
        ><template #[`item.parseInfo`]="{ item }">
          <span class="test-parse-info">{{
            utils.formGrammarString(item.dictionaryInfo.form)
          }}</span>
        </template>
        <template #[`item.context`]="{ item }">
          <div v-if="item.textInfo.length > 0">
            <div class="py-1">
              <router-link
                v-if="item.textInfo.length > 0"
                :to="`/epigraphies/${item.textInfo[0].textUuid}/${
                  item.textInfo[0].discoursesToHighlight ||
                  item.textInfo[0].discourseUuid
                }`"
                class="test-text"
                target="_blank"
                >{{ item.textInfo[0].textName }}</router-link
              >
            </div>
            <div
              v-for="(reading, index) in item.textInfo[0].readings"
              class="test-reading"
              :key="index"
              v-html="reading"
            />
          </div>
          <span v-else v-html="'n/a'"></span>
        </template>
        <template #[`item.connect`]="{ item }">
          <div class="d-flex justify-center">
            <v-checkbox
              :value="{
                discourseUuid: discourseUuid,
                spellingUuid: item.dictionaryInfo.spellingUuid,
              }"
              v-model="connectSelections"
              class="test-connect"
            />
          </div>
        </template>
      </v-data-table>
    </OareDialog>
    <OareDialog
      v-model="viewingConfirmationDialog"
      class="test-confirmation-dialog"
      title="Connect spelling"
      submitText="Yes, connect"
      cancelText="No, don't connect"
      :persistent="true"
      :closeOnSubmit="true"
      @submit="connectSpellings"
      @input="$emit('input', false)"
    >
      Are you sure you want to connect the spelling '{{ spelling }}' to this
      discourse unit?
    </OareDialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  Ref,
  ref,
  watch,
  computed,
  onMounted,
} from '@vue/composition-api';
import {
  ConnectSpellingDiscoursePayload,
  Pagination,
  SearchSpellingResultRow,
  SpellingOccurrenceResponseRow,
} from '@oare/types';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';
import utils from '@/utils';

export interface ConnectSpellingOccurrenceObj {
  textInfo: SpellingOccurrenceResponseRow[];
  dictionaryInfo: SearchSpellingResultRow;
}

export default defineComponent({
  props: {
    getTexts: {
      type: Function as PropType<
        (uuid: string[], request: Pagination) => SpellingOccurrenceResponseRow[]
      >,
      required: true,
    },
    searchSpellings: {
      type: Function as PropType<
        (spelling: string) => SearchSpellingResultRow[]
      >,
      required: true,
    },
    spelling: {
      type: String,
      required: true,
    },
    discourseUuid: {
      type: String,
      required: true,
    },
    value: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');
    const store = sl.get('store');

    const dictionaryInfo = ref<SearchSpellingResultRow[]>([]);
    const spellingOccurrencesLength = ref(0);
    const connectSpellingOccurenceObjs = ref<ConnectSpellingOccurrenceObj[]>(
      []
    );
    const canConnectSpellings = computed(() => store.getters.isAdmin);
    const connectSelections = ref<ConnectSpellingDiscoursePayload | null>(null);
    const viewingConfirmationDialog = ref(false);
    const viewingMainDialog = ref(true);
    const referencesLoading = ref(false);
    const tableOptions = ref({
      page: 1,
      itemsPerPage: 10,
    });

    const headers: Ref<DataTableHeader[]> = ref([
      {
        text: 'Word',
        value: 'word',
      },
      {
        text: 'Form',
        value: 'form',
      },
      {
        text: 'Parse Info',
        value: 'parseInfo',
      },
      {
        text: 'Context',
        value: 'context',
      },
      { text: 'Connect', value: 'connect' },
    ]);

    const connectSpellings = async () => {
      try {
        if (connectSelections.value) {
          await server.connectSpelling(connectSelections.value);
        }
        actions.showSnackbar('Successfully connected spelling to discourse');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error disconnecting spelling(s). Please try again.',
          err as Error
        );
      } finally {
        closeConfirmationDialog();
      }
    };

    const openConfirmationDialog = () => {
      viewingMainDialog.value = false;
      viewingConfirmationDialog.value = true;
    };

    const closeConfirmationDialog = () => {
      viewingConfirmationDialog.value = false;
      viewingMainDialog.value = true;
      emit('finish');
    };

    const getReferences = async () => {
      try {
        referencesLoading.value = true;

        connectSpellingOccurenceObjs.value = await Promise.all(
          dictionaryInfo.value.map(async d => {
            const textOccurence = await props.getTexts([d.spellingUuid], {
              page: 1,
              limit: 1,
            });
            return {
              dictionaryInfo: d,
              textInfo: textOccurence,
            };
          })
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to load text occurrences',
          err as Error
        );
      } finally {
        referencesLoading.value = false;
      }
    };

    watch(
      () => props.spelling,
      async () => {
        await getReferences();
      }
    );

    watch(tableOptions, getReferences);

    onMounted(async () => {
      try {
        dictionaryInfo.value = await props.searchSpellings(props.spelling);
        spellingOccurrencesLength.value = dictionaryInfo.value.length;
        await getReferences();
      } catch (err) {
        actions.showErrorSnackbar('Failed on mount', err as Error);
      }
    });

    return {
      utils,
      spellingOccurrencesLength,
      headers,
      referencesLoading,
      tableOptions,
      connectSpellingOccurenceObjs,
      connectSelections,
      connectSpellings,
      canConnectSpellings,
      openConfirmationDialog,
      closeConfirmationDialog,
      viewingConfirmationDialog,
      viewingMainDialog,
    };
  },
});
</script>

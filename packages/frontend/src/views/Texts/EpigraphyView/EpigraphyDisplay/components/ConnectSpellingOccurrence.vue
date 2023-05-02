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
      :stickyAction="true"
      cancelText="Close"
      :persistent="false"
      :width="1000"
    >
      <span class="test-one-or-more-results" v-if="dictionaryInfo.length > 0"
        >This spelling occurs in the following forms</span
      >
      <span class="test-results" v-else
        >This spelling has no matches in the dictionary</span
      >
      <v-data-table
        :headers="headers"
        :items="dictionaryInfo"
        :loading="loading"
        :server-items-length="spellingOccurrencesLength"
        hide-default-footer
      >
        <template #[`item.word`]="{ item }">
          <router-link
            :to="`/dictionaryWord/${item.wordUuid}`"
            class="test-word"
            target="_blank"
            >{{ item.word }}</router-link
          >
        </template>
        <template #[`item.form`]="{ item }">
          <span class="test-form">{{ item.form.form }}</span> </template
        ><template #[`item.parseInfo`]="{ item }">
          <span class="test-parse-info">{{
            utils.formGrammarString(item.form)
          }}</span>
        </template>
        <template #[`item.context`]="{ item }">
          <epigraphy-context
            class="test-context"
            :spellingUuid="item.spellingUuid"
          />
        </template>
        <template #[`item.connect`]="{ item }">
          <div class="d-flex justify-center">
            <v-checkbox
              :value="{
                discourseUuid: discourseUuid,
                spellingUuid: item.spellingUuid,
                form: item.form,
                explicitSpelling: spelling,
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
      Are you sure you want this discourse unit to
      <em>{{ connectSelections ? connectSelections.form.form : '' }}</em> ({{
        connectSelections
          ? utils.formGrammarString(connectSelections.form)
          : ''
      }}) spelled:
      <span
        v-html="
          spellingHtmlReading(
            connectSelections ? connectSelections.explicitSpelling : ''
          )
        "
        class="mr-1"
      />?
    </OareDialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  Ref,
  ref,
  computed,
  onMounted,
} from '@vue/composition-api';
import {
  ConnectSpellingDiscourseSelection,
  SearchSpellingResultRow,
} from '@oare/types';
import EpigraphyContext from './EpigraphyContext.vue';
import { spellingHtmlReading } from '@oare/oare';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';
import utils from '@/utils';

export default defineComponent({
  props: {
    searchSpellings: {
      type: Function as PropType<
        (spelling: string) => Promise<SearchSpellingResultRow[]>
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
  components: { EpigraphyContext },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');
    const store = sl.get('store');

    const dictionaryInfo = ref<SearchSpellingResultRow[]>([]);
    const spellingOccurrencesLength = ref(0);
    const canConnectSpellings = computed(() =>
      store.hasPermission('CONNECT_SPELLING')
    );
    const connectSelections = ref<ConnectSpellingDiscourseSelection | null>(
      null
    );
    const viewingConfirmationDialog = ref(false);
    const viewingMainDialog = ref(true);
    const loading = ref(false);
    const referencesLoading = ref(false);

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
          await server.connectSpelling({
            discourseUuid: props.discourseUuid,
            spellingUuid: connectSelections.value.spellingUuid,
          });
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

    onMounted(async () => {
      try {
        loading.value = true;
        dictionaryInfo.value = await props.searchSpellings(props.spelling);
        loading.value = false;
        spellingOccurrencesLength.value = dictionaryInfo.value.length;
      } catch (err) {
        actions.showErrorSnackbar('Failed on mount', err as Error);
      }
    });

    return {
      utils,
      spellingOccurrencesLength,
      headers,
      referencesLoading,
      loading,
      dictionaryInfo,
      connectSelections,
      connectSpellings,
      canConnectSpellings,
      openConfirmationDialog,
      closeConfirmationDialog,
      viewingConfirmationDialog,
      viewingMainDialog,
      spellingHtmlReading,
    };
  },
});
</script>

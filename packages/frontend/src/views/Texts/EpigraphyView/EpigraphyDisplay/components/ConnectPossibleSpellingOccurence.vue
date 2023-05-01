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
          <epigraphy-context :spellingUuid="item.spellingUuid" />
        </template>
        <template #[`item.possibleSigns`]="{ item }">
          <span v-for="(sign, idx) in item.possibleSigns" :key="idx"
            ><v-img
              v-if="sign.hasPng === 1"
              :src="
                require(`@oare/frontend/src/assets/signVectors/${sign.mzl}.png`)
              "
              height="25px"
              :width="
                getWidth(
                  require(`@oare/frontend/src/assets/signVectors/${sign.mzl}.png`)
                ) || 30
              "
              contain
              class="d-inline-block"
            />
            <span v-else-if="sign.fontCode" class="my-n1 mx-1 cuneiform">{{
              getSignHTMLCode(sign.fontCode)
            }}</span>
            <v-icon v-else-if="!sign.fontCode" small color="red" class="ma-1"
              >mdi-block-helper</v-icon
            ></span
          >
        </template>
        <template #[`item.connect`]="{ item }">
          <div class="d-flex justify-center">
            <v-checkbox
              :value="{
                discourseUuid: discourseUuid,
                spellingUuid: item.spellingUuid,
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
  computed,
  onMounted,
} from '@vue/composition-api';
import {
  ConnectSpellingDiscoursePayload,
  SearchPossibleSpellingResultRow,
} from '@oare/types';
import EpigraphyContext from './EpigraphyContext.vue';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';
import utils from '@/utils';

export default defineComponent({
  props: {
    searchPossibleSpellings: {
      type: Function as PropType<
        (spelling: string) => Promise<SearchPossibleSpellingResultRow[]>
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

    const dictionaryInfo = ref<SearchPossibleSpellingResultRow[]>([]);
    const spellingOccurrencesLength = ref(0);
    const canConnectSpellings = computed(() =>
      store.hasPermission('CONNECT_SPELLING')
    );
    const connectSelections = ref<ConnectSpellingDiscoursePayload | null>(null);
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
      { text: 'Possible Signs', value: 'possibleSigns' },
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

    onMounted(async () => {
      try {
        loading.value = true;
        dictionaryInfo.value = await props.searchPossibleSpellings(
          props.spelling
        );
        loading.value = false;
        spellingOccurrencesLength.value = dictionaryInfo.value.length;
      } catch (err) {
        actions.showErrorSnackbar('Failed on mount', err as Error);
      }
    });

    const getWidth = (src: string) => {
      const image = new Image();
      image.src = src;
      const heightRatio = 25 / image.height;
      return heightRatio * image.width;
    };

    const getSignHTMLCode = (code: string) => {
      const codeArray: string[] = code.split('+');
      let finishedCodeArray: string[] = [];
      codeArray.forEach(c => {
        let codePt = Number(`0x${c}`);
        if (codePt > 0xffff) {
          codePt -= 0x10000;
          finishedCodeArray.push(
            String.fromCharCode(
              0xd800 + (codePt >> 10),
              0xdc00 + (codePt & 0x3ff)
            )
          );
        } else {
          finishedCodeArray.push(String.fromCharCode(codePt));
        }
      });
      return finishedCodeArray.join('');
    };

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
      getWidth,
      getSignHTMLCode,
    };
  },
});
</script>
<style scoped>
.cuneiform {
  font-family: 'Santakku', 'CuneiformComposite';
}
</style>

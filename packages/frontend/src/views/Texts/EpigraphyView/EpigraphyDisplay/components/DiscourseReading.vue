<template>
  <div>
    <p class="mt-5 oare-title font-weight-regular">
      <span v-for="side in discourseRenderer.sides" :key="side">
        <span class="mr-1">({{ getSideByNumber(side) }})</span>
        <span
          v-for="line in discourseRenderer.linesOnSide(side)"
          :key="line"
          class="mr-1"
        >
          <sup>{{ formatLineNumber(line, false) }})</sup
          ><span v-html="discourseRenderer.lineReading(line)" />
        </span>
      </span>
    </p>
    <v-row align="center" v-if="canInsertParentDiscourse && !disableEditing">
      <v-switch
        v-model="articulateDiscourseHierarchy"
        label="Articulate Discourse Hierarchy"
        class="mx-6"
      />
    </v-row>
    <v-row
      align="center"
      v-if="
        canInsertParentDiscourse &&
        articulateDiscourseHierarchy &&
        !disableEditing
      "
    >
      <v-btn
        :disabled="discourseSelections.length < 1"
        color="primary"
        @click="insertParentDiscourseDialog = true"
        class="mx-6 mb-6"
        >Insert Parent Discourse</v-btn
      >
      <component
        :is="insertParentDiscourseComponent"
        v-model="insertParentDiscourseDialog"
        :key="insertParentDiscourseKey"
        :discourseSelections="discourseSelections"
        :textUuid="textUuid"
      />
    </v-row>
    <v-treeview
      open-all
      :items="discourseUnits"
      item-children="units"
      item-key="uuid"
      item-text="spelling"
    >
      <template #label="{ item }">
        <v-row class="ma-0 pa-0" align="center">
          <v-checkbox
            v-if="
              articulateDiscourseHierarchy &&
              item.type !== 'discourseUnit' &&
              !disableEditing
            "
            hide-details
            dense
            multiple
            v-model="discourseSelections"
            :value="item"
            class="ml-2 my-2"
            :disabled="!canSelectDiscourseUnit(item)"
          />
          <span v-if="editingUuid !== item.uuid" class="ma-0 pa-0">
            <v-btn
              icon
              v-if="
                (item.translation || item.type === 'discourseUnit') &&
                allowEditing
              "
              @click="startEdit(item)"
              class="mr-1 test-discourse-startedit"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-menu
              :close-on-content-click="false"
              offset-x
              open-on-hover
              :open-delay="400"
            >
              <template v-slot:activator="{ on, attrs }">
                <span
                  :class="`${discourseColor(item.type)}--text`"
                  style="white-space: normal"
                  v-html="discourseReading(item)"
                  v-bind="attrs"
                  v-on="on"
                  class="pr-8"
                  @click="openDialog(item.uuid)"
                ></span>
              </template>

              <discourse-properties-card
                :discourseUuid="item.uuid"
                :key="item.uuid"
              />
            </v-menu>
          </span>
          <div
            v-else-if="
              (item.translation || item.type === 'discourseUnit') &&
              allowEditing
            "
          >
            <v-textarea
              label="Translation"
              auto-grow
              outlined
              rows="1"
              v-model="inputTranslation"
              class="ma-1 test-discourse-box"
              dense
              hide-details
            ></v-textarea>
            <OareLoaderButton
              :loading="editLoading"
              color="primary"
              @click="discourseEdit(item)"
              class="ma-1 test-discourse-button"
              >Save</OareLoaderButton
            >
            <v-btn color="primary" @click="editingUuid = ''" class="ma-1"
              >Cancel</v-btn
            >
          </div>
        </v-row>
      </template>
    </v-treeview>
    <oare-dialog
      v-if="viewingDialog"
      class="test-rendering-word-dialog"
      :closeButton="true"
      :persistent="false"
      :show-cancel="false"
      :show-submit="false"
      :submitLoading="loading"
      :width="600"
      v-model="viewingDialog"
    >
      <dictionary-word
        v-if="discourseWordInfo"
        :uuid="discourseWordInfo.uuid"
        :selected-word-info="discourseWordInfo"
        :allow-commenting="false"
        :allow-editing="false"
        :allow-deleting="false"
        :allow-breadcrumbs="false"
      >
      </dictionary-word>
    </oare-dialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  PropType,
  computed,
  watch,
} from '@vue/composition-api';
import {
  DiscourseUnit,
  EpigraphicUnitSide,
  TextDiscourseRow,
  Word,
} from '@oare/types';
import { DiscourseHtmlRenderer } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import DictionaryWord from '@/components/DictionaryDisplay/DictionaryWord/index.vue';
import DiscoursePropertiesCard from './DiscoursePropertiesCard.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
    textUuid: {
      type: String,
      required: false,
    },
    disableEditing: {
      type: Boolean,
      default: false,
    },
    localDiscourseInfo: {
      type: Array as PropType<TextDiscourseRow[]>,
      required: false,
    },
  },
  components: {
    DiscoursePropertiesCard,
    DictionaryWord,
  },
  setup({ discourseUnits, textUuid, disableEditing, localDiscourseInfo }) {
    const discourseRenderer = new DiscourseHtmlRenderer(discourseUnits);
    const server = sl.get('serverProxy');
    const editingUuid = ref('');
    const inputTranslation = ref('');
    const store = sl.get('store');
    const actions = sl.get('globalActions');
    const loading = ref(false);
    const viewingDialog = ref(false);
    const discourseWordInfo = ref<Word | null>(null);
    const viewingConnectSpellingDialog = ref(false);
    const connectSpellingDialogSpelling = ref('');
    const connectSpellingDialogDiscourseUuid = ref('');

    const allowEditing = computed(
      () => !disableEditing && store.hasPermission('EDIT_TRANSLATION')
    );

    const canConnectSpellings = computed(() =>
      store.hasPermission('CONNECT_SPELLING')
    );

    const discourseColor = (discourseType: string) => {
      switch (discourseType) {
        case 'paragraph':
          return 'red';
        case 'sentence':
          return 'blue';
        case 'clause':
          return 'purple';
        case 'phrase':
          return 'green';
        default:
          return 'black';
      }
    };

    const discourseReading = (discourse: DiscourseUnit) => {
      let reading;
      if (
        (discourse.type === 'discourseUnit' || discourse.type === 'sentence') &&
        discourse.translation
      ) {
        reading = discourse.translation;
      } else if (discourse.type === 'paragraph' && discourse.paragraphLabel) {
        reading = `<strong><em>${discourse.paragraphLabel}</em></strong>`;
      } else if (
        (discourse.type === 'clause' || discourse.type === 'phrase') &&
        discourse.paragraphLabel
      ) {
        reading = `<em>${discourse.paragraphLabel}</em>`;
      } else if (
        (discourse.type === 'word' || discourse.type === 'number') &&
        discourse.transcription &&
        discourse.explicitSpelling
      ) {
        reading = `${discourse.transcription} (${discourse.explicitSpelling})`;
      } else {
        reading = discourse.explicitSpelling;
      }

      return reading || '';
    };

    const startEdit = (discourse: DiscourseUnit) => {
      editingUuid.value = discourse.uuid || '';
      if (discourse.translation) {
        inputTranslation.value = discourse.translation || '';
      } else {
        inputTranslation.value = discourse.explicitSpelling || '';
      }
    };

    const editLoading = ref(false);
    const discourseEdit = async (discourse: DiscourseUnit) => {
      try {
        if (!textUuid) {
          throw new Error('No text uuid');
        }
        if (discourse.translation) {
          await server.updateDiscourseTranslation(
            discourse.uuid,
            inputTranslation.value,
            textUuid
          );
        } else {
          await server.createDiscourseTranslation(
            discourse.uuid,
            inputTranslation.value,
            textUuid
          );
        }
        editLoading.value = true;
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to update translations. Please try again.',
          err as Error
        );
      } finally {
        discourse.translation = inputTranslation.value;
        editingUuid.value = '';
        editLoading.value = false;
      }
    };

    const getSideByNumber = (number: number | null): EpigraphicUnitSide => {
      switch (number) {
        case 1:
          return 'obv.';
        case 2:
          return 'lo.e.';
        case 3:
          return 'rev.';
        case 4:
          return 'u.e.';
        case 5:
          return 'le.e.';
        default:
          return 'r.e.';
      }
    };

    const articulateDiscourseHierarchy = ref(false);

    const discourseSelections = ref<DiscourseUnit[]>([]);

    const canSelectDiscourseUnit = (unit: DiscourseUnit): boolean => {
      if (discourseSelections.value.length === 0) {
        return true;
      }
      if (discourseSelections.value[0].parentUuid !== unit.parentUuid) {
        return false;
      }
      const childNumArray = discourseSelections.value.map(
        selection => selection.childNum!
      );
      const minimumChildNumInText = Math.min(...childNumArray);
      const maximumChildNumInText = Math.max(...childNumArray);
      if (
        unit.childNum === minimumChildNumInText - 1 ||
        unit.childNum === maximumChildNumInText + 1 ||
        unit.childNum === minimumChildNumInText ||
        unit.childNum === maximumChildNumInText
      ) {
        return true;
      }
      return false;
    };

    watch(articulateDiscourseHierarchy, () => {
      if (!articulateDiscourseHierarchy.value) {
        discourseSelections.value = [];
      }
    });

    const insertParentDiscourseDialog = ref(false);

    const insertParentDiscourseKey = ref(false);
    watch(insertParentDiscourseDialog, () => {
      if (insertParentDiscourseDialog.value) {
        insertParentDiscourseKey.value = !insertParentDiscourseKey.value;
      } else {
        discourseSelections.value = [];
        articulateDiscourseHierarchy.value = false;
      }
    });

    const canInsertParentDiscourse = computed(
      () => textUuid && store.hasPermission('INSERT_PARENT_DISCOURSE_ROWS')
    );

    const insertParentDiscourseComponent = computed(() =>
      textUuid && canInsertParentDiscourse.value
        ? () => import('./InsertParentDiscourseDialog.vue')
        : null
    );

    const openConnectSpellingDialog = async (discourseUuid: string) => {
      try {
        const { spelling } = await server.getSpellingByDiscourseUuid(
          discourseUuid
        );
        viewingConnectSpellingDialog.value = true;
        connectSpellingDialogSpelling.value = spelling;
        connectSpellingDialogDiscourseUuid.value = discourseUuid;
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to load connect spelling view',
          err as Error
        );
      }
    };

    const openDialog = async (discourseUuid: string) => {
      try {
        loading.value = true;
        actions.showSnackbar('Fetching discourse information...');

        const spellingUuid = localDiscourseInfo
          ? localDiscourseInfo.filter(row => row.uuid === discourseUuid)[0]
              .spellingUuid
          : null;

        if (discourseUuid && !localDiscourseInfo) {
          discourseWordInfo.value = await server.getDictionaryInfoByDiscourseUuid(
            discourseUuid
          );
        } else if (spellingUuid && localDiscourseInfo) {
          discourseWordInfo.value = await server.getDictionaryInfoBySpellingUuid(
            spellingUuid
          );
        } else {
          discourseWordInfo.value = null;
        }
        actions.closeSnackbar();
        if (discourseWordInfo.value) {
          viewingDialog.value = true;
        } else if (canConnectSpellings.value && discourseUuid) {
          await openConnectSpellingDialog(discourseUuid);
        } else {
          actions.showSnackbar(
            'No information exists for this text discourse word'
          );
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve text discourse word info',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    return {
      discourseRenderer,
      discourseColor,
      discourseReading,
      startEdit,
      discourseEdit,
      formatLineNumber,
      editingUuid,
      inputTranslation,
      allowEditing,
      editLoading,
      getSideByNumber,
      articulateDiscourseHierarchy,
      discourseSelections,
      canSelectDiscourseUnit,
      insertParentDiscourseDialog,
      insertParentDiscourseKey,
      canInsertParentDiscourse,
      insertParentDiscourseComponent,
      openDialog,
      loading,
      discourseWordInfo,
      viewingDialog,
      viewingConnectSpellingDialog,
      connectSpellingDialogSpelling,
      connectSpellingDialogDiscourseUuid,
    };
  },
});
</script>

<template>
  <OareContentView
    :title="`Edit ${epigraphyResponse.text.name}`"
    :loading="epigraphyResponseLoading"
  >
    <v-card min-height="800px" class="pt-6" v-if="renderer" flat outlined>
      <edit-actions
        :currentEditAction="currentEditAction"
        @reset-current-edit-action="currentEditAction = undefined"
        @add-side="currentEditAction = 'addSide'"
        @add-column="currentEditAction = 'addColumn'"
        @add-region="currentEditAction = 'addRegion'"
        @add-line="currentEditAction = 'addLine'"
        @add-undetermined-lines="currentEditAction = 'addUndeterminedLines'"
        @add-word="currentEditAction = 'addWord'"
        @add-sign="currentEditAction = 'addSign'"
        @add-undetermined-signs="currentEditAction = 'addUndeterminedSigns'"
        @add-divider="currentEditAction = 'addDivider'"
        @edit-side="currentEditAction = 'editSide'"
        @edit-column="currentEditAction = 'editColumn'"
        @edit-region="currentEditAction = 'editRegion'"
        @edit-undetermined-lines="currentEditAction = 'editUndeterminedLines'"
        @edit-sign="currentEditAction = 'editSign'"
        @edit-undetermined-signs="currentEditAction = 'editUndeterminedSigns'"
        @edit-divider="currentEditAction = 'editDivider'"
        @split-line="currentEditAction = 'splitLine'"
        @split-word="currentEditAction = 'splitWord'"
        @split-sign="currentEditAction = 'splitSign'"
        @merge-line="currentEditAction = 'mergeLine'"
        @merge-word="currentEditAction = 'mergeWord'"
        @merge-sign="currentEditAction = 'mergeSign'"
        @reorder-sign="currentEditAction = 'reorderSign'"
        @clean-line="currentEditAction = 'cleanLine'"
        @remove-side="currentEditAction = 'removeSide'"
        @remove-column="currentEditAction = 'removeColumn'"
        @remove-region="currentEditAction = 'removeRegion'"
        @remove-line="currentEditAction = 'removeLine'"
        @remove-undetermined-lines="
          currentEditAction = 'removeUndeterminedLines'
        "
        @remove-word="currentEditAction = 'removeWord'"
        @remove-sign="currentEditAction = 'removeSign'"
        @remove-undetermined-signs="
          currentEditAction = 'removeUndeterminedSigns'
        "
        @remove-divider="currentEditAction = 'removeDivider'"
        @close-editor="closeEditor"
      />
      <v-row class="ma-0">
        <v-col cols="2" align="center" class="pt-9">
          <side-card
            v-for="(side, idx) in renderer.sides"
            :key="idx"
            :side="side"
            :selected="selectedSide === side"
            :showEditButton="false"
            @set-side="setSide(side)"
            class="ml-2"
          />
        </v-col>
        <v-col cols="10">
          <add-side
            v-if="currentEditAction === 'addSide'"
            :usableSides="usableSides"
            action="add"
            @cancel-add-side="currentEditAction = undefined"
            @side-selected="promptAddSide($event)"
            class="mt-8"
          />
          <add-side
            v-else-if="currentEditAction === 'removeSide'"
            :usableSides="alreadyUsedSides"
            action="remove"
            @cancel-add-side="currentEditAction = undefined"
            @side-selected="promptRemoveSide($event)"
            class="mt-8"
          />
          <edit-side
            v-else-if="selectedSide"
            :renderer="renderer"
            :side="selectedSide"
            :currentEditAction="currentEditAction"
            :textUuid="textUuid"
            @reset-renderer="resetRenderer"
            @reset-current-edit-action="currentEditAction = undefined"
            class="mr-2"
          />
        </v-col>
      </v-row>
    </v-card>

    <oare-dialog
      v-model="addSideDialog"
      :title="`Add ${sideToAdd} Side?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="addSide"
      :submitLoading="editTextLoading"
      >Are you sure you want to add this side?</oare-dialog
    >

    <oare-dialog
      v-model="removeSideDialog"
      :title="`Remove ${sideToRemove} Side?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeSide"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove this side? <b>WARNING: </b>All content
      still on this side upon deletion will also be deleted.</oare-dialog
    >

    <oare-dialog
      v-model="cleanLinesDialog"
      title="Clean up line numbers?"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="cleanLines"
      :submitLoading="editTextLoading"
      >This function can help resolve line numbering data errors. Database
      iterator columns will also be cleaned up. Are you sure you want to
      automatically regenerate all line numbers?</oare-dialog
    >

    <edit-side-dialog
      v-model="editSideDialog"
      :alreadyUsedSides="alreadyUsedSides"
      :textUuid="textUuid"
      :usableSides="usableSides"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="currentEditAction = undefined"
      @selected-side="selectedSide = $event"
    />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
  ComputedRef,
  watch,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import {
  AddSidePayload,
  CleanLinesPayload,
  EditTextAction,
  EpigraphyResponse,
  LocaleCode,
  RemoveSidePayload,
  EpigraphicUnitSide,
} from '@oare/types';
import { TabletRenderer, createTabletRenderer } from '@oare/oare';
import i18n from '@/i18n';
import SideCard from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/SideCard.vue';
import EditActions from './components/EditActions.vue';
import EditSide from './components/EditSide.vue';
import AddSide from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/AddSide.vue';
import EditSideDialog from './components/EditSideDialog.vue';

export default defineComponent({
  props: {
    textUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    SideCard,
    EditActions,
    EditSide,
    AddSide,
    EditSideDialog,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const router = sl.get('router');

    const epigraphyResponseLoading = ref(false);
    const epigraphyResponse = ref<EpigraphyResponse>({
      canWrite: false,
      text: {
        uuid: '',
        type: '',
        name: '',
        excavationPrefix: '',
        excavationNumber: '',
        museumPrefix: '',
        museumNumber: '',
        publicationPrefix: '',
        publicationNumber: '',
      },
      collection: {
        uuid: '',
        name: '',
      },
      cdliNum: '',
      units: [],
      color: '',
      colorMeaning: '',
      discourseUnits: [],
      hasEpigraphy: false,
      zoteroData: [],
    });

    const renderer = ref<TabletRenderer>();

    const resetRenderer = async () => {
      try {
        epigraphyResponseLoading.value = true;
        epigraphyResponse.value = await server.getEpigraphicInfo(
          props.textUuid
        );

        renderer.value = createTabletRenderer(
          epigraphyResponse.value.units,
          i18n.locale as LocaleCode,
          {
            showNullDiscourse: store.getters.isAdmin,
            textFormat: 'html',
          }
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading text information. Please try again.',
          err as Error
        );
      } finally {
        epigraphyResponseLoading.value = false;
      }
    };

    onMounted(async () => {
      await resetRenderer();
      selectedSide.value = renderer.value!.sides[0] || 'obv.';
    });

    const selectedSide = ref<EpigraphicUnitSide>();
    const setSide = (side: EpigraphicUnitSide) => {
      selectedSide.value = side;
    };
    const sideTypes: ComputedRef<EpigraphicUnitSide[]> = computed(() => [
      'obv.',
      'lo.e.',
      'rev.',
      'u.e.',
      'le.e.',
      'r.e.',
      'mirror text',
      'legend',
      'suppl. tablet',
      'obv. ii',
    ]);
    const usableSides = computed(() => {
      if (!renderer.value) {
        return [];
      }
      return sideTypes.value.filter(
        type => !renderer.value!.sides.includes(type)
      );
    });
    const alreadyUsedSides = computed(() => {
      if (!renderer.value) {
        return [];
      }
      return sideTypes.value.filter(type =>
        renderer.value!.sides.includes(type)
      );
    });

    const currentEditAction = ref<EditTextAction>();

    const editTextLoading = ref(false);

    const addSideDialog = ref(false);
    const sideToAdd = ref<EpigraphicUnitSide>();
    const promptAddSide = (side: EpigraphicUnitSide) => {
      sideToAdd.value = side;
      addSideDialog.value = true;
    };
    const addSide = async () => {
      try {
        editTextLoading.value = true;
        if (!sideToAdd.value) {
          throw new Error('No side to add');
        }
        const payload: AddSidePayload = {
          type: 'addSide',
          side: sideToAdd.value,
          textUuid: props.textUuid,
        };
        await server.editText(payload);
        await resetRenderer();
        selectedSide.value = sideToAdd.value;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding side. Please try again.',
          err as Error
        );
      } finally {
        sideToAdd.value = undefined;
        addSideDialog.value = false;
        currentEditAction.value = undefined;
        editTextLoading.value = false;
      }
    };

    const editSideDialog = ref(false);
    watch(currentEditAction, () => {
      if (currentEditAction.value === 'editSide') {
        editSideDialog.value = true;
      }
    });
    watch(editSideDialog, () => {
      if (!editSideDialog.value) {
        currentEditAction.value = undefined;
      }
    });

    const removeSideDialog = ref(false);
    const sideToRemove = ref<EpigraphicUnitSide>();
    const promptRemoveSide = (side: EpigraphicUnitSide) => {
      sideToRemove.value = side;
      removeSideDialog.value = true;
    };
    const removeSide = async () => {
      try {
        editTextLoading.value = true;
        if (!sideToRemove.value) {
          throw new Error('No side to remove');
        }
        const payload: RemoveSidePayload = {
          type: 'removeSide',
          side: sideToRemove.value,
          textUuid: props.textUuid,
        };
        await server.editText(payload);
        await resetRenderer();
        if (selectedSide.value === sideToRemove.value) {
          selectedSide.value =
            renderer.value!.sides[renderer.value!.sides.length - 1] ||
            undefined;
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing side. Please try again.',
          err as Error
        );
      } finally {
        sideToRemove.value = undefined;
        removeSideDialog.value = false;
        currentEditAction.value = undefined;
        editTextLoading.value = false;
      }
    };

    const cleanLinesDialog = ref(false);
    const cleanLines = async () => {
      try {
        editTextLoading.value = true;
        const payload: CleanLinesPayload = {
          type: 'cleanLine',
          textUuid: props.textUuid,
        };
        await server.editText(payload);
        await resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error cleaning lines. Please try again.',
          err as Error
        );
      } finally {
        cleanLinesDialog.value = false;
        currentEditAction.value = undefined;
        editTextLoading.value = false;
      }
    };
    watch(currentEditAction, () => {
      if (currentEditAction.value === 'cleanLine') {
        cleanLinesDialog.value = true;
      }
    });
    watch(cleanLinesDialog, () => {
      if (!cleanLinesDialog.value) {
        currentEditAction.value = undefined;
      }
    });

    const closeEditor = () => {
      router.push(`/epigraphies/${props.textUuid}`);
    };

    return {
      epigraphyResponse,
      epigraphyResponseLoading,
      renderer,
      selectedSide,
      setSide,
      usableSides,
      currentEditAction,
      promptAddSide,
      addSideDialog,
      sideToAdd,
      addSide,
      editTextLoading,
      resetRenderer,
      closeEditor,
      alreadyUsedSides,
      removeSideDialog,
      sideToRemove,
      promptRemoveSide,
      removeSide,
      cleanLinesDialog,
      cleanLines,
      editSideDialog,
    };
  },
});
</script>

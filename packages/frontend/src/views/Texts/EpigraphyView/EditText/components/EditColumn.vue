<template>
  <v-col>
    <v-row class="ma-0">
      <b>{{ `Column ${column}` }}</b>

      <v-spacer />

      <v-tooltip bottom v-if="currentEditAction === 'removeColumn'">
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            x-small
            fab
            color="red"
            v-on="on"
            v-bind="attrs"
            @click="removeColumnDialog = true"
          >
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>
        <span>Remove Column</span>
      </v-tooltip>

      <v-tooltip
        bottom
        v-if="column !== 1 && currentEditAction === 'editColumn'"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            x-small
            fab
            color="info"
            v-on="on"
            v-bind="attrs"
            @click="promptEditColumn('left')"
          >
            <v-icon small>mdi-arrow-left</v-icon>
          </v-btn>
        </template>
        <span>Move Column Left</span>
      </v-tooltip>
      <v-tooltip
        bottom
        v-if="
          column !== renderer.columnsOnSide(side).length &&
          currentEditAction === 'editColumn'
        "
      >
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            x-small
            fab
            color="info"
            v-on="on"
            v-bind="attrs"
            @click="promptEditColumn('right')"
          >
            <v-icon small>mdi-arrow-right</v-icon>
          </v-btn>
        </template>
        <span>Move Column Right</span>
      </v-tooltip>
    </v-row>

    <v-card flat outlined min-height="675px">
      <v-row
        v-if="
          currentEditAction === 'addRegion' ||
          currentEditAction === 'addLine' ||
          currentEditAction === 'addUndeterminedLines'
        "
        class="ma-0 mb-n6 ml-n3"
      >
        <insert-button @insert="handleInsertLine(undefined)" />
        <v-divider class="mt-3" />
      </v-row>
      <div
        v-for="(line, idx) in renderer.linesInColumn(column, side)"
        :key="idx"
      >
        <edit-row
          :line="line"
          :renderer="renderer"
          :currentEditAction="currentEditAction"
          :textUuid="textUuid"
          :selectedLines="selectedLines"
          :column="column"
          :side="side"
          @reset-renderer="resetRenderer"
          @reset-current-edit-action="resetCurrentEditAction"
          @toggle-select-line="$emit('toggle-select-line', $event)"
        />
        <v-row
          v-if="
            currentEditAction === 'addRegion' ||
            currentEditAction === 'addLine' ||
            currentEditAction === 'addUndeterminedLines'
          "
          class="ma-0 mb-n6 mt-n8 ml-n3"
        >
          <insert-button @insert="handleInsertLine(line)" />
          <v-divider class="mt-3" />
        </v-row>
      </div>
    </v-card>

    <add-region-dialog
      v-model="addRegionDialog"
      :side="side"
      :column="column"
      :previousLineNumber="addRegionPreviousLineNumber"
      :key="addRegionPreviousLineNumber"
      :textUuid="textUuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
      :renderer="renderer"
    />

    <add-undetermined-lines-dialog
      v-model="addUndeterminedLinesDialog"
      :side="side"
      :column="column"
      :previousLineNumber="addUndeterminedLinesPreviousLineNumber"
      :key="addUndeterminedLinesPreviousLineNumber"
      :textUuid="textUuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
      :renderer="renderer"
    />

    <add-line-dialog
      v-model="addLineDialog"
      :key="addLinePreviousLineNumber"
      :previousLineNumber="addLinePreviousLineNumber"
      :textUuid="textUuid"
      :renderer="renderer"
      :column="column"
      :side="side"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />

    <oare-dialog
      v-model="editColumnDialog"
      title="Change Column Order?"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="editColumn"
      :submitLoading="editTextLoading"
      >Are you sure you want to move column {{ column }} to the
      {{ columnChangeDirection }}? Column {{ column }} will become Column
      {{ columnChangeDirection === 'right' ? column + 1 : column - 1 }} and vice
      versa.</oare-dialog
    >

    <oare-dialog
      v-model="removeColumnDialog"
      :title="`Remove Column ${column}?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeColumn"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove column {{ column }}? <b>WARNING: </b>All
      content on this column will also be deleted.</oare-dialog
    >
  </v-col>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { TabletRenderer } from '@oare/oare';
import {
  EpigraphicUnitSide,
  EditTextAction,
  EditColumnPayload,
  RemoveColumnPayload,
} from '@oare/types';
import EditRow from './EditRow.vue';
import InsertButton from './InsertButton.vue';
import AddRegionDialog from './AddRegionDialog.vue';
import sl from '@/serviceLocator';
import AddLineDialog from './AddLineDialog.vue';
import AddUndeterminedLinesDialog from './AddUndeterminedLinesDialog.vue';

export default defineComponent({
  props: {
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    column: {
      type: Number,
      required: true,
    },
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
    currentEditAction: {
      type: String as PropType<EditTextAction>,
      required: false,
    },
    selectedLines: {
      type: Array as PropType<number[]>,
      required: true,
    },
  },
  components: {
    EditRow,
    InsertButton,
    AddRegionDialog,
    AddLineDialog,
    AddUndeterminedLinesDialog,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editTextLoading = ref(false);

    const resetRenderer = () => {
      emit('reset-renderer');
    };

    const resetCurrentEditAction = () => {
      emit('reset-current-edit-action');
    };

    const addRegionDialog = ref(false);
    watch(addRegionDialog, () => {
      if (!addRegionDialog.value) {
        resetCurrentEditAction();
      }
    });
    const addRegionPreviousLineNumber = ref<number>();
    const setupAddRegionDialog = (previousLine: number | undefined) => {
      // Can be undefined if first line
      addRegionPreviousLineNumber.value = previousLine;
      addRegionDialog.value = true;
    };

    const editColumnDialog = ref(false);
    const columnChangeDirection = ref<'left' | 'right'>();
    const promptEditColumn = (direction: 'left' | 'right') => {
      columnChangeDirection.value = direction;
      editColumnDialog.value = true;
    };
    const editColumn = async () => {
      try {
        editTextLoading.value = true;
        if (!columnChangeDirection.value) {
          throw new Error('No column change direction selected.');
        }
        const payload: EditColumnPayload = {
          type: 'editColumn',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          direction: columnChangeDirection.value,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar('Error changing column order', err as Error);
      } finally {
        editColumnDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };

    const removeColumnDialog = ref(false);
    const removeColumn = async () => {
      try {
        editTextLoading.value = true;
        const payload: RemoveColumnPayload = {
          type: 'removeColumn',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing column. Please try again.',
          err as Error
        );
      } finally {
        removeColumnDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };
    watch(removeColumnDialog, () => {
      if (!removeColumnDialog.value) {
        resetCurrentEditAction();
      }
    });

    const handleInsertLine = (previousLine: number | undefined) => {
      if (props.currentEditAction === 'addRegion') {
        setupAddRegionDialog(previousLine);
      } else if (props.currentEditAction === 'addLine') {
        setupAddLineDialog(previousLine);
      } else if (props.currentEditAction === 'addUndeterminedLines') {
        setupAddUndeterminedLinesDialog(previousLine);
      }
    };

    const addLineDialog = ref(false);
    watch(addLineDialog, () => {
      if (!addLineDialog.value) {
        resetCurrentEditAction();
      }
    });
    const addLinePreviousLineNumber = ref<number>();
    const setupAddLineDialog = (previousLine: number | undefined) => {
      // Can be undefined if first line
      addLinePreviousLineNumber.value = previousLine;
      addLineDialog.value = true;
    };

    const addUndeterminedLinesDialog = ref(false);
    watch(addUndeterminedLinesDialog, () => {
      if (!addUndeterminedLinesDialog.value) {
        addUndeterminedLinesPreviousLineNumber.value = undefined;
        resetCurrentEditAction();
      }
    });
    const addUndeterminedLinesPreviousLineNumber = ref<number>();
    const setupAddUndeterminedLinesDialog = (
      previousLine: number | undefined
    ) => {
      // Can be undefined if first line
      addUndeterminedLinesPreviousLineNumber.value = previousLine;
      addUndeterminedLinesDialog.value = true;
    };

    return {
      addRegionDialog,
      setupAddRegionDialog,
      addRegionPreviousLineNumber,
      resetRenderer,
      resetCurrentEditAction,
      editColumnDialog,
      columnChangeDirection,
      promptEditColumn,
      editTextLoading,
      editColumn,
      removeColumnDialog,
      removeColumn,
      handleInsertLine,
      addLineDialog,
      addLinePreviousLineNumber,
      setupAddLineDialog,
      addUndeterminedLinesDialog,
      addUndeterminedLinesPreviousLineNumber,
      setupAddUndeterminedLinesDialog,
    };
  },
});
</script>

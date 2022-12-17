<template>
  <div>
    <v-card flat min-height="700px">
      <v-row justify="space-around" class="ma-0">
        <edit-column
          v-for="(column, idx) in renderer.columnsOnSide(side)"
          :key="idx"
          :column="column"
          :renderer="renderer"
          :side="side"
          :textUuid="textUuid"
          :currentEditAction="currentEditAction"
          :selectedLines="selectedLines"
          @reset-current-edit-action="resetCurrentEditAction"
          @reset-renderer="resetRenderer"
          @toggle-select-line="handleSelectLine($event)"
        />
      </v-row>
    </v-card>

    <oare-dialog
      v-model="addColumnDialog"
      :title="`Add Column to ${side}`"
      :persistent="false"
      :showSubmit="false"
      :submitLoading="editTextLoading"
    >
      <v-row class="ma-0"
        >Select where you would like to add a new column.</v-row
      >
      <v-row justify="center" align="center" class="mt-8 mb-6">
        <insert-button @insert="addColumn(1)" />
        <span v-for="(col, idx) in renderer.columnsOnSide(side)" :key="idx">
          <v-icon size="80" class="mx-2">mdi-text-long</v-icon>
          <insert-button @insert="addColumn(idx + 2)" />
        </span>
      </v-row>
    </oare-dialog>

    <oare-dialog
      v-model="mergeLineDialog"
      title="Merge Lines?"
      :persistent="false"
      submitText="Yes"
      cancelText="No"
      :submitLoading="editTextLoading"
      @submit="mergeLines"
      >Are you sure you want to merge lines {{ Math.min(...selectedLines) }} and
      {{ Math.max(...selectedLines) }}? The content on these lines will
      subsequently all appear on line
      {{ Math.min(...selectedLines) }}.</oare-dialog
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { TabletRenderer } from '@oare/oare';
import {
  EpigraphicUnitSide,
  EditTextAction,
  AddColumnPayload,
  MergeLinePayload,
} from '@oare/types';
import EditColumn from './EditColumn.vue';
import sl from '@/serviceLocator';
import InsertButton from './InsertButton.vue';

export default defineComponent({
  props: {
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
    currentEditAction: {
      type: String as PropType<EditTextAction>,
      required: false,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    EditColumn,
    InsertButton,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editTextLoading = ref(false);

    const addColumnDialog = ref(false);
    const addColumn = async (column: number) => {
      try {
        editTextLoading.value = true;
        const payload: AddColumnPayload = {
          type: 'addColumn',
          textUuid: props.textUuid,
          side: props.side,
          column,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding column. Please try again.',
          err as Error
        );
      } finally {
        addColumnDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };
    watch(addColumnDialog, () => {
      if (!addColumnDialog.value) {
        resetCurrentEditAction();
      }
    });

    const resetRenderer = () => {
      emit('reset-renderer');
    };

    const resetCurrentEditAction = () => {
      emit('reset-current-edit-action');
    };

    watch(
      () => props.currentEditAction,
      () => {
        if (props.currentEditAction === 'addColumn') {
          addColumnDialog.value = true;
        }
      }
    );

    const mergeLineDialog = ref(false);
    const selectedLines = ref<number[]>([]);
    const handleSelectLine = (line: number) => {
      if (selectedLines.value.includes(line)) {
        selectedLines.value = selectedLines.value.filter(l => l !== line);
      } else {
        selectedLines.value.push(line);
      }
    };
    watch(selectedLines, () => {
      if (selectedLines.value.length === 2) {
        mergeLineDialog.value = true;
      }
    });
    watch(mergeLineDialog, () => {
      if (!mergeLineDialog.value) {
        selectedLines.value = [];
        resetCurrentEditAction();
      }
    });
    const mergeLines = async () => {
      try {
        editTextLoading.value = true;
        if (selectedLines.value.length !== 2) {
          throw new Error('Two lines must be selected in order to merge.');
        }
        const payload: MergeLinePayload = {
          type: 'mergeLine',
          textUuid: props.textUuid,
          firstLine: Math.min(...selectedLines.value),
          secondLine: Math.max(...selectedLines.value),
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar('Error merging lines. Please try again.');
      } finally {
        selectedLines.value = [];
        mergeLineDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };

    return {
      editTextLoading,
      addColumnDialog,
      addColumn,
      resetRenderer,
      resetCurrentEditAction,
      selectedLines,
      handleSelectLine,
      mergeLineDialog,
      mergeLines,
    };
  },
});
</script>

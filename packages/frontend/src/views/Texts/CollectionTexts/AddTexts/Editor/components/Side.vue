<template>
  <div class="mb-10">
    <v-row justify="space-around">
      <special-chars :disabled="!sideHasFocus" />
      <v-col v-for="(column, idx) in columns" :key="column.uuid">
        <column
          :columnNumber="idx + 1"
          :startingLine="getStartingLine(idx)"
          :beginningBrokenAreas="getStartingBreak(idx)"
          :beginsWithBreak="getBeginningBreakStatus(idx)"
          :isCurrentColumn="isCurrentSide && currentColumn === column.uuid"
          @remove-column="removeColumn(idx)"
          @add-column-after="addColumnAfter(idx)"
          @last-line="setLastLine(idx, $event)"
          @broken-area="setBrokenArea(idx, $event)"
          @ends-broken="setEndBreakStatus(idx, $event)"
          @dirty-status="setDirtyStatus(idx, $event)"
          @update-column-rows="setColumnRows(idx, $event)"
          @set-current-column="setCurrentColumn(column.uuid)"
          @set-column-focus="setColumnFocusStatus(column.uuid, $event)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { EpigraphicUnitSide, RowContent, ColumnContent } from '@oare/types';
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { v4 } from 'uuid';
import Column from './Column.vue';
import SpecialChars from './SpecialChars.vue';

export interface Column {
  uuid: string;
  lastLine: number;
  breaks: number;
  endsBroken: boolean;
  isDirty: boolean;
  rows: RowContent[];
}

export default defineComponent({
  props: {
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
    startingLine: {
      type: Number,
      required: true,
    },
    beginsWithBreak: {
      type: Boolean,
      required: true,
    },
    beginningBrokenAreas: {
      type: Number,
      default: 0,
    },
    isCurrentSide: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    Column,
    SpecialChars,
  },
  setup(props, { emit }) {
    const columns = ref<Column[]>([
      {
        uuid: v4(),
        lastLine: 0,
        breaks: 0,
        endsBroken: false,
        isDirty: false,
        rows: [],
      },
    ]);

    const addColumnAfter = (index: number) => {
      const newColumnUuid = v4();
      columns.value.splice(index + 1, 0, {
        uuid: newColumnUuid,
        lastLine: 0,
        breaks: 0,
        endsBroken: false,
        isDirty: false,
        rows: [],
      });
    };

    const removeColumn = (index: number) => {
      columns.value.splice(index, 1);
    };

    const setLastLine = (index: number, lastLine: number) => {
      columns.value[index].lastLine = lastLine;
    };

    const getStartingLine = (index: number) => {
      if (index === 0) {
        return props.startingLine;
      }
      let startingLine = 0;
      for (let i = index - 1; i >= 0 && !startingLine; i -= 1) {
        if (columns.value[i].lastLine !== 0) {
          startingLine = columns.value[i].lastLine;
        }
      }
      return Math.floor(startingLine);
    };

    const setBrokenArea = (index: number, breaks: number) => {
      columns.value[index].breaks = breaks;
    };

    const getStartingBreak = (index: number) => {
      if (index === 0) {
        return props.beginningBrokenAreas;
      }
      let startingBreak = props.beginningBrokenAreas;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (columns.value[i].breaks !== 0) {
          startingBreak += columns.value[i].breaks;
        }
      }
      return startingBreak;
    };

    const setEndBreakStatus = (index: number, status: boolean) => {
      columns.value[index].endsBroken = status;
    };

    const getBeginningBreakStatus = (index: number) => {
      if (index === 0) {
        return props.beginsWithBreak;
      }
      let startingBreak = false;
      let foundDirty = false;

      for (let i = index - 1; i >= 0 && !startingBreak && !foundDirty; i -= 1) {
        if (columns.value[i].isDirty) {
          foundDirty = true;
        }
        if (columns.value[i].endsBroken) {
          startingBreak = true;
        }
      }
      return startingBreak;
    };

    const setDirtyStatus = (index: number, status: boolean) => {
      columns.value[index].isDirty = status;
    };

    watch(
      columns,
      () => {
        let lastLineNumber = 0;
        for (
          let i = columns.value.length - 1;
          i >= 0 && !lastLineNumber;
          i -= 1
        ) {
          if (columns.value[i].lastLine) {
            lastLineNumber = columns.value[i].lastLine;
          }
        }
        emit('side-last-line', lastLineNumber);

        let foundDirtyColumn = false;
        let sideEndsBroken = false;
        for (
          let i = columns.value.length - 1;
          i >= 0 && !foundDirtyColumn;
          i -= 1
        ) {
          if (columns.value[i].isDirty) {
            foundDirtyColumn = true;
            sideEndsBroken = columns.value[i].endsBroken;
          }
        }
        emit('side-ends-broken', sideEndsBroken);

        let numBrokenAreas = 0;
        for (let i = 0; i < columns.value.length; i += 1) {
          numBrokenAreas += columns.value[i].breaks;
        }
        emit('side-broken-area', numBrokenAreas);

        let isDirty = false;
        for (let i = 0; i < columns.value.length && !isDirty; i += 1) {
          isDirty = columns.value[i].isDirty;
        }
        emit('side-dirty-status', isDirty);

        const columnContent: ColumnContent[] = columns.value.map(column => ({
          uuid: column.uuid,
          rows: column.rows,
        }));
        emit('update-side-columns', columnContent);
      },
      {
        deep: true,
      }
    );

    const setColumnRows = (index: number, rows: RowContent[]) => {
      columns.value.splice(index, 1, {
        ...columns.value[index],
        rows,
      });
    };

    const currentColumn = ref<string>();
    const setCurrentColumn = (columnUuid?: string) => {
      currentColumn.value = columnUuid;
      emit('set-current-side');
    };

    const sideHasFocus = ref(false);
    const columnFocusStatuses = ref<{ [columnUuid: string]: boolean }>({});
    const setColumnFocusStatus = (uuid: string, value: boolean) => {
      columnFocusStatuses.value[uuid] = value;
      setTimeout(
        () =>
          (sideHasFocus.value = Object.values(
            columnFocusStatuses.value
          ).includes(true)),
        100
      );
    };

    return {
      addColumnAfter,
      removeColumn,
      columns,
      setLastLine,
      getStartingLine,
      setBrokenArea,
      getStartingBreak,
      setEndBreakStatus,
      getBeginningBreakStatus,
      setDirtyStatus,
      setColumnRows,
      currentColumn,
      setCurrentColumn,
      columnFocusStatuses,
      setColumnFocusStatus,
      sideHasFocus,
    };
  },
});
</script>

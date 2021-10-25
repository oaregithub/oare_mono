<template>
  <div class="mb-10">
    <v-card
      v-if="columns.length === 0"
      outlined
      rounded
      :min-height="100"
      class="my-4"
    >
      <v-row justify="center" class="mt-12">
        Select the number of columns in this portion of the text.
      </v-row>
      <v-row justify="center">
        Columns can also be added or removed later
      </v-row>
      <v-row justify="center" class="mb-12">
        <column-option
          v-for="(option, idx) in columnOptions"
          :key="idx"
          :columns="option"
          class="ma-2 cursor-display"
          @set-column="setColumnNumber(option)"
        />
      </v-row>
    </v-card>
    <v-row justify="space-around" v-if="columns.length !== 0">
      <v-col v-for="(column, idx) in columns" :key="column.uuid">
        <column
          :columnNumber="idx + 1"
          :startingLine="getStartingLine(idx)"
          :beginningBrokenAreas="getStartingBreak(idx)"
          :beginsWithBreak="getBeginningBreakStatus(idx)"
          @remove-column="removeColumn(idx)"
          @add-column-after="addColumnAfter(idx)"
          @last-line="setLastLine(idx, $event)"
          @broken-area="setBrokenArea(idx, $event)"
          @ends-broken="setEndBreakStatus(idx, $event)"
          @dirty-status="setDirtyStatus(idx, $event)"
          @update-column-rows="setColumnRows(idx, $event)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { SideOption, RowContent, ColumnContent } from '@oare/types';
import { defineComponent, PropType, ref, watch } from '@vue/composition-api';
import { v4 } from 'uuid';
import ColumnOption from './ColumnOption.vue';
import Column from './Column.vue';

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
      type: String as PropType<SideOption>,
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
  },
  components: {
    ColumnOption,
    Column,
  },
  setup(props, { emit }) {
    const columnOptions = ref([1, 2, 3, 4]);

    const columns = ref<Column[]>([]);

    const setColumnNumber = (number: number) => {
      for (let i = 0; i < number; i += 1) {
        const newColumnUuid = v4();
        columns.value.push({
          uuid: newColumnUuid,
          lastLine: 0,
          breaks: 0,
          endsBroken: false,
          isDirty: false,
          rows: [],
        });
      }
    };

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

    return {
      columnOptions,
      setColumnNumber,
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
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>

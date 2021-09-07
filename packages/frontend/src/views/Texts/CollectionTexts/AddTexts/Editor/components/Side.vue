<template>
  <div class="mb-10">
    <v-card
      v-if="columnUuids.length === 0"
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
    <v-row justify="space-around" v-if="columnUuids.length !== 0">
      <v-col v-for="(columnUuid, idx) in columnUuids" :key="columnUuid.uuid">
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
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { SideOption } from '@oare/types';
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

    const columnUuids = ref<Column[]>([]);

    const setColumnNumber = (number: number) => {
      for (let i = 0; i < number; i += 1) {
        const newColumnUuid = v4();
        columnUuids.value.push({
          uuid: newColumnUuid,
          lastLine: 0,
          breaks: 0,
          endsBroken: false,
          isDirty: false,
        });
      }
    };

    const addColumnAfter = (index: number) => {
      const newColumnUuid = v4();
      columnUuids.value.splice(index + 1, 0, {
        uuid: newColumnUuid,
        lastLine: 0,
        breaks: 0,
        endsBroken: false,
        isDirty: false,
      });
    };

    const removeColumn = (index: number) => {
      columnUuids.value.splice(index, 1);
    };

    const setLastLine = (index: number, lastLine: number) => {
      columnUuids.value[index].lastLine = lastLine;
    };

    const getStartingLine = (index: number) => {
      if (index === 0) {
        return props.startingLine;
      }
      let startingLine = 0;
      for (let i = index - 1; i >= 0 && !startingLine; i -= 1) {
        if (columnUuids.value[i].lastLine !== 0) {
          startingLine = columnUuids.value[i].lastLine;
        }
      }
      return Math.floor(startingLine);
    };

    const setBrokenArea = (index: number, breaks: number) => {
      columnUuids.value[index].breaks = breaks;
    };

    const getStartingBreak = (index: number) => {
      if (index === 0) {
        return props.beginningBrokenAreas;
      }
      let startingBreak = props.beginningBrokenAreas;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (columnUuids.value[i].breaks !== 0) {
          startingBreak += columnUuids.value[i].breaks;
        }
      }
      return startingBreak;
    };

    const setEndBreakStatus = (index: number, status: boolean) => {
      columnUuids.value[index].endsBroken = status;
    };

    const getBeginningBreakStatus = (index: number) => {
      if (index === 0) {
        return props.beginsWithBreak;
      }
      let startingBreak = false;
      let foundDirty = false;

      for (let i = index - 1; i >= 0 && !startingBreak && !foundDirty; i -= 1) {
        if (columnUuids.value[i].isDirty) {
          foundDirty = true;
        }
        if (columnUuids.value[i].endsBroken) {
          startingBreak = true;
        }
      }
      return startingBreak;
    };

    const setDirtyStatus = (index: number, status: boolean) => {
      columnUuids.value[index].isDirty = status;
    };

    watch(
      columnUuids,
      () => {
        let lastLineNumber = 0;
        for (
          let i = columnUuids.value.length - 1;
          i >= 0 && !lastLineNumber;
          i -= 1
        ) {
          if (columnUuids.value[i].lastLine) {
            lastLineNumber = columnUuids.value[i].lastLine;
          }
        }
        emit('side-last-line', lastLineNumber);

        let foundDirtyColumn = false;
        let sideEndsBroken = false;
        for (
          let i = columnUuids.value.length - 1;
          i >= 0 && !foundDirtyColumn;
          i -= 1
        ) {
          if (columnUuids.value[i].isDirty) {
            foundDirtyColumn = true;
            sideEndsBroken = columnUuids.value[i].endsBroken;
          }
        }
        emit('side-ends-broken', sideEndsBroken);

        let numBrokenAreas = 0;
        for (let i = 0; i < columnUuids.value.length; i += 1) {
          numBrokenAreas += columnUuids.value[i].breaks;
        }
        emit('side-broken-area', numBrokenAreas);

        let isDirty = false;
        for (let i = 0; i < columnUuids.value.length && !isDirty; i += 1) {
          isDirty = columnUuids.value[i].isDirty;
        }
        emit('side-dirty-status', isDirty);
      },
      {
        deep: true,
      }
    );

    return {
      columnOptions,
      setColumnNumber,
      addColumnAfter,
      removeColumn,
      columnUuids,
      setLastLine,
      getStartingLine,
      setBrokenArea,
      getStartingBreak,
      setEndBreakStatus,
      getBeginningBreakStatus,
      setDirtyStatus,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>

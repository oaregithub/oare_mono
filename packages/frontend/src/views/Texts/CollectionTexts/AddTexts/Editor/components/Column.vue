<template>
  <div>
    <v-row class="ma-2">
      <b class="mt-2">{{ `Column ${columnNumber}` }}</b>
      <v-spacer />
      <v-speed-dial
        v-model="columnEditMenu"
        direction="left"
        :open-on-hover="true"
        transition="slide-x-reverse-transition"
      >
        <template v-slot:activator>
          <v-btn v-model="columnEditMenu" color="info" dark fab x-small>
            <v-icon v-if="columnEditMenu"> mdi-close </v-icon>
            <v-icon v-else> mdi-pencil </v-icon>
          </v-btn>
        </template>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              fab
              dark
              x-small
              color="primary"
              v-on="on"
              v-bind="attrs"
              @click="$emit('add-column-after')"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <span>Add Column After</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              fab
              dark
              x-small
              color="red"
              v-on="on"
              v-bind="attrs"
              @click="$emit('remove-column')"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
          <span>Remove Column</span>
        </v-tooltip>
      </v-speed-dial>
    </v-row>
    <v-card outlined rounded min-height="400px" min-width="325px">
      <insert-button
        :hasAddedRow="hasAddedRow"
        :showDivider="false"
        @add-row="addRowAfter($event, -1)"
      />
      <v-row
        v-if="!hasAddedRow"
        justify="center"
        class="mx-8 mt-12 text-center"
      >
        Lines, breaks, seal impressions, and other elements can be added using
        the plus icon in the top left.
      </v-row>
      <div v-for="(row, idx) in rowsWithLineNumbers" :key="row.uuid">
        <row
          :row="row"
          :autofocus="newRow === idx"
          :isCurrentRow="isCurrentColumn && currentRow === row.uuid"
          @add-row-after="addRowAfter('Line', idx, $event)"
          @remove-row="removeRow(idx)"
          @update-row-content="updateRowContent(idx, $event)"
          @reset-new-row="newRow = undefined"
          @set-current-row="setCurrentRow(row.uuid)"
          @set-focused="setRowFocusStatus(row.uuid, $event)"
        />
        <insert-button
          :hasAddedRow="hasAddedRow"
          @add-row="addRowAfter($event, idx)"
        />
      </div>
    </v-card>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  ComputedRef,
  watch,
} from '@vue/composition-api';
import InsertButton from './InsertButton.vue';
import Row from './Row.vue';
import { v4 } from 'uuid';
import {
  RowTypes,
  RowContent,
  EditorWord,
  SignCodeWithDiscourseUuid,
} from '@oare/types';

export interface Row {
  type: RowTypes;
  uuid: string;
  lineValue?: number;
  isEditing: boolean;
  text?: string;
  signs?: SignCodeWithDiscourseUuid[];
  selectedSign?: number;
  words?: EditorWord[];
  reading?: string;
  hasErrors: boolean;
}

export interface RowWithLine extends Row {
  line: number | undefined;
}

export default defineComponent({
  props: {
    columnNumber: {
      type: Number,
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
    isCurrentColumn: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    InsertButton,
    Row,
  },
  setup(props, { emit }) {
    const columnEditMenu = ref(false);

    const hasAddedRow = ref(false);

    const rows = ref<Row[]>([]);
    const rowsWithLineNumbers: ComputedRef<RowWithLine[]> = computed(() => {
      let line = props.beginsWithBreak ? 0 : props.startingLine;
      let currentLine: number | undefined;
      let brokenAreas = props.beginningBrokenAreas;
      let brokenAreasAdded = 0;
      return rows.value.map((row, idx) => {
        if (
          row.type === 'Line' ||
          row.type === 'Broken Line(s)' ||
          row.type === 'Uninscribed Line(s)'
        ) {
          if (brokenAreas && brokenAreasAdded !== brokenAreas) {
            const decimal = 0.01 * brokenAreas;
            line += decimal;
            brokenAreasAdded = brokenAreas;
          }
          line += row.lineValue || 1;
          currentLine = line;
        } else {
          currentLine = undefined;
          if (row.type === 'Broken Area') {
            line = 0;
            if (
              (!props.beginsWithBreak && idx <= 0) ||
              (idx > 0 && rows.value[idx - 1].type !== 'Broken Area')
            ) {
              brokenAreas += 1;
            }
          }
        }
        return {
          ...row,
          line: currentLine,
        };
      });
    });

    const newRow = ref<number>();
    const addRowAfter = (
      type: RowTypes,
      index: number,
      defaultText?: string
    ) => {
      newRow.value = index + 1;
      hasAddedRow.value = true;
      if (index === -1) {
        rows.value.unshift({
          type,
          uuid: v4(),
          isEditing: false,
          hasErrors: false,
          text: defaultText,
        });
      } else {
        rows.value.splice(index + 1, 0, {
          type,
          uuid: v4(),
          isEditing: false,
          hasErrors: false,
          text: defaultText,
        });
      }
    };

    const removeRow = (index: number) => {
      rows.value.splice(index, 1);
      if (rows.value.length === 0) {
        hasAddedRow.value = false;
      }
    };

    watch(
      rowsWithLineNumbers,
      () => {
        let lastLineNumber = 0;
        for (
          let i = rowsWithLineNumbers.value.length - 1;
          i >= 0 && !lastLineNumber;
          i -= 1
        ) {
          if (rowsWithLineNumbers.value[i].line) {
            lastLineNumber = rowsWithLineNumbers.value[i].line || 0;
          }
        }
        emit('last-line', lastLineNumber);
      },
      {
        deep: true,
      }
    );

    watch(
      rowsWithLineNumbers,
      () => {
        const rowContent: RowContent[] = rowsWithLineNumbers.value.map(row => {
          const lines: number[] = [];
          if (row.line && row.lineValue) {
            for (let i = row.line - row.lineValue + 1; i <= row.line; i += 1) {
              lines.push(i);
            }
          } else if (row.line) {
            lines.push(row.line);
          }
          return {
            uuid: row.uuid,
            type: row.type,
            value: row.lineValue || 1,
            text: row.text,
            lines,
            signs: row.signs,
            words: row.words,
            reading: row.reading,
            hasErrors: row.hasErrors,
          };
        });
        emit('update-column-rows', rowContent);
      },
      { deep: true }
    );

    watch(
      rows,
      () => {
        const lastRowType =
          rows.value.length > 0
            ? rows.value[rows.value.length - 1].type
            : undefined;
        if (lastRowType === 'Broken Area') {
          emit('ends-broken', true);
        } else {
          emit('ends-broken', false);
        }

        const numBrokenAreas = rows.value.filter(
          (row, idx) =>
            row.type === 'Broken Area' &&
            (idx > 0
              ? rows.value[idx - 1].type !== 'Broken Area'
              : !props.beginsWithBreak)
        ).length;
        emit('broken-area', numBrokenAreas);

        const isDirty = rows.value.length > 0;
        emit('dirty-status', isDirty);
      },
      {
        deep: true,
      }
    );

    const updateRowContent = (index: number, row: RowWithLine) => {
      rows.value.splice(index, 1, row);
    };

    const currentRow = ref<string>();
    const setCurrentRow = (rowUuid?: string) => {
      currentRow.value = rowUuid;
      emit('set-current-column');
    };

    const rowFocusStatuses = ref<{ [rowUuid: string]: boolean }>({});
    const setRowFocusStatus = (uuid: string, value: boolean) => {
      rowFocusStatuses.value[uuid] = value;
      emit(
        'set-column-focus',
        Object.values(rowFocusStatuses.value).includes(true)
      );
    };

    return {
      columnEditMenu,
      addRowAfter,
      rows,
      hasAddedRow,
      removeRow,
      rowsWithLineNumbers,
      newRow,
      updateRowContent,
      currentRow,
      setCurrentRow,
      rowFocusStatuses,
      setRowFocusStatus,
    };
  },
});
</script>

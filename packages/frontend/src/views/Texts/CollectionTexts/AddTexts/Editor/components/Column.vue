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
        <v-hover v-slot="{ hover }">
          <v-row class="ma-1">
            <v-col cols="1" class="px-1 pb-1 pt-0" align="center">
              <span v-if="row.line">{{ formatLineNumber(row) }}</span>
            </v-col>
            <v-col cols="10" class="pa-0">
              <v-textarea
                v-if="row.type === 'Line'"
                placeholder="Enter line text here"
                auto-grow
                dense
                rows="1"
                class="mx-1 mt-0 hide-line"
                @update:error="lineError"
                :class="{ 'mb-0': hasLineError, 'mb-n5': !hasLineError }"
                :autofocus="true"
                @keydown.enter.prevent
                @keyup.enter="addRowAfter('Line', idx)"
                @change="updateText(idx, $event)"
              />
              <v-row
                class="pa-0 ma-0"
                v-else-if="
                  row.type === 'Broken Line(s)' ||
                  row.type === 'Uninscribed Line(s)' ||
                  row.type === 'Ruling(s)'
                "
              >
                <v-col v-show="row.isEditing" cols="2" class="ma-0 pa-0">
                  <v-combobox
                    class="mx-1 mt-n1 mb-n3 pt-0"
                    hide-details
                    :items="getItems(row.type)"
                    @input="setLineValue(idx, $event.value || $event)"
                    single-line
                    placeholder="Select"
                  />
                </v-col>
                <span
                  v-if="row.type === 'Ruling(s)'"
                  v-show="!row.isEditing"
                  class="mr-1"
                  >{{
                    row.lineValue ? formatRuling(row.lineValue) : 'Single'
                  }}</span
                >
                <span v-else v-show="!row.isEditing" class="mr-1"
                  >{{ row.lineValue || 1 }}
                </span>
                <v-col cols="4" class="ma-0 pa-0">
                  <span class="my-1"
                    >{{ `${row.type}` }}
                    <a
                      @click="toggleRowEditing(idx)"
                      v-if="!row.isEditing"
                      class="ml-4"
                      >Edit</a
                    >
                  </span>
                </v-col>
              </v-row>
              <span v-else class="my-1">{{ row.type }}</span>
            </v-col>
            <v-col cols="1" class="pa-0" align="right">
              <v-btn @click="removeRow(idx)" icon x-small class="ma-1">
                <v-icon :color="hover ? 'red' : 'transparent'"
                  >mdi-delete</v-icon
                >
              </v-btn>
            </v-col>
          </v-row>
        </v-hover>
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
import { v4 } from 'uuid';
import { RowTypes, RowContent } from '@oare/types';
import { formatLineNumber as defaultLineFormatter } from '@oare/oare';

export interface Row {
  type: RowTypes;
  uuid: string;
  lineValue?: number;
  isEditing: boolean;
  text?: string;
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
  },
  components: {
    InsertButton,
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
      return rows.value.map(row => {
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
            brokenAreas += 1;
          }
        }
        return {
          ...row,
          line: currentLine,
        };
      });
    });

    const addRowAfter = (type: RowTypes, index: number) => {
      hasAddedRow.value = true;
      if (index === -1) {
        rows.value.unshift({
          type,
          uuid: v4(),
          isEditing: false,
        });
      } else {
        rows.value.splice(index + 1, 0, {
          type,
          uuid: v4(),
          isEditing: false,
        });
      }
    };

    const removeRow = (index: number) => {
      rows.value.splice(index, 1);
      if (rows.value.length === 0) {
        hasAddedRow.value = false;
      }
    };

    const hasLineError = ref(false);
    const lineError = (hasError: boolean) => {
      hasLineError.value = hasError;
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
          };
        });
        emit('update-column-rows', rowContent);
      },
      { deep: true }
    );

    const updateText = (index: number, text: string) => {
      rows.value.splice(index, 1, {
        ...rows.value[index],
        text,
      });
    };

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
          row => row.type === 'Broken Area'
        ).length;
        emit('broken-area', numBrokenAreas);

        const isDirty = rows.value.length > 0;
        emit('dirty-status', isDirty);
      },
      {
        deep: true,
      }
    );

    const setLineValue = (index: number, value: string) => {
      if (value === 'Single') {
        value = '1';
      } else if (value === 'Double') {
        value = '2';
      } else if (value === 'Triple') {
        value = '3';
      }
      rows.value.splice(index, 1, {
        ...rows.value[index],
        lineValue: Number(value),
      });
      rows.value[index].isEditing = false;
    };

    const formatLineNumber = (row: RowWithLine) => {
      if ((!row.lineValue && row.line) || (row.line && row.lineValue === 1)) {
        return defaultLineFormatter(row.line);
      }
      if (row.lineValue && row.line) {
        const formattedFirstNumber = defaultLineFormatter(
          row.line - row.lineValue + 1,
          false
        );
        const formattedLastNumber = defaultLineFormatter(row.line);
        return `${formattedFirstNumber} - ${formattedLastNumber}`;
      }
    };

    const toggleRowEditing = (index: number) => {
      rows.value.splice(index, 1, {
        ...rows.value[index],
        isEditing: true,
      });
    };

    const getItems = (type: RowTypes) => {
      if (type === 'Ruling(s)') {
        return ['Single', 'Double', 'Triple'];
      }
      return [1, 2, 3, 4, 5, 6, 7, 8];
    };

    const formatRuling = (value: number) => {
      switch (value) {
        case 1:
          return 'Single';
        case 2:
          return 'Double';
        case 3:
          return 'Triple';
        default:
          return value;
      }
    };

    return {
      columnEditMenu,
      addRowAfter,
      rows,
      hasAddedRow,
      lineError,
      hasLineError,
      removeRow,
      rowsWithLineNumbers,
      setLineValue,
      formatLineNumber,
      toggleRowEditing,
      getItems,
      formatRuling,
      updateText,
    };
  },
});
</script>

<style scoped>
.hide-line >>> .v-input__slot::before {
  border-style: none !important;
}
</style>

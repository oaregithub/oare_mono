<template>
  <OareContentView title="Edit Text Content">
    <v-card min-height="500px" flat class="ma-0">
      <v-row>
        <v-col cols="3" align="center">
          <side-card
            v-for="(side, idx) in sides"
            :key="idx"
            :side="side.side"
            :selected="selectedSide === side.side"
            @set-side="setSide(side.side)"
            @remove-side="removeSide(idx)"
            @change-side="setupChangeSide(idx)"
          />
          <v-divider v-if="sides.length > 0" />
          <v-btn
            v-if="usableSides.length > 0"
            @click="openAddingSide"
            class="ma-4 test-add-side"
            text
          >
            <v-icon color="primary">mdi-plus</v-icon>
            <h3 class="text--primary">Add Side</h3>
          </v-btn>
        </v-col>
        <v-col cols="1" align="center" class="px-0">
          <v-divider vertical class="ma-0" />
        </v-col>
        <v-col cols="8">
          <v-card
            v-if="!selectedSide && !addingSide && !changingSide"
            flat
            min-height="100px"
            class="py-12"
          >
            <v-row justify="center" class="my-12">
              To begin, use the "Add Side" button to select a side to start
              with. Additional sides can be added afterwards.
            </v-row>
          </v-card>
          <side
            v-show="side.side === selectedSide && !changingSide"
            v-for="(side, idx) in sortedSides"
            :key="side.uuid"
            :side="side.side"
            :startingLine="getStartingLine(idx)"
            :beginningBrokenAreas="getStartingBreak(idx)"
            :beginsWithBreak="getBeginningBreakStatus(idx)"
            @side-last-line="setLastLine(idx, $event)"
            @side-broken-area="setBrokenArea(idx, $event)"
            @side-ends-broken="setEndBreakStatus(idx, $event)"
            @side-dirty-status="setDirtyStatus(idx, $event)"
            @update-side-columns="setSideColumns(idx, $event)"
          />
          <add-side
            v-if="addingSide"
            :usableSides="usableSides"
            @side-selected="addSide"
            @cancel-add-side="addingSide = false"
          />
          <add-side
            v-if="changingSide"
            :usableSides="usableSides"
            changing
            @side-selected="changeSide"
            @cancel-add-side="changingSide = false"
          />
        </v-col>
      </v-row>
    </v-card>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  ComputedRef,
  watch,
} from '@vue/composition-api';
import { v4 } from 'uuid';
import {
  SideOption,
  ColumnContent,
  SideContent,
  AddTextEditorContent,
} from '@oare/types';
import Side from './components/Side.vue';
import AddSide from './components/AddSide.vue';
import SideCard from './components/SideCard.vue';

export interface Side {
  uuid: string;
  side: SideOption;
  lastLine: number;
  breaks: number;
  endsBroken: boolean;
  isDirty: boolean;
  columns: ColumnContent[];
}

export default defineComponent({
  components: {
    Side,
    AddSide,
    SideCard,
  },
  setup(_, { emit }) {
    const indexToChange = ref(0);
    const sides = ref<Side[]>([]);
    const selectedSide = ref<SideOption>();

    const addingSide = ref(false);
    const changingSide = ref(false);
    const removingSide = ref(false);

    const sideTypes: ComputedRef<SideOption[]> = computed(() => [
      'obv.',
      'lo.e.',
      'rev.',
      'u.e.',
      'le.e.',
      'r.e.',
    ]);

    const usableSides = computed(() =>
      sideTypes.value.filter(
        type => !sides.value.map(side => side.side).includes(type)
      )
    );

    const sortSides = (a: Side, b: Side) => {
      if (a.side === 'obv.') {
        return -1;
      }
      if (a.side === 'lo.e.') {
        if (b.side === 'obv.') {
          return 1;
        }
        return -1;
      }
      if (a.side === 'rev.') {
        if (b.side === 'obv.' || b.side === 'lo.e.') {
          return 1;
        }
        return -1;
      }
      if (a.side === 'u.e.') {
        if (b.side === 'le.e.' || b.side === 'r.e.') {
          return -1;
        }
        return 1;
      }
      if (a.side === 'le.e.') {
        if (b.side === 'r.e.') {
          return -1;
        }
        return 1;
      }
      if (a.side === 'r.e.') {
        return 1;
      }
      return 0;
    };

    const sortedSides = computed(() => {
      return sides.value.sort(sortSides);
    });

    const openAddingSide = () => {
      addingSide.value = true;
      selectedSide.value = undefined;
    };

    const addSide = (side: SideOption) => {
      sides.value.push({
        uuid: v4(),
        side,
        lastLine: 0,
        breaks: 0,
        endsBroken: false,
        isDirty: false,
        columns: [],
      });
      addingSide.value = false;
      selectedSide.value = side;
    };

    const removeSide = (index: number) => {
      removingSide.value = true;
      sides.value.splice(index, 1);
      if (sortedSides.value.length > 0) {
        selectedSide.value = sortedSides.value[0].side;
      } else {
        selectedSide.value = undefined;
      }
    };

    const setSide = (side: SideOption) => {
      if (!changingSide.value && !removingSide.value) {
        addingSide.value = false;
        selectedSide.value = side;
      }
      removingSide.value = false;
    };

    const setLastLine = (index: number, lastLine: number) => {
      sides.value[index].lastLine = lastLine;
    };

    const getStartingLine = (index: number) => {
      if (index === 0) {
        return 0;
      }
      let startingLine = 0;
      for (let i = index - 1; i >= 0 && !startingLine; i -= 1) {
        if (sides.value[i].lastLine !== 0) {
          startingLine = sides.value[i].lastLine;
        }
      }
      return Math.floor(startingLine);
    };

    const setBrokenArea = (index: number, breaks: number) => {
      sides.value[index].breaks = breaks;
    };

    const getStartingBreak = (index: number) => {
      if (index === 0) {
        return 0;
      }
      let startingBreak = 0;
      for (let i = index - 1; i >= 0; i -= 1) {
        if (sides.value[i].breaks !== 0) {
          startingBreak += sides.value[i].breaks;
        }
      }
      return startingBreak;
    };

    const setEndBreakStatus = (index: number, status: boolean) => {
      sides.value[index].endsBroken = status;
    };

    const getBeginningBreakStatus = (index: number) => {
      if (index === 0) {
        return false;
      }
      let startingBreak = false;
      let foundDirty = false;

      for (let i = index - 1; i >= 0 && !startingBreak && !foundDirty; i -= 1) {
        if (sides.value[i].isDirty) {
          foundDirty = true;
        }
        if (sides.value[i].endsBroken) {
          startingBreak = true;
        }
      }
      return startingBreak;
    };

    const setDirtyStatus = (index: number, status: boolean) => {
      sides.value[index].isDirty = status;
    };

    const setupChangeSide = (index: number) => {
      changingSide.value = true;
      indexToChange.value = index;
    };

    const changeSide = (side: SideOption) => {
      sides.value[indexToChange.value].side = side;
      changingSide.value = false;
      selectedSide.value = side;
    };

    const setSideColumns = (index: number, columns: ColumnContent[]) => {
      sides.value.splice(index, 1, {
        ...sides.value[index],
        columns,
      });
    };

    const getSideNumber = (side: SideOption) => {
      switch (side) {
        case 'obv.':
          return 1;
        case 'lo.e.':
          return 2;
        case 'rev.':
          return 3;
        case 'u.e.':
          return 4;
        case 'le.e.':
          return 5;
        case 'r.e.':
          return 6;
        default:
          return 0;
      }
    };

    watch(
      sides,
      () => {
        const sideContent: SideContent[] = sides.value.map(side => ({
          uuid: side.uuid,
          type: side.side,
          number: getSideNumber(side.side),
          columns: side.columns,
        }));
        const editorContent: AddTextEditorContent = {
          sides: sideContent,
        };
        emit('update-editor-content', editorContent);
      },
      { deep: true }
    );

    const stepComplete = computed(() => {
      return (
        sides.value.length > 0 &&
        sides.value.every(
          side =>
            side.columns.length > 0 &&
            side.columns.every(
              column =>
                column.rows.length > 0 &&
                column.rows.every(row => {
                  if (row.type === 'Line') {
                    return (
                      row.signs &&
                      row.signs.length > 0 &&
                      row.signs.every(sign => sign.type)
                    );
                  }
                  return true;
                }) &&
                column.rows.every(row => !row.hasErrors)
            )
        )
      );
    });

    watch(stepComplete, () => emit('step-complete', stepComplete.value));

    return {
      sides,
      addingSide,
      removingSide,
      usableSides,
      addSide,
      removeSide,
      selectedSide,
      setSide,
      openAddingSide,
      sortedSides,
      setLastLine,
      getStartingLine,
      setBrokenArea,
      getStartingBreak,
      setEndBreakStatus,
      getBeginningBreakStatus,
      setDirtyStatus,
      changingSide,
      setupChangeSide,
      changeSide,
      setSideColumns,
    };
  },
});
</script>

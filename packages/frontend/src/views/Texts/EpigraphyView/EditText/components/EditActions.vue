<template>
  <v-row class="mr-7 mt-0" v-if="!currentEditAction">
    <v-spacer />
    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" class="mx-1 mb-6" v-on="on" v-bind="attrs">
          <v-icon small class="mr-1">mdi-plus</v-icon>
          Add</v-btn
        >
      </template>
      <v-list dense>
        <v-list-item
          @click="$emit('set-action', 'addSide')"
          :disabled="!canPerformAction('addSide')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-table-column</v-icon>
            Side</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addColumn')"
          :disabled="!canPerformAction('addColumn')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-columns</v-icon>
            Column</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addRegionBroken')"
          :disabled="!canPerformAction('addRegionBroken')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Broken Area</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addRegionRuling')"
          :disabled="!canPerformAction('addRegionRuling')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-minus-box-outline</v-icon>
            Ruling</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addRegionSealImpression')"
          :disabled="!canPerformAction('addRegionSealImpression')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-image-outline</v-icon>
            Seal Impression</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addRegionUninscribed')"
          :disabled="!canPerformAction('addRegionUninscribed')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-blur-linear</v-icon>
            Uninscribed Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addLine')"
          :disabled="!canPerformAction('addLine')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Line</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addUndeterminedLines')"
          :disabled="!canPerformAction('addUndeterminedLines')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-text-box-remove-outline</v-icon>
            Broken Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addWord')"
          :disabled="!canPerformAction('addWord')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Word / Number</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addSign')"
          :disabled="!canPerformAction('addSign')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Sign</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addUndeterminedSigns')"
          :disabled="!canPerformAction('addUndeterminedSigns')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-dots-horizontal</v-icon>
            Broken Sign(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'addDivider')"
          :disabled="!canPerformAction('addDivider')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-drag-vertical-variant</v-icon>
            Word Divider</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" class="mx-1 mb-6" v-on="on" v-bind="attrs">
          <v-icon small class="mr-1">mdi-pencil</v-icon>
          Edit</v-btn
        >
      </template>
      <v-list dense>
        <v-list-item
          @click="$emit('set-action', 'editSide')"
          :disabled="!canPerformAction('editSide')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-table-column</v-icon>
            Change Side Designation</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editColumn')"
          :disabled="!canPerformAction('editColumn')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-columns</v-icon>
            Change Column Order</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editRegionBroken')"
          :disabled="!canPerformAction('editRegionBroken')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Broken Area</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editRegionRuling')"
          :disabled="!canPerformAction('editRegionRuling')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-minus-box-outline</v-icon>
            Ruling</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editRegionSealImpression')"
          :disabled="!canPerformAction('editRegionSealImpression')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-image-outline</v-icon>
            Seal Impression</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editRegionUninscribed')"
          :disabled="!canPerformAction('editRegionUninscribed')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-blur-linear</v-icon>
            Uninscribed Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editUndeterminedLines')"
          :disabled="!canPerformAction('editUndeterminedLines')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-text-box-remove-outline</v-icon>
            Broken Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editSign')"
          :disabled="!canPerformAction('editSign')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Sign</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editUndeterminedSigns')"
          :disabled="!canPerformAction('editUndeterminedSigns')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-dots-horizontal</v-icon>
            Broken Sign(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'editDivider')"
          :disabled="!canPerformAction('editDivider')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-drag-vertical-variant</v-icon>
            Word Divider Markup</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" class="mx-1 mb-6" v-on="on" v-bind="attrs">
          <v-icon small class="mr-1">mdi-content-cut</v-icon>
          Split</v-btn
        >
      </template>
      <v-list dense>
        <v-list-item
          @click="$emit('set-action', 'splitLine')"
          :disabled="!canPerformAction('splitLine')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Line</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'splitWord')"
          :disabled="!canPerformAction('splitWord')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Word / Number</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" class="mx-1 mb-6" v-on="on" v-bind="attrs">
          <v-icon small class="mr-1">mdi-merge</v-icon>
          Merge</v-btn
        >
      </template>
      <v-list dense>
        <v-list-item
          @click="$emit('set-action', 'mergeLine')"
          :disabled="!canPerformAction('mergeLine')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Lines</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'mergeWord')"
          :disabled="!canPerformAction('mergeWord')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Words / Numbers</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" class="mx-1 mb-6" v-on="on" v-bind="attrs">
          <v-icon small class="mr-1">mdi-swap-horizontal</v-icon>
          Reorder</v-btn
        >
      </template>
      <v-list dense>
        <v-list-item
          @click="$emit('set-action', 'reorderSign')"
          :disabled="!canPerformAction('reorderSign')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Reorder Signs</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" class="mx-1 mb-6" v-on="on" v-bind="attrs">
          <v-icon small class="mr-1">mdi-auto-fix</v-icon>
          Clean Up</v-btn
        >
      </template>
      <v-list dense>
        <v-list-item @click="$emit('set-action', 'cleanLine')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Regenerate Line Numbers</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn color="primary" class="mx-1 mb-6" v-on="on" v-bind="attrs">
          <v-icon small class="mr-1">mdi-delete</v-icon>
          Remove</v-btn
        >
      </template>
      <v-list dense>
        <v-list-item
          @click="$emit('set-action', 'removeSide')"
          :disabled="!canPerformAction('removeSide')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-table-column</v-icon>
            Side</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeColumn')"
          :disabled="!canPerformAction('removeColumn')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-columns</v-icon>
            Column</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeRegionBroken')"
          :disabled="!canPerformAction('removeRegionBroken')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Broken Area</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeRegionRuling')"
          :disabled="!canPerformAction('removeRegionRuling')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-minus-box-outline</v-icon>
            Ruling</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeRegionSealImpression')"
          :disabled="!canPerformAction('removeRegionSealImpression')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-image-outline</v-icon>
            Seal Impression</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeRegionUninscribed')"
          :disabled="!canPerformAction('removeRegionUninscribed')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-blur-linear</v-icon>
            Uninscribed Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeLine')"
          :disabled="!canPerformAction('removeLine')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Line</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeUndeterminedLines')"
          :disabled="!canPerformAction('removeUndeterminedLines')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-text-box-remove-outline</v-icon>
            Broken Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeWord')"
          :disabled="!canPerformAction('removeWord')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Word / Number</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeSign')"
          :disabled="!canPerformAction('removeSign')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Sign</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeUndeterminedSigns')"
          :disabled="!canPerformAction('removeUndeterminedSigns')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-dots-horizontal</v-icon>
            Broken Sign(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item
          @click="$emit('set-action', 'removeDivider')"
          :disabled="!canPerformAction('removeDivider')"
        >
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-drag-vertical-variant</v-icon>
            Word Divider</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn color="info" class="mx-1" @click="$emit('close-editor')"
      >Close Editor</v-btn
    >
  </v-row>
  <v-row class="mx-7 mt-0" v-else>
    <v-spacer />
    <span class="mt-2 primary--text">{{ instructionalText }}</span>
    <v-spacer />
    <v-btn
      color="info"
      class="mr-1 mb-6"
      @click="$emit('reset-current-edit-action')"
    >
      Cancel</v-btn
    >
  </v-row>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { EditTextAction, EpigraphicUnitSide } from '@oare/types';
import { TabletRenderer } from '@oare/oare';

export default defineComponent({
  props: {
    currentEditAction: {
      type: String as PropType<EditTextAction>,
      required: false,
    },
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    currentSide: {
      type: String as PropType<EpigraphicUnitSide>,
      required: false,
    },
  },
  setup(props) {
    const instructionalText = computed(() => {
      switch (props.currentEditAction) {
        case 'addSide':
          return 'Use the interface below to add a new side from the available options.';
        case 'addColumn':
          return 'In the dialog that appears, use the plus buttons to select where you would like to add a new column.';
        case 'addRegionBroken':
          return 'Use the plus buttons between each line to select where you would like to add a new broken area.';
        case 'addRegionRuling':
          return 'Use the plus buttons between each line to select where you would like to add a new ruling.';
        case 'addRegionSealImpression':
          return 'Use the plus buttons between each line to select where you would like to add a new seal impression.';
        case 'addRegionUninscribed':
          return 'Use the plus buttons between each line to select where you would like to add a new uninscribed area.';
        case 'addLine':
          return 'Use the plus buttons between each line to select where you would like to add a new line.';
        case 'addUndeterminedLines':
          return 'Use the plus buttons between each line to select where you would like to add new broken line(s).';
        case 'addWord':
          return 'Use the plus buttons between each word to select where you would like to add a new word/number.';
        case 'addSign':
          return 'Click on the word that you would like to add a sign to.';
        case 'addUndeterminedSigns':
          return 'Click on the word that you would like to add broken signs to.';
        case 'addDivider':
          return 'Use the plus buttons between each word to select where you would like to add a new word divider.';
        case 'editSide':
          return 'In the dialog that appears, follow the instructions to change the side designation.';
        case 'editColumn':
          return 'Click the blue arrows that appear at the top right of each column to move it to the left or right.';
        case 'editRegionBroken':
          return 'Click on the broken area that you would like to edit.';
        case 'editRegionRuling':
          return 'Click on the ruling that you would like to edit.';
        case 'editRegionSealImpression':
          return 'Click on the seal impression that you would like to edit.';
        case 'editRegionUninscribed':
          return 'Click on the uninscribed line(s) that you would like to edit.';
        case 'editUndeterminedLines':
          return 'Click on the broken line(s) that you would like to edit.';
        case 'editSign':
          return 'Click on the sign that you would like to edit.';
        case 'editUndeterminedSigns':
          return 'Click on the broken sign(s) that you would like to edit.';
        case 'editDivider':
          return 'Click on the word divider that you would like to edit.';
        case 'splitLine':
          return 'Use the buttons that appear between words to select where you would like to split a line';
        case 'splitWord':
          return 'Click on the word/number that you would like to split.';
        case 'mergeLine':
          return 'Use the checkboxes that appear to select two consecutive lines that you would like to merge.';
        case 'mergeWord':
          return 'Use the checkboxes that appear to select two consecutive words/numbers that you would like to merge.';
        case 'reorderSign':
          return 'Click on the word that contains the two signs that you would like to reorder.';
        case 'cleanLine':
          return 'Confirm clean up in the dialog.';
        case 'removeSide':
          return 'Use the interface below to remove a side.';
        case 'removeColumn':
          return 'Use the red trash cans that appear at the top right of each column to remove it.';
        case 'removeRegionBroken':
          return 'Use the red trash cans that appear next to each broken area to remove it.';
        case 'removeRegionRuling':
          return 'Use the red trash cans that appear next to each ruling to remove it.';
        case 'removeRegionSealImpression':
          return 'Use the red trash cans that appear next to each seal impression to remove it.';
        case 'removeRegionUninscribed':
          return 'Use the red trash cans that appear next to each uninscribed line to remove it.';
        case 'removeLine':
          return 'Use the red trash cans that appear next to each line to remove it.';
        case 'removeUndeterminedLines':
          return 'Use the red trash cans that appear next to each broken line to remove it.';
        case 'removeWord':
          return 'Click on the word that you would like to remove.';
        case 'removeSign':
          return 'Click on the sign that you would like to remove.';
        case 'removeUndeterminedSigns':
          return 'Click on the broken sign(s) that you would like to remove.';
        case 'removeDivider':
          return 'Click on the word divider that you would like to remove.';
      }
    });

    const canPerformAction = (action: EditTextAction): boolean => {
      if (!props.currentSide) {
        return false;
      }

      if (action === 'addSide' || action === 'editSide') {
        const allSides: EpigraphicUnitSide[] = [
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
        ];
        return !allSides.every(sideOption =>
          props.renderer.sides.map(side => side.side).includes(sideOption)
        );
      }
      if (action === 'addColumn') {
        return props.renderer.sides.length > 0;
      }
      if (
        action === 'addRegionBroken' ||
        action === 'addRegionRuling' ||
        action === 'addRegionSealImpression' ||
        action === 'addRegionUninscribed' ||
        action === 'addLine' ||
        action === 'addUndeterminedLines'
      ) {
        return props.renderer.columnsOnSide(props.currentSide).length > 0;
      }
      if (action === 'addWord' || action === 'addDivider') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        return relevantLines.length > 0;
      }
      if (
        action === 'addSign' ||
        action === 'addUndeterminedSigns' ||
        action === 'removeWord'
      ) {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const words = relevantLines.flatMap(line =>
          props.renderer.getLineWords(line)
        );
        return words.length > 0;
      }
      if (action === 'editColumn') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        return columnsOnSide.length > 1;
      }
      if (action === 'editRegionBroken' || action === 'removeRegionBroken') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        return lines.some(line => props.renderer.isRegionType(line, 'broken'));
      }
      if (action === 'editRegionRuling' || action === 'removeRegionRuling') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        return lines.some(line => props.renderer.isRegionType(line, 'ruling'));
      }
      if (
        action === 'editRegionSealImpression' ||
        action === 'removeRegionSealImpression'
      ) {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        return lines.some(line =>
          props.renderer.isRegionType(line, 'isSealImpression')
        );
      }
      if (
        action === 'editRegionUninscribed' ||
        action === 'removeRegionUninscribed'
      ) {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        return lines.some(line =>
          props.renderer.isRegionType(line, 'uninscribed')
        );
      }
      if (
        action === 'editUndeterminedLines' ||
        action === 'removeUndeterminedLines'
      ) {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        return lines.some(line => props.renderer.isUndetermined(line));
      }
      if (action === 'editSign' || action === 'removeSign') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const words = relevantLines.flatMap(line =>
          props.renderer.getLineWords(line)
        );
        const signs = words.flatMap(word => word.signs);
        return signs.some(sign => sign.epigType === 'sign');
      }
      if (
        action === 'editUndeterminedSigns' ||
        action === 'removeUndeterminedSigns'
      ) {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const words = relevantLines.flatMap(line =>
          props.renderer.getLineWords(line)
        );
        const signs = words.flatMap(word => word.signs);
        return signs.some(sign => sign.epigType === 'undeterminedSigns');
      }
      if (action === 'editDivider' || action === 'removeDivider') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const words = relevantLines.flatMap(line =>
          props.renderer.getLineWords(line)
        );
        return words.some(word => word.isDivider);
      }
      if (action === 'splitLine') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const wordsPerLine = relevantLines.map(
          line => props.renderer.getLineWords(line).length
        );
        return wordsPerLine.some(numWords => numWords > 1);
      }
      if (action === 'splitWord') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const words = relevantLines.flatMap(line =>
          props.renderer.getLineWords(line)
        );
        return words.some(word => word.signs.length > 1);
      }
      if (action === 'mergeLine') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter((line, idx) => {
          if (
            props.renderer.isRegion(line) ||
            props.renderer.isUndetermined(line)
          ) {
            return false;
          }
          let prevLineCanMerge = false;
          if (idx !== 0) {
            const prevLine = lines[idx - 1];
            if (
              !props.renderer.isRegion(prevLine) &&
              !props.renderer.isUndetermined(prevLine)
            ) {
              prevLineCanMerge = true;
            }
          }
          let nextLineCanMerge = false;
          if (idx !== lines.length - 1) {
            const nextLine = lines[idx + 1];
            if (
              !props.renderer.isRegion(nextLine) &&
              !props.renderer.isUndetermined(nextLine)
            ) {
              nextLineCanMerge = true;
            }
          }
          return prevLineCanMerge || nextLineCanMerge;
        });

        return relevantLines.length > 0;
      }
      if (action === 'mergeWord') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const words = relevantLines.flatMap(line =>
          props.renderer.getLineWords(line)
        );
        const relevantWords = words.filter((word, idx) => {
          if (word.isDivider) {
            return false;
          }
          let prevWordCanMerge = false;
          if (idx !== 0) {
            const prevWord = words[idx - 1];
            if (!prevWord.isDivider) {
              prevWordCanMerge = true;
            }
          }
          let nextWordCanMerge = false;
          if (idx !== words.length - 1) {
            const nextWord = words[idx + 1];
            if (!nextWord.isDivider) {
              nextWordCanMerge = true;
            }
          }
          return prevWordCanMerge || nextWordCanMerge;
        });
        return relevantWords.length > 0;
      }
      if (action === 'reorderSign') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        const words = relevantLines.flatMap(line =>
          props.renderer.getLineWords(line)
        );
        return words.some(word => word.signs.length >= 2);
      }
      if (action === 'removeSide') {
        return props.renderer.sides.length > 1;
      }
      if (action === 'removeColumn') {
        return props.renderer.columnsOnSide(props.currentSide).length > 1;
      }
      if (action === 'removeLine') {
        const columnsOnSide = props.renderer.columnsOnSide(props.currentSide);
        const lines = columnsOnSide.flatMap(col =>
          props.renderer.linesInColumn(col, props.currentSide!)
        );
        const relevantLines = lines.filter(
          line =>
            !props.renderer.isRegion(line) &&
            !props.renderer.isUndetermined(line)
        );
        return relevantLines.length > 0;
      }
      return true;
    };

    return {
      instructionalText,
      canPerformAction,
    };
  },
});
</script>

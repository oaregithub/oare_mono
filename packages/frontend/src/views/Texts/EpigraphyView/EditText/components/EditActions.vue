<template>
  <v-row class="mr-7 mt-0" v-if="!currentEditAction">
    <v-spacer />
    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          class="mx-1 mb-6 test-add-button"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon small class="mr-1">mdi-plus</v-icon>
          Add</v-btn
        >
      </template>
      <v-list dense>
        <edit-actions-item
          :canPerformAction="canPerformAction('addSide')"
          action="addSide"
          icon="mdi-table-column"
          label="Side"
          disabledMessage="All side options already in use"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addColumn')"
          action="addColumn"
          icon="mdi-format-columns"
          label="Column"
          disabledMessage="Cannot add column when there are no sides on the tablet"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addRegionBroken')"
          action="addRegionBroken"
          icon="mdi-format-page-break"
          label="Broken Area"
          disabledMessage="Cannot add broken area when there are no columns on the side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addRegionRuling')"
          action="addRegionRuling"
          icon="mdi-minus-box-outline"
          label="Ruling"
          disabledMessage="Cannot add ruling(s) when there are no columns on the side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addRegionSealImpression')"
          action="addRegionSealImpression"
          icon="mdi-image-outline"
          label="Seal Impression"
          disabledMessage="Cannot add seal impression when there are no columns on the side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addRegionUninscribed')"
          action="addRegionUninscribed"
          icon="mdi-blur-linear"
          label="Uninscribed Line(s)"
          disabledMessage="Cannot add uninscribed line(s) when there are no columns on the side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addLine')"
          action="addLine"
          icon="mdi-view-headline"
          label="Line"
          disabledMessage="Cannot add line when there are no columns on the side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addUndeterminedLines')"
          action="addUndeterminedLines"
          icon="mdi-text-box-remove-outline"
          label="Broken Line(s)"
          disabledMessage="Cannot add broken line(s) when there are no columns on the side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addWord')"
          action="addWord"
          icon="mdi-form-textbox-password"
          label="Word / Number"
          disabledMessage="No existing line(s) to add word/number to"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addSign')"
          action="addSign"
          icon="mdi-format-text-rotation-none"
          label="Sign"
          disabledMessage="No existing word(s) to add sign to"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addUndeterminedSigns')"
          action="addUndeterminedSigns"
          icon="mdi-dots-horizontal"
          label="Broken Sign(s)"
          disabledMessage="No existing word(s) to add broken sign(s) to"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('addDivider')"
          action="addDivider"
          icon="mdi-drag-vertical-variant"
          label="Word Divider"
          disabledMessage="No existing line(s) to add word divider to"
          @set-action="$emit('set-action', $event)"
        />
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          class="mx-1 mb-6 test-edit-button"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon small class="mr-1">mdi-pencil</v-icon>
          Edit</v-btn
        >
      </template>
      <v-list dense>
        <edit-actions-item
          :canPerformAction="canPerformAction('editSide')"
          action="editSide"
          icon="mdi-table-column"
          label="Change Side Designation"
          disabledMessage="Cannot change side designation because all side options are already in use"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editColumn')"
          action="editColumn"
          icon="mdi-format-columns"
          label="Change Column Order"
          disabledMessage="There must be at least 2 columns on the side to change their order"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editRegionBroken')"
          action="editRegionBroken"
          icon="mdi-format-page-break"
          label="Broken Area"
          disabledMessage="No broken area(s) on side to edit"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editRegionRuling')"
          action="editRegionRuling"
          icon="mdi-minus-box-outline"
          label="Ruling"
          disabledMessage="No ruling(s) on side to edit"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editRegionSealImpression')"
          action="editRegionSealImpression"
          icon="mdi-image-outline"
          label="Seal Impression"
          disabledMessage="No seal impression(s) on side to edit"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editRegionUninscribed')"
          action="editRegionUninscribed"
          icon="mdi-blur-linear"
          label="Uninscribed Line(s)"
          disabledMessage="No uninscribed line(s) on side to edit"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editUndeterminedLines')"
          action="editUndeterminedLines"
          icon="mdi-text-box-remove-outline"
          label="Broken Line(s)"
          disabledMessage="No broken line(s) on side to edit"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editSign')"
          action="editSign"
          icon="mdi-format-text-rotation-none"
          label="Sign"
          disabledMessage="No sign(s) on side to edit"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editUndeterminedSigns')"
          action="editUndeterminedSigns"
          icon="mdi-dots-horizontal"
          label="Broken Sign(s)"
          disabledMessage="No broken sign(s) on side to edit"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('editDivider')"
          action="editDivider"
          icon="mdi-drag-vertical-variant"
          label="Word Divider Markup"
          disabledMessage="No word divider on side to edit"
          @set-action="$emit('set-action', $event)"
        />
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          class="mx-1 mb-6 test-split-button"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon small class="mr-1">mdi-content-cut</v-icon>
          Split</v-btn
        >
      </template>
      <v-list dense>
        <edit-actions-item
          :canPerformAction="canPerformAction('splitLine')"
          action="splitLine"
          icon="mdi-view-headline"
          label="Line"
          disabledMessage="No line on side with multiple words"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('splitWord')"
          action="splitWord"
          icon="mdi-form-textbox-password"
          label="Word / Number"
          disabledMessage="No word on side with multiple signs"
          @set-action="$emit('set-action', $event)"
        />
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          class="mx-1 mb-6 test-merge-button"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon small class="mr-1">mdi-merge</v-icon>
          Merge</v-btn
        >
      </template>
      <v-list dense>
        <edit-actions-item
          :canPerformAction="canPerformAction('mergeLine')"
          action="mergeLine"
          icon="mdi-view-headline"
          label="Lines"
          disabledMessage="No two consecutive lines on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('mergeWord')"
          action="mergeWord"
          icon="mdi-form-textbox-password"
          label="Words / Numbers"
          disabledMessage="No two consecutive words on side"
          @set-action="$emit('set-action', $event)"
        />
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          class="mx-1 mb-6 test-reorder-button"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon small class="mr-1">mdi-swap-horizontal</v-icon>
          Reorder</v-btn
        >
      </template>
      <v-list dense>
        <edit-actions-item
          :canPerformAction="canPerformAction('reorderSign')"
          action="reorderSign"
          icon="mdi-format-text-rotation-none"
          label="Reorder Signs"
          disabledMessage="No two consecutive signs on side"
          @set-action="$emit('set-action', $event)"
        />
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          class="mx-1 mb-6 test-clean-button"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon small class="mr-1">mdi-auto-fix</v-icon>
          Clean Up</v-btn
        >
      </template>
      <v-list dense>
        <edit-actions-item
          :canPerformAction="canPerformAction('cleanLine')"
          action="cleanLine"
          icon="mdi-view-headline"
          label="Regenerate Line Numbers"
          @set-action="$emit('set-action', $event)"
        />
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template #activator="{ on, attrs }">
        <v-btn
          color="primary"
          class="mx-1 mb-6 test-remove-button"
          v-on="on"
          v-bind="attrs"
        >
          <v-icon small class="mr-1">mdi-delete</v-icon>
          Remove</v-btn
        >
      </template>
      <v-list dense>
        <edit-actions-item
          :canPerformAction="canPerformAction('removeSide')"
          action="removeSide"
          icon="mdi-table-column"
          label="Side"
          disabledMessage="Cannot remove last side of tablet"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeColumn')"
          action="removeColumn"
          icon="mdi-format-columns"
          label="Column"
          disabledMessage="Cannot remove last column on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeRegionBroken')"
          action="removeRegionBroken"
          icon="mdi-format-page-break"
          label="Broken Area"
          disabledMessage="No existing broken area on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeRegionRuling')"
          action="removeRegionRuling"
          icon="mdi-minus-box-outline"
          label="Ruling"
          disabledMessage="No existing ruling on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeRegionSealImpression')"
          action="removeRegionSealImpression"
          icon="mdi-image-outline"
          label="Seal Impression"
          disabledMessage="No existing seal impression on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeRegionUninscribed')"
          action="removeRegionUninscribed"
          icon="mdi-blur-linear"
          label="Uninscribed Line(s)"
          disabledMessage="No existing uninscribed line(s) on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeLine')"
          action="removeLine"
          icon="mdi-view-headline"
          label="Line"
          disabledMessage="No existing line on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeUndeterminedLines')"
          action="removeUndeterminedLines"
          icon="mdi-text-box-remove-outline"
          label="Broken Line(s)"
          disabledMessage="No existing broken line(s) on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeWord')"
          action="removeWord"
          icon="mdi-form-textbox-password"
          label="Word / Number"
          disabledMessage="No existing word / number on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeSign')"
          action="removeSign"
          icon="mdi-format-text-rotation-none"
          label="Sign"
          disabledMessage="No existing sign on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeUndeterminedSigns')"
          action="removeUndeterminedSigns"
          icon="mdi-dots-horizontal"
          label="Broken Sign(s)"
          disabledMessage="No existing broken sign(s) on side"
          @set-action="$emit('set-action', $event)"
        />
        <edit-actions-item
          :canPerformAction="canPerformAction('removeDivider')"
          action="removeDivider"
          icon="mdi-drag-vertical-variant"
          label="Word Divider"
          disabledMessage="No existing word divider on side"
          @set-action="$emit('set-action', $event)"
        />
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
import EditActionsItem from './EditActionsItem.vue';

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
  components: {
    EditActionsItem,
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

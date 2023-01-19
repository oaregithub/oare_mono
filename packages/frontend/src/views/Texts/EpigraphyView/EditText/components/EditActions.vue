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
        <v-list-item @click="$emit('add-side')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-table-column</v-icon>
            Side</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-column')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-columns</v-icon>
            Column</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-region')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Region</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-line')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Line</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-undetermined-lines')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-text-box-remove-outline</v-icon>
            Undetermined Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-word')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Word / Number</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-sign')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Sign</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-undetermined-signs')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-dots-horizontal</v-icon>
            Undetermined Signs</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-divider')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-drag-vertical-variant</v-icon>
            Divider</v-list-item-title
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
        <v-list-item @click="$emit('edit-side')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-table-column</v-icon>
            Change Side Designation</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-column')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-columns</v-icon>
            Change Column Order</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-region')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Edit Region</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-undetermined-lines')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-text-box-remove-outline</v-icon>
            Edit Undetermined Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-sign')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Edit Sign*</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-undetermined-signs')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-dots-horizontal</v-icon>
            Edit Undetermined Signs*</v-list-item-title
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
        <v-list-item @click="$emit('split-line')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Line*</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('split-word')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Word / Number*</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('split-sign')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Sign*</v-list-item-title
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
        <v-list-item @click="$emit('merge-line')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Lines</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('merge-word')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Words / Numbers*</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('merge-sign')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Signs*</v-list-item-title
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
        <v-list-item @click="$emit('clean-line')">
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
        <v-list-item @click="$emit('remove-side')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-table-column</v-icon>
            Side</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-column')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-columns</v-icon>
            Column</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-region')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Region</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-line')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Line</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-undetermined-lines')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-text-box-remove-outline</v-icon>
            Undetermined Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-word')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Word / Number</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-sign')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Sign</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-undetermined-signs')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-dots-horizontal</v-icon>
            Undetermined Signs</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-divider')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-drag-vertical-variant</v-icon>
            Divider</v-list-item-title
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
import { EditTextAction } from '@oare/types';

export default defineComponent({
  props: {
    currentEditAction: {
      type: String as PropType<EditTextAction>,
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
        case 'addRegion':
          return 'Use the plus buttons between each line to select where you would like to add a new region.';
        case 'addLine':
          return 'Use the plus buttons between each line to select where you would like to add a new line.';
        case 'addUndeterminedLines':
          return 'Use the plus buttons between each line to select where you would like to add new undetermined line(s).';
        case 'addWord':
          return 'Use the plus buttons between each word to select where you would like to add a new word/number.';
        case 'addSign':
          return 'Click on the word that you would like to add a sign to.';
        case 'addUndeterminedSigns':
          return 'Click on the word that you would like to add undetermined signs to.';
        case 'addDivider':
          return 'Use the plus buttons between each word to select where you would like to add a new divider.';
        case 'editSide':
          return 'In the dialog that appears, follow the instructions to change the side designation.';
        case 'editColumn':
          return 'Click the blue arrows that appear at the top right of each column to move it to the left or right.';
        case 'editRegion':
          return 'Click on the region that you would like to edit.';
        case 'editUndeterminedLines':
          return 'Click on the undetermined (broken) line(s) that you would like to edit.';
        case 'editSign': // FIXME REVIEW
          return 'Click on the sign that you would like to edit.';
        case 'editUndeterminedSigns': // FIXME REVIEW
          return 'Click on the undetermined sign(s) that you would like to edit.';
        case 'splitLine': // FIXME REVIEW
          return 'Click on the line that you would like to split.';
        case 'splitWord': // FIXME REVIEW
          return 'Click on the word/number that you would like to split.';
        case 'splitSign': // FIXME REVIEW
          return 'Click on the sign that you would like to split.';
        case 'mergeLine':
          return 'Use the checkboxes that appear to select two consecutive lines that you would like to merge.';
        case 'mergeWord': // FIXME REVIEW
          return 'Use the checkboxes that appear to select two consecutive words/numbers that you would like to merge.';
        case 'mergeSign': // FIXME REVIEW
          return 'Use the checkboxes that appear to select two consecutive signs that you would like to merge.';
        case 'cleanLine':
          return 'Confirm clean up in the dialog.';
        case 'removeSide':
          return 'Use the interface below to remove a side.';
        case 'removeColumn':
          return 'Use the red trash cans that appear at the top right of each column to remove it.';
        case 'removeRegion':
          return 'Use the red trash cans that appear next to each region to remove it.';
        case 'removeLine':
          return 'Use the red trash cans that appear next to each line to remove it.';
        case 'removeUndeterminedLines':
          return 'Use the red trash cans that appear next to each undetermined line to remove it.';
        case 'removeWord':
          return 'Click on the word that you would like to remove.';
        case 'removeSign':
          return 'Click on the sign that you would like to remove.';
        case 'removeUndeterminedSigns':
          return 'Click on the undetermined sign(s) that you would like to remove.';
        case 'removeDivider':
          return 'Use the red trash cans that appear next to each divider to remove it.';
      }
    });

    return {
      instructionalText,
    };
  },
});
</script>

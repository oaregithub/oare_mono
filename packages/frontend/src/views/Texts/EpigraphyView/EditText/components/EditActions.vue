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
        <v-list-item @click="$emit('add-region-broken')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Broken Area</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-region-ruling')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-minus-box-outline</v-icon>
            Ruling</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-region-seal-impression')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-image-outline</v-icon>
            Seal Impression</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-region-uninscribed')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-blur-linear</v-icon>
            Uninscribed Line(s)</v-list-item-title
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
            Broken Line(s)</v-list-item-title
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
            Broken Sign(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('add-divider')">
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
        <v-list-item @click="$emit('edit-region-broken')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Broken Area</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-region-ruling')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-minus-box-outline</v-icon>
            Ruling</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-region-seal-impression')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-image-outline</v-icon>
            Seal Impression</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-region-uninscribed')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-blur-linear</v-icon>
            Uninscribed Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-undetermined-lines')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-text-box-remove-outline</v-icon>
            Broken Line(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-sign')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Sign</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-undetermined-signs')" disabled>
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-dots-horizontal</v-icon>
            Broken Sign(s) (Coming Soon)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('edit-divider')" disabled>
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-drag-vertical-variant</v-icon>
            Word Divider Markup (Coming Soon)</v-list-item-title
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
        <v-list-item @click="$emit('split-line')" disabled>
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-view-headline</v-icon>
            Line (Coming Soon)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('split-word')" disabled>
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Word / Number (Coming Soon)</v-list-item-title
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
        <v-list-item @click="$emit('merge-word')" disabled>
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-form-textbox-password</v-icon>
            Words / Numbers (Coming Soon)</v-list-item-title
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
        <v-list-item @click="$emit('reorder-sign')" disabled>
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-text-rotation-none</v-icon>
            Reorder Signs (Coming Soon)</v-list-item-title
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
        <v-list-item @click="$emit('remove-region-broken')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-format-page-break</v-icon>
            Broken Area</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-region-ruling')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-minus-box-outline</v-icon>
            Ruling</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-region-seal-impression')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-image-outline</v-icon>
            Seal Impression</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-region-uninscribed')">
          <v-list-item-title>
            <v-icon small class="mr-1">mdi-blur-linear</v-icon>
            Uninscribed Line(s)</v-list-item-title
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
            Broken Line(s)</v-list-item-title
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
            Broken Sign(s)</v-list-item-title
          >
        </v-list-item>
        <v-list-item @click="$emit('remove-divider')">
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
        case 'editSign': // FIXME REVIEW
          return 'Click on the sign that you would like to edit.';
        case 'editUndeterminedSigns': // FIXME REVIEW
          return 'Click on the broken sign(s) that you would like to edit.';
        case 'editDivider': // FIXME REVIEW
          return 'Click on the word divider that you would like to edit.';
        case 'splitLine': // FIXME REVIEW
          return 'Click on the line that you would like to split.';
        case 'splitWord': // FIXME REVIEW
          return 'Click on the word/number that you would like to split.';
        case 'mergeLine':
          return 'Use the checkboxes that appear to select two consecutive lines that you would like to merge.';
        case 'mergeWord': // FIXME REVIEW
          return 'Use the checkboxes that appear to select two consecutive words/numbers that you would like to merge.';
        case 'reorderSign': // FIXME REVIEW
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

    return {
      instructionalText,
    };
  },
});
</script>

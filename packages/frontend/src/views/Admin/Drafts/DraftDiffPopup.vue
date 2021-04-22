<template>
  <OareDialog
    v-if="viewingDraft"
    :title="`${viewingDraft.textName} Draft`"
    :width="1000"
    :show-submit="false"
    :show-cancel="false"
    :close-button="true"
    :persistent="false"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <span class="mb-2">
      <span class="font-weight-bold mr-1">Author Notes:</span>
      {{ viewingDraft.notes || 'No notes' }}
    </span>
    <code-diff
      :old-string="viewingDraft.originalText"
      :new-string="draftText"
      output-format="side-by-side"
      :render-nothing-when-empty="false"
      :draw-file-list="true"
    />
  </OareDialog>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { TextDraft } from '@oare/types';
import CodeDiff from 'vue-code-diff';

export default defineComponent({
  name: 'DraftDiffPopup',
  components: {
    CodeDiff,
  },
  props: {
    viewingDraft: {
      type: Object as PropType<TextDraft>,
      required: true,
    },
  },
  setup({ viewingDraft }) {
    const draftText = computed(() =>
      viewingDraft.content
        .map(({ side, text }) => `${side}\n${text}`)
        .join('\n')
    );

    return {
      draftText,
    };
  },
});
</script>

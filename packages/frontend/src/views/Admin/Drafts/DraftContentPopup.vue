<template>
  <div class="ml-1">
    <div class="d-flex flex-row">
      <span class="font-weight-bold mr-1">Notes:</span>
      {{ draft.notes || 'No notes' }}
    </div>
    <div
      v-for="(sideData, sideIndex) in draft.content"
      :key="sideIndex"
      class="mt-3"
    >
      <b>{{ sideData.side }}</b>
      <div
        v-for="(line, lineIndex) in sideData.text.split('\n')"
        :key="`line${lineIndex}`"
      >
        {{ line }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { TextDraftWithUser } from '@oare/types';

export default defineComponent({
  props: {
    draft: {
      type: Object as PropType<Pick<TextDraftWithUser, 'notes' | 'content'>>,
      required: true,
    },
  },
});
</script>

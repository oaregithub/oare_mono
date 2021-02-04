<template>
  <div>
    <EpigraphyReading
      :epigraphicUnits="epigraphicUnits"
      :markupUnits="markupUnits"
    />
    <DiscourseReading :discourseUnits="discourseUnits" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { EpigraphicUnit, MarkupUnit, DiscourseUnit } from '@oare/types';
import EpigraphyReading from './EpigraphyReading.vue';
import DiscourseReading from './DiscourseReading.vue';

export default defineComponent({
  props: {
    epigraphicUnits: {
      type: Array as PropType<EpigraphicUnit[]>,
      required: true,
    },
    markupUnits: {
      type: Array as PropType<MarkupUnit[]>,
      required: true,
    },
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
  },
  components: {
    EpigraphyReading,
    DiscourseReading,
  },
});
</script>

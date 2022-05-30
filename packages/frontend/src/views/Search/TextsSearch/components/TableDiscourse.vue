<template>
  <p>
    <span v-for="side in discourseRenderer.sides" :key="side">
      <span class="mr-1">({{ getSideByNumber(side) }})</span>
      <span
        v-for="line in discourseRenderer.linesOnSide(side)"
        :key="line"
        class="mr-1"
      >
        <sup>{{ formatLineNumber(line, false) }}</sup
        ><span
          v-html="
            discourseRenderer.lineReadingForWordsInTexts(line, discourseUuids)
          "
        />
      </span>
    </span>
  </p>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { DiscourseUnit, EpigraphicUnitSide } from '@oare/types';
import { DiscourseHtmlRenderer } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';

export default defineComponent({
  props: {
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
    discourseUuids: {
      type: Array as PropType<String[]>,
      required: true,
    },
  },
  setup({ discourseUnits }) {
    const discourseRenderer = new DiscourseHtmlRenderer(discourseUnits);

    const getSideByNumber = (number: number | null): EpigraphicUnitSide => {
      switch (number) {
        case 1:
          return 'obv.';
        case 2:
          return 'lo.e.';
        case 3:
          return 'rev.';
        case 4:
          return 'u.e.';
        case 5:
          return 'le.e.';
        default:
          return 'r.e.';
      }
    };

    return {
      discourseRenderer,
      formatLineNumber,
      getSideByNumber,
    };
  },
});
</script>

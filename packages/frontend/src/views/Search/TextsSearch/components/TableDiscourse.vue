<template>
  <p>
    <span v-for="side in discourseRenderer.sides" :key="side">
      <span class="mr-1">({{ convertSideNumberToSide(side) }})</span>
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
import { DiscourseUnit, LocaleCode } from '@oare/types';
import { DiscourseHtmlRenderer, convertSideNumberToSide } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import i18n from '@/i18n';

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
    const discourseRenderer = new DiscourseHtmlRenderer(
      discourseUnits,
      i18n.locale as LocaleCode
    );

    return {
      discourseRenderer,
      formatLineNumber,
      convertSideNumberToSide,
    };
  },
});
</script>

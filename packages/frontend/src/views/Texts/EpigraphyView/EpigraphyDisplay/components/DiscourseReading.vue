<template>
  <div>
    <p class="mt-5 oare-title font-weight-regular">
      <span v-for="line in discourseRenderer.lines" :key="line" class="mr-1">
        <sup>{{ formatLineNumber(line, false) }})</sup
        ><span v-html="discourseRenderer.lineReading(line)" />
      </span>
    </p>
    <v-treeview
      open-all
      dense
      :items="discourseUnits"
      item-children="units"
      item-key="uuid"
      item-text="spelling"
    >
      <template #label="{ item }">
        <div
          :class="`${discourseColor(item.type)}--text`"
          style="white-space: normal"
          v-html="discourseReading(item)"
        ></div>
        <v-btn
         @click="discourseEdit(item)">Edit</v-btn>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { DiscourseUnit } from '@oare/types';
import { DiscourseHtmlRenderer } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';

export default defineComponent({
  props: {
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
  },
  setup({ discourseUnits }) {
    const discourseRenderer = new DiscourseHtmlRenderer(discourseUnits);

    const discourseColor = (discourseType: string) => {
      switch (discourseType) {
        case 'paragraph':
          return 'red';
        case 'sentence':
          return 'blue';
        case 'clause':
          return 'purple';
        case 'phrase':
          return 'green';
        default:
          return 'black';
      }
    };

    const discourseReading = (discourse: DiscourseUnit) => {
      let reading;
      if (
        (discourse.type === 'discourseUnit' || discourse.type === 'sentence') &&
        discourse.translation
      ) {
        reading = discourse.translation;
      } else if (
        (discourse.type === 'paragraph' ||
          discourse.type === 'clause' ||
          discourse.type === 'phrase') &&
        discourse.paragraphLabel
      ) {
        reading = discourse.paragraphLabel;
      } else if (discourse.type === 'word') {
        if (discourse.transcription && discourse.spelling) {
          reading = `${discourse.transcription} (${discourse.spelling})`;
        } else {
          reading = discourse.spelling;
        }
      } else {
        reading = discourse.spelling;
      }

      if (discourse.type === 'paragraph') {
        reading = `<strong><em>${reading}</em></strong>`;
      } else if (discourse.type === 'clause' || discourse.type === 'phrase') {
        reading = `<em>${reading}</em>`;
      }
      return reading;
    };

    const discourseEdit = (discourse: DiscourseUnit) => {
      console.log(discourse);
    };

    return {
      discourseRenderer,
      discourseColor,
      discourseReading,
      discourseEdit,
      formatLineNumber,
    };
  },
});
</script>

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
        <v-icon v-if="item.translation && editingUuid !== item.uuid && allowEditing" @click="startEdit(item)"
          >mdi-pencil</v-icon
        >
        <div v-else-if="item.translation && allowEditing">
          <v-textarea
            label="Translation"
            auto-grow
            outlined
            rows="1"
            row-height="15"
            v-model="inputTranslation"
          ></v-textarea>
          <v-btn @click="discourseEdit(item)">SAVE</v-btn>
          <v-btn @click="editingUuid = ''">CLOSE</v-btn>
        </div>
        <div
          :class="`${discourseColor(item.type)}--text`"
          style="white-space: normal; display: inline-block;"
          v-html="discourseReading(item)"
        ></div>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { DiscourseUnit } from '@oare/types';
import { DiscourseHtmlRenderer } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
  },
  setup({ discourseUnits }) {
    const discourseRenderer = new DiscourseHtmlRenderer(discourseUnits);
    const server = sl.get('serverProxy');
    const editingUuid = ref('');
    const inputTranslation = ref('');

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

    const startEdit = (discourse: DiscourseUnit) => {
      editingUuid.value = discourse.uuid || '';
      inputTranslation.value = discourse.translation || '';
    };

    const discourseEdit = async (discourse: DiscourseUnit) => {
      await server.updateDiscourseTranslation(
        discourse.uuid,
        inputTranslation.value
      );
      discourse.translation = inputTranslation.value;
      editingUuid.value = '';
    };

    return {
      discourseRenderer,
      discourseColor,
      discourseReading,
      startEdit,
      discourseEdit,
      formatLineNumber,
      editingUuid,
      inputTranslation,
    };
  },
});
</script>

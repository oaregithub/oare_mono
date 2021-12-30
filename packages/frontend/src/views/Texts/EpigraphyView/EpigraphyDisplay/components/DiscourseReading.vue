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
        <v-btn v-if="editingUuid !== item.uuid" @click="startEdit(item)"
          >Edit</v-btn
        >

        <div v-else>
          <div v-if="item.transcription">
            <span>Transcription</span>
            <input
              type="text"
              v-model="inputTranscription"
            />
          </div>

          <div v-if="item.spelling">
            <span>Spelling</span>
            <input
              type="text"
              v-model="inputSpelling"
            />
          </div>

          <div v-if="item.translation">
            <span>Translation</span>
            <input
              type="text"
              v-model="inputTranslation"
            />
          </div>

          <div v-if="item.paragraphLabel">
            <span>Paragraph Label</span>
            <input
              type="text"
              v-model="inputParagraphLabel"
            />
          </div>

          <v-btn @click="discourseEdit(item)">SAVE</v-btn>
          <v-btn @click="editingUuid = ''">CLOSE</v-btn>
        </div>
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
  },
  setup({ discourseUnits }) {
    const discourseRenderer = new DiscourseHtmlRenderer(discourseUnits);
    const server = sl.get('serverProxy');
    const editingUuid = ref('');
    const inputTranscription = ref('');
    const inputSpelling = ref('');
    const inputTranslation = ref('');
    const inputParagraphLabel = ref('');

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

      if (discourse.transcription) {
        inputTranscription.value = discourse.transcription;
      }

      if (discourse.spelling) {
        inputSpelling.value = discourse.spelling;
      }

      if (discourse.translation) {
        inputTranslation.value = discourse.translation;
      }

      if (discourse.paragraphLabel) {
        inputParagraphLabel.value = discourse.paragraphLabel;
      }
    };

    const discourseEdit = async (discourse: DiscourseUnit) => {

      if (discourse.transcription) {
        await server.updateDiscourseTranscription(
          discourse.uuid,
          inputTranscription.value
        );
        discourse.transcription = inputTranscription.value;
      }

      if (discourse.spelling) {
        await server.updateDiscourseSpelling(
          discourse.uuid,
          inputSpelling.value
        );
        discourse.spelling = inputSpelling.value;
      }

      if (discourse.translation) {
        await server.updateDiscourseTranslation(
          discourse.uuid,
          inputTranslation.value
        );
        discourse.translation = inputTranslation.value;
      }

      if (discourse.paragraphLabel) {
        await server.updateDiscourseParagraphLabel(
          discourse.uuid,
          inputParagraphLabel.value
        );
        discourse.paragraphLabel = inputParagraphLabel.value;
      }
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
      inputSpelling,
      inputTranscription,
      inputTranslation,
      inputParagraphLabel,
    };
  },
});
</script>

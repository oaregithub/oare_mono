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
        <v-row
          v-if="editingUuid !== item.uuid"
          class="ma-0 pa-0"
          align="center"
        >
          <v-btn
            icon
            v-if="item.translation && allowEditing"
            @click="startEdit(item)"
            class="mr-1 test-discourse-startedit"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-col>
            <p
              :class="`${discourseColor(item.type)}--text`"
              class="ma-0"
              style="white-space: normal"
              v-html="discourseReading(item)"
            />
          </v-col>
        </v-row>
        <div v-else-if="item.translation && allowEditing">
          <v-textarea
            label="Translation"
            auto-grow
            outlined
            rows="1"
            v-model="inputTranslation"
            class="ma-1 test-discourse-box"
            dense
            hide-details
          ></v-textarea>
          <OareLoaderButton
            :loading="editLoading"
            color="primary"
            @click="discourseEdit(item)"
            class="ma-1 test-discourse-button"
            >Save</OareLoaderButton
          >
          <v-btn color="primary" @click="editingUuid = ''" class="ma-1"
            >Cancel</v-btn
          >
        </div>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from '@vue/composition-api';
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
    const inputTranslation = ref('');
    const store = sl.get('store');
    const actions = sl.get('globalActions');

    const allowEditing = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('EDIT_TRANSLATION')
    );

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
      return reading || '';
    };

    const startEdit = (discourse: DiscourseUnit) => {
      editingUuid.value = discourse.uuid || '';
      inputTranslation.value = discourse.translation || '';
    };

    const discourseEdit = async (discourse: DiscourseUnit) => {
      try {
        await server.updateDiscourseTranslation(
          discourse.uuid,
          inputTranslation.value
        );
      } catch (err) {
        actions.showErrorSnackbar('Failed to update database', err as Error);
      } finally {
        discourse.translation = inputTranslation.value;
        editingUuid.value = '';
      }
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
      allowEditing,
    };
  },
});
</script>

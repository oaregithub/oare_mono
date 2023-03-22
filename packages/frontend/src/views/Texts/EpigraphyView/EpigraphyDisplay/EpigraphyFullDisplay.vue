<template>
  <div>
    <EpigraphyReading
      class="test-epigraphies mt-n8"
      :epigraphicUnits="epigraphicUnits"
      :discourseToHighlight="discourseToHighlight"
      :localDiscourseInfo="localDiscourseInfo"
      :commentMode="commentMode"
    />
    <DiscourseReading
      v-if="canViewDiscourses"
      :discourseUnits="discourseUnits"
      :textUuid="textUuid"
      :disableEditing="disableEditing"
      :commentMode="commentMode"
      class="test-discourses"
    />
    <TextSourceReading
      v-if="canViewTextSource && textUuid"
      :textUuid="textUuid"
      class="test-textsource"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { EpigraphicUnit, DiscourseUnit, TextDiscourseRow } from '@oare/types';
import EpigraphyReading from './components/EpigraphyReading.vue';
import DiscourseReading from './components/DiscourseReading.vue';
import TextSourceReading from './components/TextSourceReading.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    epigraphicUnits: {
      type: Array as PropType<EpigraphicUnit[]>,
      required: true,
    },
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
    textUuid: {
      type: String,
      required: false,
    },
    discourseToHighlight: {
      type: String,
      required: false,
    },
    localDiscourseInfo: {
      type: Array as PropType<TextDiscourseRow[]>,
      required: false,
    },
    disableEditing: {
      type: Boolean,
      default: false,
    },
    commentMode: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    EpigraphyReading,
    DiscourseReading,
    TextSourceReading,
  },
  setup(props) {
    const store = sl.get('store');

    const canViewDiscourses = computed(() =>
      store.hasPermission('VIEW_TEXT_DISCOURSE')
    );

    const canViewTextSource = computed(() =>
      store.hasPermission('VIEW_TEXT_FILE')
    );

    return {
      canViewDiscourses,
      canViewTextSource,
    };
  },
});
</script>

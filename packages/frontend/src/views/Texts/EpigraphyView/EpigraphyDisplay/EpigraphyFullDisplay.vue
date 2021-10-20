<template>
  <div>
    <EpigraphyReading
      class="test-epigraphies"
      :epigraphicUnits="epigraphicUnits"
      :discourseToHighlight="discourseToHighlight"
      :localDiscourseInfo="localDiscourseInfo"
    />
    <DiscourseReading
      v-if="canViewDiscourses"
      :discourseUnits="discourseUnits"
      class="test-discourses"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { EpigraphicUnit, DiscourseUnit, TextDiscourseRow } from '@oare/types';
import EpigraphyReading from './components/EpigraphyReading.vue';
import DiscourseReading from './components/DiscourseReading.vue';
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
    discourseToHighlight: {
      type: String,
      required: false,
    },
    localDiscourseInfo: {
      type: Array as PropType<TextDiscourseRow[]>,
      required: false,
    },
  },
  components: {
    EpigraphyReading,
    DiscourseReading,
  },
  setup() {
    const store = sl.get('store');

    const canViewDiscourses = computed(() =>
      store.getters.permissions
        .map(permission => permission.name)
        .includes('VIEW_TEXT_DISCOURSE')
    );

    return {
      canViewDiscourses,
    };
  },
});
</script>

<template>
  <div>
    <EpigraphyReading
      :epigraphicUnits="epigraphicUnits"
      :markupUnits="markupUnits"
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
import { EpigraphicUnit, MarkupUnit, DiscourseUnit } from '@oare/types';
import EpigraphyReading from './components/EpigraphyReading.vue';
import DiscourseReading from './components/DiscourseReading.vue';
import sl from '@/serviceLocator';

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

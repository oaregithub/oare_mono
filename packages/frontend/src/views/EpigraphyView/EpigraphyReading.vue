<template>
  <div v-if="renderer" class="mr-10">
    <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
      <div class="sideName oare-title mr-4">
        {{ sideName }}
      </div>
      <div>
        <div
          v-for="lineNum in renderer.linesOnSide(sideName)"
          :key="lineNum"
          class="oare-title"
        >
          <sup>{{ lineNum }}.&nbsp;</sup>
          <span v-html="renderer.lineReading(lineNum)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { createTabletRenderer } from '@oare/oare';
import { EpigraphicUnit, MarkupUnit } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'EpigraphyReading',
  props: {
    epigraphicUnits: {
      type: Array as PropType<EpigraphicUnit[]>,
      required: true,
    },
    markupUnits: {
      type: Array as PropType<MarkupUnit[]>,
      required: true,
    },
  },
  setup(props) {
    const store = sl.get('store');

    const renderer = computed(() =>
      createTabletRenderer(props.epigraphicUnits, props.markupUnits, {
        admin: store.getters.isAdmin,
        textFormat: 'html',
      })
    );

    return {
      renderer,
    };
  },
});
</script>

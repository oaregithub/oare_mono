<template>
  <div v-if="renderer" class="mr-10">
    <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
      <div class="side-name oare-title mr-4">
        {{ sideName }}
      </div>
      <div>
        <div
          v-for="lineNum in renderer.linesOnSide(sideName)"
          :key="lineNum"
          class="oare-title d-flex"
        >
          <sup class="line-num pt-3">{{ lineNumber(lineNum) }}&nbsp;</sup>
          <span
            v-if="renderer.isRegion(lineNum)"
            v-html="renderer.lineReading(lineNum)"
          />
          <span v-else>
            <span
              v-for="(word, index) in renderer.getLineWords(lineNum)"
              :key="index"
              v-html="word.reading"
              class="mr-1"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { createTabletRenderer } from '@oare/oare';
import { EpigraphicUnit } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'EpigraphyReading',
  props: {
    epigraphicUnits: {
      type: Array as PropType<EpigraphicUnit[]>,
      required: true,
    },
  },
  setup(props) {
    const store = sl.get('store');

    const renderer = computed(() => {
      return createTabletRenderer(props.epigraphicUnits, {
        admin: store.getters.isAdmin,
        textFormat: 'html',
      });
    });

    const lineNumber = (line: number): string =>
      renderer.value.isRegion(line) ? '' : `${line}.`;

    return {
      renderer,
      lineNumber,
    };
  },
});
</script>

<style scoped>
.line-num {
  width: 25px;
}

.side-name {
  width: 50px;
}
</style>

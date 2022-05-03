<template>
  <OareContentView title="Final Preview">
    <epigraphy-view
      disableEditing
      :localEpigraphyUnits="epigraphyDetails"
      :localImageUrls="photoUrls"
      :localDiscourseInfo="localDiscourseInfo"
      class="ml-n6"
    />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { EpigraphyResponse, TextDiscourseRow } from '@oare/types';
import EpigraphyView from '@/views/Texts/EpigraphyView/index.vue';

export default defineComponent({
  props: {
    epigraphyDetails: {
      type: Object as PropType<EpigraphyResponse>,
      required: true,
    },
    photoUrls: {
      type: Array as PropType<string[]>,
      required: true,
    },
    localDiscourseInfo: {
      type: Array as PropType<TextDiscourseRow[]>,
      required: true,
    },
  },
  components: {
    EpigraphyView,
  },
  setup() {
    return {};
  },
});
</script>
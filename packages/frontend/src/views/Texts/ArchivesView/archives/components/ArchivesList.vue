<template>
  <div>
    <div class="pb-1" v-for="(archive, idx) in archives" :key="idx">
      <archive-info-component :archive="archive" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { ArchiveInfo } from '@oare/types';
import ArchiveInfoComponent from './ArchiveInfo.vue';

export default defineComponent({
  name: 'ArchivesList',
  components: {
    ArchiveInfoComponent,
  },
  props: {
    archives: {
      type: Array as PropType<ArchiveInfo[]>,
      required: true,
    },
  },
});
</script>

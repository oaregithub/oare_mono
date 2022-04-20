<template>
  <div>
    <div v-for="(archive, idx) in archives" :key="idx">
      <router-link :to="`/archives/${archive.uuid}`"
        >{{ archive.name }} ({{ archive.totalTexts }} texts |
        {{ archive.totalDossiers }} dossiers)</router-link
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { ArchiveInfo } from '@oare/types';

export default defineComponent({
  name: 'ArchivesList',
  props: {
    archives: {
      type: Array as PropType<ArchiveInfo[]>,
      required: true,
    },
  },
});
</script>

<template>
  <OareContentView title="About">
    <div class="title font-weight-regular">
      <page-content pageName="about" />
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import PageContent from '@/components/base/OarePageContent.vue';

export default defineComponent({
  components: {
    PageContent,
  },
  setup() {
    return {};
  },
});
</script>

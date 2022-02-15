<template>
  <OareContentView title="About">
    <div class="title font-weight-regular">
      <v-btn v-if="isAdmin" depressed color="primary">Edit</v-btn>
      <br />
      <page-content pageName="about" />
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import PageContent from '@/components/base/OarePageContent.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  components: {
    PageContent,
  },
  setup() {
    const store = sl.get('store');
    const isAdmin = computed(() => store.getters.isAdmin);

    return {
      isAdmin,
    };
  },
});
</script>

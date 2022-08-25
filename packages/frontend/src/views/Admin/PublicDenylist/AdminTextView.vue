<template>
  <OareContentView :title="`Public Denylist ${title}`">
    <v-tabs class="mb-3" v-model="tab">
      <v-tab to="/admin/denylist/texts">Texts</v-tab>
      <v-tab to="/admin/denylist/collections">Collections</v-tab>
      <v-tab to="/admin/denylist/images">Images</v-tab>
    </v-tabs>
    <keep-alive>
      <router-view />
    </keep-alive>
  </OareContentView>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'AdminTextView',
  setup() {
    const tab = ref(null);

    const title = computed(() => {
      if (tab.value === '/admin/denylist/texts') {
        return 'Texts';
      } else {
        return 'Collections';
      }
    });

    return {
      tab,
      title,
    };
  },
});
</script>

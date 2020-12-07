<template>
  <OareContentView title="Public Blacklist Texts">
    <v-tabs class="mb-3" v-model="tab">
      <v-tab to="/admin/blacklist/texts">Texts</v-tab>
      <v-tab to="/admin/blacklist/collections">Collections</v-tab>
    </v-tabs>
    <keep-alive>
      <router-view />
    </keep-alive>
  </OareContentView>
</template>

<script>
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'AdminTextView',
  setup({ groupId }) {
    const tab = ref(null);

    return {
      tab,
    };
  },
});
</script>

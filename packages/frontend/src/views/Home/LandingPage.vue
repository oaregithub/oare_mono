<template>
  <OareContentView>
    <v-row justify="center" class="title font-weight-regular">
      <v-col cols="12" lg="10">
        <v-btn v-if="isAdmin" depressed color="primary" v-on="edit">Edit</v-btn>
        <br />
        <page-content pageName="home" />
      </v-col>
    </v-row>
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
  methods: {
    edit() {},
  },
});
</script>

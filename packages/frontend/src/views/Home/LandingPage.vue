<template>
  <OareContentView>
    <v-row justify="center" class="title font-weight-regular">
      <v-col cols="12" lg="10">
        <page-content pageName="home" />
      </v-col>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import PageContent from '@/views/PageContent/index.vue';

export default defineComponent({
  components: {
    PageContent,
  },
  setup() {},
});
</script>

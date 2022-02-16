<template>
  <OareContentView>
    <v-row justify="center" class="title font-weight-regular">
      <v-col cols="12" lg="10">
<<<<<<< HEAD
        <v-btn v-if="isAdmin" depressed color="primary" v-on="edit">Edit</v-btn>
        <br />
=======
>>>>>>> master
        <page-content pageName="home" />
      </v-col>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
<<<<<<< HEAD
import { defineComponent, computed } from '@vue/composition-api';
import PageContent from '@/components/base/OarePageContent.vue';
import sl from '@/serviceLocator';
=======
import { defineComponent } from '@vue/composition-api';
import PageContent from '@/components/base/OarePageContent.vue';
>>>>>>> master

export default defineComponent({
  components: {
    PageContent,
  },
<<<<<<< HEAD
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
=======
  setup() {},
>>>>>>> master
});
</script>

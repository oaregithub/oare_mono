<template>
  <v-menu offset-y open-on-hover v-if="imageLink">
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      <v-img :src="imageLink" max-width="500px"></v-img>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const server = sl.get('serverProxy');
    const imageLink = ref<string | null>(null);

    onMounted(async () => {
      imageLink.value = await server.getResourceObject('explanation');
    });

    return {
      imageLink,
    };
  },
});
</script>

<style></style>

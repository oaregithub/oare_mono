<template>
  <v-menu offset-y open-on-hover>
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      <v-img :src="imageLink"></v-img>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const server = sl.get('serverProxy');
    const imageLink = ref('');

    onMounted(async () => {
      imageLink.value = await server.getDirectObjectLink(
        'explanation_image.jpg',
        'oare-image-bucket'
      );
    });

    return {
      imageLink,
    };
  },
});
</script>

<style></style>

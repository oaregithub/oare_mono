<template>
  <v-menu offset-y open-on-hover>
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
    const imageLink = ref('');

    onMounted(async () => {
      imageLink.value = await server.getDirectObjectLink(
        '3d4d9397-b6a8-11ec-bcc3-0282f921eac9'
      );
    });

    return {
      imageLink,
    };
  },
});
</script>

<style></style>

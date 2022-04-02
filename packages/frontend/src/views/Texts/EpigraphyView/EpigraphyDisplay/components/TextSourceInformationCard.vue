<template>
  <v-menu offset-y open-on-hover>
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      {{ textInfo }}
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent, ref} from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    //const server = sl.get('serverProxy');
    //const actions = sl.get('globalActions');
    const textInfo = ref('Hello, world!');

    return {
      textInfo,
    };
  }
});
</script>

<style></style>

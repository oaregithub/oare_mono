<template>
  <OareContentView title="Seals" :loading="loading">
    <div class="d-flex d-flex-row" v-for="(seal, idx) in seals" :key="idx">
      <span class="align-self-center flex-shrink-0"
        ><router-link :to="`/seals/${seal.uuid}`">{{ seal.name }}</router-link>
        ({{ seal.count }})</span
      ><v-img
        class="flex-shrink-1"
        v-if="seal.imageLinks.length > 0"
        height="80px"
        max-width="300px"
        :src="seal.imageLinks[0]"
        contain
      ></v-img>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from '@vue/composition-api';
import { SealInfo } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'SealsView',
  components: {},
  setup() {
    const loading = ref(false);
    const seals: Ref<SealInfo[]> = ref([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    onMounted(async () => {
      loading.value = true;
      try {
        seals.value = await server.getAllSeals();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading seals. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      seals,
    };
  },
});
</script>

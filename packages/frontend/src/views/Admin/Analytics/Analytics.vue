<template>
  <oare-content-view title="Site Analytics" :loading="loading">
    <div>
      <v-card max-height="100%"
        ><iframe
          class="test-iframe"
          width="100%"
          height="1000"
          :src="src"
          frameborder="0"
          style="border: 0"
          allowfullscreen
        ></iframe
      ></v-card>
    </div>
    <div class="pt-4">
      <v-btn class="test-button" :href="href" target="_blank">
        Go to Google Analytics
      </v-btn>
    </div>
  </oare-content-view>
</template>

<script lang="ts">
import OareContentView from '@/components/base/OareContentView.vue';
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  components: { OareContentView },
  name: 'AnalyticsView',
  setup() {
    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');
    const src = ref('');
    const href = ref('');
    const loading = ref(false);

    onMounted(async () => {
      loading.value = true;
      try {
        const response = await server.getGoogleAnalyticsInfo();
        if (response.src) {
          src.value = response.src;
        }
        if (response.href) {
          href.value = response.href;
        }
      } catch (err) {
        actions.showErrorSnackbar('Error loading dashboard', err as Error);
      } finally {
        loading.value = false;
      }
    });
    return {
      src,
      href,
    };
  },
});
</script>

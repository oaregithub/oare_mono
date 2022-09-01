<template>
  <oare-content-view title="Site Analytics" :loading="loading">
    <div v-if="production">
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
    </div>
    <div v-else>
      <span class="test-page-unavailable"
        >This page is only available in production</span
      >
    </div>
  </oare-content-view>
</template>

<script lang="ts">
import OareContentView from '@/components/base/OareContentView.vue';
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  components: { OareContentView },
  name: 'AnalyticsView',
  setup() {
    const actions = sl.get('globalActions');
    const src = ref('');
    const href = ref('');
    const loading = ref(false);

    const production = computed(() => process.env.NODE_ENV === 'production');

    onMounted(async () => {
      loading.value = true;
      try {
        if (production.value) {
          src.value = process.env.VUE_APP_GOOGLE_ANALYTICS_DASHBOARD_SOURCE;
          href.value = process.env.VUE_APP_GOOGLE_ANALYTICS_HREF;
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
      production,
    };
  },
});
</script>

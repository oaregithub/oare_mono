<template>
  <oare-content-view title="Site Analytics">
    <div>
      <v-card max-height="100%"
        ><iframe
          class="test-iframe"
          width="100%"
          height="1000"
          src="https://datastudio.google.com/embed/reporting/dbd79424-5a61-4c78-9630-74c987f92816/page/tWDGB"
          frameborder="0"
          style="border: 0"
          allowfullscreen
        ></iframe
      ></v-card>
    </div>
    <div class="pt-4">
      <v-btn class="test-google-analytics-site"
        ><a
          class="blue-grey--text test-button"
          style="text-decoration: none"
          href="https://analytics.google.com/analytics/web/#/p327370913/realtime/overview?params=_u..nav%3Dmaui%26_u..comparisons%3D%5B%7B%22name%22:%22All%20Users%22,%22filters%22:%5B%7B%22isCaseSensitive%22:true,%22expression%22:%220%22,%22fieldName%22:%22audience%22%7D%5D%7D%5D%26_u..pageSize%3D25"
          target="_blank"
          >Go to Google Analytics</a
        ></v-btn
      >
    </div>
  </oare-content-view>
</template>

<script lang="ts">
import OareContentView from '@/components/base/OareContentView.vue';
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  components: { OareContentView },
  name: 'AnalyticsView',
});
</script>

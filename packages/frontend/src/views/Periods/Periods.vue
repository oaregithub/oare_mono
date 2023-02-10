<template>
  <OareContentView
    title="Periods"
    informationCard="This is the list of periods."
    :loading="loading"
  >
    <div v-if="!loading">
      <PeriodYear v-for="(year, idx) in periods.years" :key="idx" :year="year">
      </PeriodYear>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import { PeriodResponse } from '@oare/types';
import PeriodYear from './PeriodYear.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'PeriodsView',
  components: { PeriodYear },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const loading = ref(true);
    const periods = ref<PeriodResponse>();

    onMounted(async () => {
      try {
        loading.value = true;
        periods.value = await server.getPeriods();
      } catch (err) {
        actions.showErrorSnackbar('Error retrieving periods', err as Error);
      } finally {
        loading.value = false;
      }
    });

    return {
      periods,
      loading,
    };
  },
});
</script>

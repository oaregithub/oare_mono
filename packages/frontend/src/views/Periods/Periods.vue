<template>
  <OareContentView
    title="Periods"
    informationCard="This is the list of periods."
    :loading="loading"
  >
    <v-switch
      color="primary"
      v-model="filterSwitch"
      label="Show All Known Periods"
    >
    </v-switch>
    <span v-show="filterSwitch">
      This draws all periods known from year lists, regardless of whether the
      year, month, or week shows up in practical documents.
    </span>

    <span v-show="!filterSwitch">
      This filter shows only years that are mentioned in practical documents or
      have a month or week from that year mentioned in a practical document.
    </span>
    <div v-if="!loading && periods">
      <PeriodYear
        v-for="(year, idx) in getPeriods.years"
        :key="idx"
        :year="year"
      >
      </PeriodYear>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import { PeriodResponse } from '@oare/types';
import PeriodYear from './PeriodYear.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'PeriodsView',
  components: { PeriodYear },

  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const loading = ref(false);
    const periods = ref<PeriodResponse>({ years: [] });
    const filterSwitch = ref(false);

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

    const getPeriods = computed(() => {
      if (!filterSwitch.value && periods.value.years) {
        const filteredPeriods: PeriodResponse = {
          years: periods.value.years.filter(
            year =>
              year.occurrences > 0 ||
              year.months.some(month => month.occurrences > 0) ||
              year.months.some(month =>
                month.weeks.some(week => week.occurrences > 0)
              )
          ),
        };
        return filteredPeriods;
      } else {
        return periods.value;
      }
    });

    function filterPeriods(value: boolean) {
      filterSwitch.value = value;
    }

    return {
      periods,
      loading,
      filterSwitch,
      getPeriods,
      filterPeriods,
    };
  },
});
</script>
